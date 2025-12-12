import { z} from 'zod';

export const chains = ['solana', 'ethereum', 'bsc'] as const;
export const networks = ['mainnet', 'testnet'] as const;
export const operations = ['CREATE', 'MINT', 'BURN', 'PAUSE', 'FREEZE', 'AUTHORITY', 'MULTISEND'] as const;
export const transactionStatuses = ['idle', 'pending', 'confirming', 'success', 'error'] as const;

export type Chain = typeof chains[number];
export type Network = typeof networks[number];
export type Operation = typeof operations[number];
export type TransactionStatus = typeof transactionStatuses[number];

export const transactionStatusSchema = z.object({
  status: z.enum(transactionStatuses),
  message: z.string().optional(),
  signature: z.string().optional(),
  explorerUrl: z.string().optional(),
  error: z.string().optional(),
  mintAddress: z.string().optional(),
  contractAddress: z.string().optional(),
});

export type TransactionStatusType = z.infer<typeof transactionStatusSchema>;

export const solanaCreateTokenSchema = z.object({
  chain: z.literal('solana'),
  network: z.enum(networks),
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10).toUpperCase(),
  description: z.string().max(500).optional(),
  decimals: z.number().int().min(0).max(9).default(9),
  supply: z.string().regex(/^\d+(\.\d+)?$/),
  logoUrl: z.string().url().optional(),
  logoIpfsHash: z.string().optional(),
  website: z.string().url().optional(),
  twitter: z.string().url().optional(),
  telegram: z.string().url().optional(),
  revokeFreezeAuthority: z.boolean().default(true),
  revokeMintAuthority: z.boolean().default(false),
  revokeUpdateAuthority: z.boolean().default(false),
});

export type SolanaCreateTokenRequest = z.infer<typeof solanaCreateTokenSchema>;

export const evmCreateTokenSchema = z.object({
  chain: z.enum(['ethereum', 'bsc']),
  network: z.enum(networks),
  name: z.string().min(1).max(50),
  symbol: z.string().min(1).max(20).toUpperCase(),
  decimals: z.number().int().min(0).max(18).default(18),
  supply: z.string().regex(/^\d+(\.\d+)?$/),
  logoUrl: z.string().url().optional(),
  logoIpfsHash: z.string().optional(),
  website: z.string().url().optional(),
  twitter: z.string().url().optional(),
  telegram: z.string().url().optional(),
  isMintable: z.boolean().default(false),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false),
  isCapped: z.boolean().default(false),
  hasTax: z.boolean().default(false),
  hasBlacklist: z.boolean().default(false),
  maxSupply: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  taxPercentage: z.number().min(0).max(25).optional(),
  treasuryWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});

export type EvmCreateTokenRequest = z.infer<typeof evmCreateTokenSchema>;

export const createTokenResponseSchema = z.object({
  success: z.boolean(),
  mintAddress: z.string().optional(),
  contractAddress: z.string().optional(),
  signature: z.string().optional(),
  txHash: z.string().optional(),
  explorerUrl: z.string().optional(),
  metadataUrl: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type CreateTokenResponse = z.infer<typeof createTokenResponseSchema>;

export const mintTokenSchema = z.object({
  chain: z.enum(chains),
  network: z.enum(networks),
  tokenAddress: z.string().min(1),
  recipient: z.string().min(1).optional(),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

export type MintTokenRequest = z.infer<typeof mintTokenSchema>;

export const burnTokenSchema = z.object({
  chain: z.enum(['ethereum', 'bsc']),
  network: z.enum(networks),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

export type BurnTokenRequest = z.infer<typeof burnTokenSchema>;

export const pauseTokenSchema = z.object({
  chain: z.enum(['ethereum', 'bsc']),
  network: z.enum(networks),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  pause: z.boolean(),
});

export type PauseTokenRequest = z.infer<typeof pauseTokenSchema>;

export const freezeAccountSchema = z.object({
  chain: z.literal('solana'),
  network: z.enum(networks),
  tokenAccount: z.string().min(1),
  mintAddress: z.string().min(1),
  freeze: z.boolean(),
});

export type FreezeAccountRequest = z.infer<typeof freezeAccountSchema>;

export const manageAuthoritySchema = z.object({
  chain: z.literal('solana'),
  network: z.enum(networks),
  mintAddress: z.string().min(1),
  authorityType: z.enum(['mint', 'freeze', 'update']),
  newAuthority: z.string().min(1).optional(),
});

export const revokeUpdateAuthoritySchema = z.object({
  chain: z.literal('solana'),
  network: z.enum(networks),
  mintAddress: z.string().min(1),
});

export type ManageAuthorityRequest = z.infer<typeof manageAuthoritySchema>;
export type RevokeUpdateAuthorityRequest = z.infer<typeof revokeUpdateAuthoritySchema>;

export const multiSendRecipientSchema = z.object({
  address: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

export const multiSendSchema = z.object({
  chain: z.enum(chains),
  network: z.enum(networks),
  tokenAddress: z.string().min(1),
  recipients: z.array(multiSendRecipientSchema).min(1).max(100),
});

export type MultiSendRecipient = z.infer<typeof multiSendRecipientSchema>;
export type MultiSendRequest = z.infer<typeof multiSendSchema>;

export const operationResponseSchema = z.object({
  success: z.boolean(),
  signature: z.string().optional(),
  txHash: z.string().optional(),
  explorerUrl: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type OperationResponse = z.infer<typeof operationResponseSchema>;

export function getExplorerUrl(
  txHash: string,
  chain: Chain,
  network: Network
): string {
  const explorers: Record<Chain, { mainnet: string; testnet: string }> = {
    solana: {
      mainnet: 'https://solscan.io',
      testnet: 'https://solscan.io',
    },
    ethereum: {
      mainnet: 'https://etherscan.io',
      testnet: 'https://sepolia.etherscan.io',
    },
    bsc: {
      mainnet: 'https://bscscan.com',
      testnet: 'https://testnet.bscscan.com',
    },
  };

  const baseUrl = explorers[chain][network];
  return chain === 'solana' 
    ? `${baseUrl}/tx/${txHash}${network === 'testnet' ? '?cluster=testnet' : ''}`
    : `${baseUrl}/tx/${txHash}`;
}

export function getTokenExplorerUrl(
  address: string,
  chain: Chain,
  network: Network
): string {
  const explorers: Record<Chain, { mainnet: string; testnet: string }> = {
    solana: {
      mainnet: 'https://solscan.io',
      testnet: 'https://solscan.io',
    },
    ethereum: {
      mainnet: 'https://etherscan.io',
      testnet: 'https://sepolia.etherscan.io',
    },
    bsc: {
      mainnet: 'https://bscscan.com',
      testnet: 'https://testnet.bscscan.com',
    },
  };

  const baseUrl = explorers[chain][network];
  return chain === 'solana'
    ? `${baseUrl}/token/${address}${network === 'testnet' ? '?cluster=testnet' : ''}`
    : `${baseUrl}/address/${address}`;
}

export function validateWalletAddress(address: string, chain: Chain): boolean {
  if (chain === 'solana') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } else {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
