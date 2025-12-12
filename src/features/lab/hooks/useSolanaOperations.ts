import { useState } from 'react';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  createFreezeAccountInstruction,
  createThawAccountInstruction,
  createTransferInstruction,
  AuthorityType,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  getMint,
  getAccount,
} from '@solana/spl-token';
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import type {
  SolanaCreateTokenRequest,
  MintTokenRequest,
  FreezeAccountRequest,
  ManageAuthorityRequest,
  MultiSendRequest,
  OperationResponse,
  CreateTokenResponse,
  TransactionStatusType,
} from '@shared/lab-schema';
import { getExplorerUrl } from '@shared/lab-schema';
import { toast } from '@/hooks/use-toast';

export function useSolanaOperations(connection: Connection | null) {
  const [txStatus, setTxStatus] = useState<TransactionStatusType>({
    status: 'idle',
  });

  const createToken = async (
    request: SolanaCreateTokenRequest,
    walletPublicKey: string
  ): Promise<CreateTokenResponse> => {
    if (!connection) throw new Error('No connection');
    if (!window.solana) throw new Error('Phantom wallet not found');

    try {
      setTxStatus({ status: 'pending', message: 'Preparing transaction...' });

      const payer = new PublicKey(walletPublicKey);
      const mintKeypair = Keypair.generate();
      const decimals = request.decimals;
      const supply = parseFloat(request.supply) * Math.pow(10, decimals);

      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      
      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMint2Instruction(
          mintKeypair.publicKey,
          decimals,
          payer,
          request.revokeFreezeAuthority ? null : payer,
          TOKEN_PROGRAM_ID
        )
      );

      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        payer
      );

      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer,
          associatedTokenAddress,
          payer,
          mintKeypair.publicKey
        ),
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedTokenAddress,
          payer,
          BigInt(supply)
        )
      );

      if (request.name || request.symbol || request.description) {
        const [metadataPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mintKeypair.publicKey.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
        );

        transaction.add(
          createCreateMetadataAccountV3Instruction(
            {
              metadata: metadataPDA,
              mint: mintKeypair.publicKey,
              mintAuthority: payer,
              payer: payer,
              updateAuthority: payer,
            },
            {
              createMetadataAccountArgsV3: {
                data: {
                  name: request.name,
                  symbol: request.symbol,
                  uri: request.logoUrl || '',
                  sellerFeeBasisPoints: 0,
                  creators: null,
                  collection: null,
                  uses: null,
                },
                isMutable: !request.revokeUpdateAuthority,
                collectionDetails: null,
              },
            }
          )
        );
      }

      if (request.revokeMintAuthority) {
        transaction.add(
          createSetAuthorityInstruction(
            mintKeypair.publicKey,
            payer,
            AuthorityType.MintTokens,
            null
          )
        );
      }

      setTxStatus({ status: 'confirming', message: 'Awaiting signature...' });
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;
      transaction.partialSign(mintKeypair);

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      setTxStatus({ status: 'confirming', message: 'Confirming transaction...', signature });

      await connection.confirmTransaction(signature, 'confirmed');

      const explorerUrl = getExplorerUrl(signature, 'solana', request.network);

      setTxStatus({
        status: 'success',
        message: 'Token created successfully!',
        signature,
        explorerUrl,
        mintAddress: mintKeypair.publicKey.toBase58(),
      });

      return {
        success: true,
        mintAddress: mintKeypair.publicKey.toBase58(),
        signature,
        explorerUrl,
        message: 'Token created successfully',
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to create token';
      setTxStatus({ status: 'error', error: errorMsg });
      toast({ title: 'Transaction Failed', description: errorMsg, variant: 'destructive' });
      return { success: false, error: errorMsg };
    }
  };

  const mintTokens = async (
    request: MintTokenRequest,
    walletPublicKey: string
  ): Promise<OperationResponse> => {
    if (!connection) throw new Error('No connection');
    if (!window.solana) throw new Error('Phantom wallet not found');

    try {
      setTxStatus({ status: 'pending', message: 'Preparing mint transaction...' });

      const payer = new PublicKey(walletPublicKey);
      const mintPubkey = new PublicKey(request.tokenAddress);
      const recipientPubkey = request.recipient
        ? new PublicKey(request.recipient)
        : payer;

      const mintInfo = await getMint(connection, mintPubkey);
      const amount = BigInt(parseFloat(request.amount) * Math.pow(10, mintInfo.decimals));

      const recipientTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        recipientPubkey
      );

      const transaction = new Transaction();

      try {
        await getAccount(connection, recipientTokenAccount);
      } catch {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            payer,
            recipientTokenAccount,
            recipientPubkey,
            mintPubkey
          )
        );
      }

      transaction.add(
        createMintToInstruction(
          mintPubkey,
          recipientTokenAccount,
          payer,
          amount
        )
      );

      setTxStatus({ status: 'confirming', message: 'Awaiting signature...' });

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      setTxStatus({ status: 'confirming', message: 'Confirming transaction...', signature });

      await connection.confirmTransaction(signature, 'confirmed');

      const explorerUrl = getExplorerUrl(signature, 'solana', request.network);

      setTxStatus({
        status: 'success',
        message: 'Tokens minted successfully!',
        signature,
        explorerUrl,
      });

      return {
        success: true,
        signature,
        explorerUrl,
        message: 'Tokens minted successfully',
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to mint tokens';
      setTxStatus({ status: 'error', error: errorMsg });
      toast({ title: 'Mint Failed', description: errorMsg, variant: 'destructive' });
      return { success: false, error: errorMsg };
    }
  };

  const freezeAccount = async (
    request: FreezeAccountRequest,
    walletPublicKey: string
  ): Promise<OperationResponse> => {
    if (!connection) throw new Error('No connection');
    if (!window.solana) throw new Error('Phantom wallet not found');

    try {
      setTxStatus({
        status: 'pending',
        message: `Preparing ${request.freeze ? 'freeze' : 'thaw'} transaction...`,
      });

      const payer = new PublicKey(walletPublicKey);
      const tokenAccount = new PublicKey(request.tokenAccount);
      const mintPubkey = new PublicKey(request.mintAddress);

      const transaction = new Transaction().add(
        request.freeze
          ? createFreezeAccountInstruction(tokenAccount, mintPubkey, payer)
          : createThawAccountInstruction(tokenAccount, mintPubkey, payer)
      );

      setTxStatus({ status: 'confirming', message: 'Awaiting signature...' });

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      setTxStatus({ status: 'confirming', message: 'Confirming transaction...', signature });

      await connection.confirmTransaction(signature, 'confirmed');

      const explorerUrl = getExplorerUrl(signature, 'solana', request.network);

      setTxStatus({
        status: 'success',
        message: `Account ${request.freeze ? 'frozen' : 'thawed'} successfully!`,
        signature,
        explorerUrl,
      });

      return {
        success: true,
        signature,
        explorerUrl,
        message: `Account ${request.freeze ? 'frozen' : 'thawed'} successfully`,
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to update account status';
      setTxStatus({ status: 'error', error: errorMsg });
      toast({ title: 'Operation Failed', description: errorMsg, variant: 'destructive' });
      return { success: false, error: errorMsg };
    }
  };

  const manageAuthority = async (
    request: ManageAuthorityRequest,
    walletPublicKey: string
  ): Promise<OperationResponse> => {
    if (!connection) throw new Error('No connection');
    if (!window.solana) throw new Error('Phantom wallet not found');

    try {
      setTxStatus({ status: 'pending', message: 'Preparing authority update...' });

      const payer = new PublicKey(walletPublicKey);
      const mintPubkey = new PublicKey(request.mintAddress);
      const newAuthority = request.newAuthority
        ? new PublicKey(request.newAuthority)
        : null;

      const authorityType =
        request.authorityType === 'mint'
          ? AuthorityType.MintTokens
          : AuthorityType.FreezeAccount;

      const transaction = new Transaction().add(
        createSetAuthorityInstruction(
          mintPubkey,
          payer,
          authorityType,
          newAuthority
        )
      );

      setTxStatus({ status: 'confirming', message: 'Awaiting signature...' });

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      setTxStatus({ status: 'confirming', message: 'Confirming transaction...', signature });

      await connection.confirmTransaction(signature, 'confirmed');

      const explorerUrl = getExplorerUrl(signature, 'solana', request.network);

      setTxStatus({
        status: 'success',
        message: 'Authority updated successfully!',
        signature,
        explorerUrl,
      });

      return {
        success: true,
        signature,
        explorerUrl,
        message: 'Authority updated successfully',
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to update authority';
      setTxStatus({ status: 'error', error: errorMsg });
      toast({ title: 'Update Failed', description: errorMsg, variant: 'destructive' });
      return { success: false, error: errorMsg };
    }
  };

  const multiSend = async (
    request: MultiSendRequest,
    walletPublicKey: string
  ): Promise<OperationResponse> => {
    if (!connection) throw new Error('No connection');
    if (!window.solana) throw new Error('Phantom wallet not found');

    try {
      setTxStatus({
        status: 'pending',
        message: `Preparing batch transfer to ${request.recipients.length} recipients...`,
      });

      const payer = new PublicKey(walletPublicKey);
      const mintPubkey = new PublicKey(request.tokenAddress);
      const mintInfo = await getMint(connection, mintPubkey);
      const sourceTokenAccount = await getAssociatedTokenAddress(mintPubkey, payer);

      const transaction = new Transaction();

      for (const recipient of request.recipients) {
        const recipientPubkey = new PublicKey(recipient.address);
        const recipientTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          recipientPubkey
        );

        try {
          await getAccount(connection, recipientTokenAccount);
        } catch {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              payer,
              recipientTokenAccount,
              recipientPubkey,
              mintPubkey
            )
          );
        }

        const amount = BigInt(
          parseFloat(recipient.amount) * Math.pow(10, mintInfo.decimals)
        );

        transaction.add(
          createTransferInstruction(
            sourceTokenAccount,
            recipientTokenAccount,
            payer,
            amount
          )
        );
      }

      setTxStatus({ status: 'confirming', message: 'Awaiting signature...' });

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      setTxStatus({ status: 'confirming', message: 'Confirming transaction...', signature });

      await connection.confirmTransaction(signature, 'confirmed');

      const explorerUrl = getExplorerUrl(signature, 'solana', request.network);

      setTxStatus({
        status: 'success',
        message: `Successfully sent to ${request.recipients.length} recipients!`,
        signature,
        explorerUrl,
      });

      return {
        success: true,
        signature,
        explorerUrl,
        message: `Batch transfer completed to ${request.recipients.length} recipients`,
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to complete batch transfer';
      setTxStatus({ status: 'error', error: errorMsg });
      toast({ title: 'Transfer Failed', description: errorMsg, variant: 'destructive' });
      return { success: false, error: errorMsg };
    }
  };

  const resetStatus = () => {
    setTxStatus({ status: 'idle' });
  };

  return {
    txStatus,
    createToken,
    mintTokens,
    freezeAccount,
    manageAuthority,
    multiSend,
    resetStatus,
  };
}
