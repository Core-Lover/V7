import { useState } from 'react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
import type {
  EvmCreateTokenRequest,
  MintTokenRequest,
  BurnTokenRequest,
  PauseTokenRequest,
  MultiSendRequest,
  OperationResponse,
  TransactionStatusType,
} from '@shared/lab-schema';
import { getExplorerUrl } from '@shared/lab-schema';
import { generateERC20Contract } from '../utils/blockchain';
import { toast } from '@/hooks/use-toast';

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount)',
  'function burn(uint256 amount)',
  'function pause()',
  'function unpause()',
  'function paused() view returns (bool)',
];

export function useEvmOperations(
  provider: BrowserProvider | null,
  chain: 'ethereum' | 'bsc',
  network: 'mainnet' | 'testnet'
) {
  const [txStatus, setTxStatus] = useState<TransactionStatusType>({
    status: 'idle',
  });

  const generateTokenContract = async (
    request: EvmCreateTokenRequest
  ): Promise<OperationResponse> => {
    try {
      setTxStatus({ status: 'pending', message: 'Generating contract code...' });

      const contractCode = generateERC20Contract({
        name: request.name,
        symbol: request.symbol,
        decimals: request.decimals,
        supply: request.supply,
        isMintable: request.isMintable,
        isBurnable: request.isBurnable,
        isPausable: request.isPausable,
        isCapped: request.isCapped,
        maxSupply: request.maxSupply,
      });

      setTxStatus({
        status: 'success',
        message: 'Contract code generated successfully! Deploy it using Remix IDE.',
      });

      return {
        success: true,
        message: contractCode,
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to generate contract';
      setTxStatus({ status: 'error', error: errorMsg });
      return { success: false, error: errorMsg };
    }
  };

  const mintTokens = async (
    request: MintTokenRequest,
    signerAddress: string
  ): Promise<OperationResponse> => {
    if (!provider) throw new Error('No provider');

    try {
      setTxStatus({ status: 'pending', message: 'Preparing mint transaction...' });

      const signer = await provider.getSigner();
      const contract = new Contract(request.tokenAddress, ERC20_ABI, signer);

      const decimals = await contract.decimals();
      const amount = parseUnits(request.amount, decimals);
      const recipient = request.recipient || signerAddress;

      setTxStatus({ status: 'confirming', message: 'Awaiting signature...' });

      const tx = await contract.mint(recipient, amount);

      setTxStatus({
        status: 'confirming',
        message: 'Confirming transaction...',
        signature: tx.hash,
      });

      const receipt = await tx.wait();

      const explorerUrl = getExplorerUrl(receipt.hash, chain, network);

      setTxStatus({
        status: 'success',
        message: 'Tokens minted successfully!',
        signature: receipt.hash,
        explorerUrl,
      });

      return {
        success: true,
        txHash: receipt.hash,
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

  const burnTokens = async (
    request: BurnTokenRequest
  ): Promise<OperationResponse> => {
    if (!provider) throw new Error('No provider');

    try {
      setTxStatus({ status: 'pending', message: 'Preparing burn transaction...' });

      const signer = await provider.getSigner();
      const contract = new Contract(request.tokenAddress, ERC20_ABI, signer);

      const decimals = await contract.decimals();
      const amount = parseUnits(request.amount, decimals);

      setTxStatus({ status: 'confirming', message: 'Awaiting signature...' });

      const tx = await contract.burn(amount);

      setTxStatus({
        status: 'confirming',
        message: 'Confirming transaction...',
        signature: tx.hash,
      });

      const receipt = await tx.wait();

      const explorerUrl = getExplorerUrl(receipt.hash, chain, network);

      setTxStatus({
        status: 'success',
        message: 'Tokens burned successfully!',
        signature: receipt.hash,
        explorerUrl,
      });

      return {
        success: true,
        txHash: receipt.hash,
        explorerUrl,
        message: 'Tokens burned successfully',
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to burn tokens';
      setTxStatus({ status: 'error', error: errorMsg });
      toast({ title: 'Burn Failed', description: errorMsg, variant: 'destructive' });
      return { success: false, error: errorMsg };
    }
  };

  const pauseToken = async (
    request: PauseTokenRequest
  ): Promise<OperationResponse> => {
    if (!provider) throw new Error('No provider');

    try {
      setTxStatus({
        status: 'pending',
        message: `Preparing ${request.pause ? 'pause' : 'unpause'} transaction...`,
      });

      const signer = await provider.getSigner();
      const contract = new Contract(request.tokenAddress, ERC20_ABI, signer);

      setTxStatus({ status: 'confirming', message: 'Awaiting signature...' });

      const tx = request.pause
        ? await contract.pause()
        : await contract.unpause();

      setTxStatus({
        status: 'confirming',
        message: 'Confirming transaction...',
        signature: tx.hash,
      });

      const receipt = await tx.wait();

      const explorerUrl = getExplorerUrl(receipt.hash, chain, network);

      setTxStatus({
        status: 'success',
        message: `Token ${request.pause ? 'paused' : 'unpaused'} successfully!`,
        signature: receipt.hash,
        explorerUrl,
      });

      return {
        success: true,
        txHash: receipt.hash,
        explorerUrl,
        message: `Token ${request.pause ? 'paused' : 'unpaused'} successfully`,
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to update pause status';
      setTxStatus({ status: 'error', error: errorMsg });
      toast({ title: 'Operation Failed', description: errorMsg, variant: 'destructive' });
      return { success: false, error: errorMsg };
    }
  };

  const approveToken = async (
    request: { chain: string; network: string; tokenAddress: string; spenderAddress: string; amount: string }
  ): Promise<OperationResponse> => {
    if (!provider) throw new Error('No provider');

    try {
      setTxStatus({ status: 'pending', message: 'Preparing approval transaction...' });

      const signer = await provider.getSigner();
      const contract = new Contract(request.tokenAddress, [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
      ], signer);

      const decimals = await contract.decimals();
      const amount = parseUnits(request.amount, decimals);

      setTxStatus({ status: 'confirming', message: 'Awaiting signature...' });

      const tx = await contract.approve(request.spenderAddress, amount);

      setTxStatus({
        status: 'confirming',
        message: 'Confirming transaction...',
        signature: tx.hash,
      });

      const receipt = await tx.wait();
      const explorerUrl = getExplorerUrl(receipt.hash, chain, network);

      setTxStatus({
        status: 'success',
        message: 'Approval successful!',
        signature: receipt.hash,
        explorerUrl,
      });

      return {
        success: true,
        txHash: receipt.hash,
        explorerUrl,
        message: 'Token approval successful',
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to approve tokens';
      setTxStatus({ status: 'error', error: errorMsg });
      toast({ title: 'Approval Failed', description: errorMsg, variant: 'destructive' });
      return { success: false, error: errorMsg };
    }
  };

  const multiSend = async (
    request: MultiSendRequest
  ): Promise<OperationResponse> => {
    if (!provider) throw new Error('No provider');

    try {
      setTxStatus({
        status: 'pending',
        message: `Preparing batch transfer to ${request.recipients.length} recipients...`,
      });

      const signer = await provider.getSigner();
      const contract = new Contract(request.tokenAddress, ERC20_ABI, signer);
      const decimals = await contract.decimals();

      const transactions = [];

      for (const recipient of request.recipients) {
        const amount = parseUnits(recipient.amount, decimals);
        setTxStatus({
          status: 'confirming',
          message: `Sending to ${recipient.address.slice(0, 8)}...`,
        });

        const tx = await contract.transfer(recipient.address, amount);
        const receipt = await tx.wait();
        transactions.push(receipt.hash);
      }

      const lastTxHash = transactions[transactions.length - 1];
      const explorerUrl = getExplorerUrl(lastTxHash, chain, network);

      setTxStatus({
        status: 'success',
        message: `Successfully sent to ${request.recipients.length} recipients!`,
        signature: lastTxHash,
        explorerUrl,
      });

      return {
        success: true,
        txHash: lastTxHash,
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
    generateTokenContract,
    mintTokens,
    burnTokens,
    pauseToken,
    approveToken,
    multiSend,
    resetStatus,
  };
}
