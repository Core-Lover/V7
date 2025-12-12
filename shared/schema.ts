import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, bigint, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Blockchain types
export type BlockchainType = "EVM" | "Solana";
export type NetworkType = "mainnet" | "testnet" | "devnet";

// Blockchain networks configuration
export const SUPPORTED_CHAINS = {
  // Ethereum Mainnet
  "ethereum-mainnet": {
    name: "Ethereum Mainnet",
    chainId: 1,
    symbol: "ETH",
    color: "120 100% 35%",
    blockchainType: "EVM" as BlockchainType,
    networkType: "mainnet" as NetworkType,
    explorerUrl: "https://etherscan.io",
  },
  // Ethereum Testnet (Sepolia)
  "ethereum-testnet": {
    name: "Ethereum Sepolia",
    chainId: 11155111,
    symbol: "SepoliaETH",
    color: "120 100% 45%",
    blockchainType: "EVM" as BlockchainType,
    networkType: "testnet" as NetworkType,
    explorerUrl: "https://sepolia.etherscan.io",
  },
  // BSC Mainnet
  "bsc-mainnet": {
    name: "BNB Smart Chain",
    chainId: 56,
    symbol: "BNB",
    color: "30 100% 50%",
    blockchainType: "EVM" as BlockchainType,
    networkType: "mainnet" as NetworkType,
    explorerUrl: "https://bscscan.com",
  },
  // BSC Testnet
  "bsc-testnet": {
    name: "BNB Testnet",
    chainId: 97,
    symbol: "tBNB",
    color: "30 100% 60%",
    blockchainType: "EVM" as BlockchainType,
    networkType: "testnet" as NetworkType,
    explorerUrl: "https://testnet.bscscan.com",
  },
  // Solana Testnet
  "solana-testnet": {
    name: "Solana Testnet",
    chainId: 0,
    symbol: "SOL",
    color: "280 100% 55%",
    blockchainType: "Solana" as BlockchainType,
    networkType: "testnet" as NetworkType,
    explorerUrl: "https://explorer.solana.com/?cluster=testnet",
  },
  // Solana Mainnet
  "solana-mainnet": {
    name: "Solana Mainnet",
    chainId: 0,
    symbol: "SOL",
    color: "280 100% 50%",
    blockchainType: "Solana" as BlockchainType,
    networkType: "mainnet" as NetworkType,
    explorerUrl: "https://explorer.solana.com",
  },
} as const;

export type ChainId = keyof typeof SUPPORTED_CHAINS;

// Token features for EVM chains
export const EVM_TOKEN_FEATURES = {
  mintable: {
    name: "Mintable",
    description: "Owner can create new tokens after deployment",
    icon: "Plus",
  },
  burnable: {
    name: "Burnable",
    description: "Token holders can permanently destroy their tokens",
    icon: "Flame",
  },
  pausable: {
    name: "Pausable",
    description: "Owner can pause all token transfers in emergencies",
    icon: "Pause",
  },
  capped: {
    name: "Capped Supply",
    description: "Set maximum supply limit that cannot be exceeded",
    icon: "Shield",
  },
  taxable: {
    name: "Transfer Tax",
    description: "Automatic tax on transfers sent to treasury wallet",
    icon: "Percent",
  },
  blacklist: {
    name: "Blacklist",
    description: "Block specific addresses from token transfers",
    icon: "Ban",
  },
} as const;

// Token types for Solana
export const SOLANA_TOKEN_TYPES = {
  standard: {
    name: "SPL Token",
    description: "Standard Solana token",
    features: ["Transfer", "Balance tracking"],
  },
  mintable: {
    name: "SPL Token (Mintable)",
    description: "Token with mint authority",
    features: ["Transfer", "Balance tracking", "Minting"],
  },
} as const;

export type EvmTokenFeature = keyof typeof EVM_TOKEN_FEATURES;
export type SolanaTokenType = keyof typeof SOLANA_TOKEN_TYPES;

// Deployed tokens table
export const deployedTokens = pgTable("deployed_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimals: integer("decimals").notNull().default(18),
  totalSupply: text("total_supply").notNull(),
  chainId: text("chain_id").notNull(),
  contractAddress: text("contract_address"),
  deployerAddress: text("deployer_address").notNull(),
  transactionHash: text("transaction_hash"),
  status: text("status").notNull().default("pending"),
  
  // EVM token features (individual flags)
  isMintable: boolean("is_mintable").default(false),
  isBurnable: boolean("is_burnable").default(false),
  isPausable: boolean("is_pausable").default(false),
  isCapped: boolean("is_capped").default(false),
  hasTax: boolean("has_tax").default(false),
  hasBlacklist: boolean("has_blacklist").default(false),
  maxSupply: text("max_supply"),
  taxPercentage: integer("tax_percentage"),
  treasuryWallet: text("treasury_wallet"),
  
  // Solana specific fields
  tokenType: text("token_type"),
  mintAuthority: text("mint_authority"),
  freezeAuthority: text("freeze_authority"),
  updateAuthority: text("update_authority"),
  
  // Token metadata
  logoUrl: text("logo_url"),
  description: text("description"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deployedAt: timestamp("deployed_at"),
});

export const insertDeployedTokenSchema = createInsertSchema(deployedTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertDeployedToken = z.infer<typeof insertDeployedTokenSchema>;
export type DeployedToken = typeof deployedTokens.$inferSelect;

// Token deployment request schema for EVM chains
export const evmTokenCreationSchema = z.object({
  name: z.string().min(1, "Token name is required").max(50, "Token name too long"),
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long"),
  decimals: z.number().int().min(0).max(18).default(18),
  totalSupply: z.string().min(1, "Total supply is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Total supply must be a positive number"),
  chainId: z.enum([
    "ethereum-mainnet",
    "ethereum-testnet",
    "bsc-mainnet",
    "bsc-testnet",
  ]),
  
  // Token features (can be combined - multiple features enabled by default)
  isMintable: z.boolean().default(true),
  isBurnable: z.boolean().default(true),
  isPausable: z.boolean().default(true),
  isCapped: z.boolean().default(false),
  hasTax: z.boolean().default(false),
  hasBlacklist: z.boolean().default(false),
  
  // Feature-specific fields
  maxSupply: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Max supply must be a positive number"),
  taxPercentage: z.number().int().min(0).max(25).default(5),
  treasuryWallet: z.string().default(""),
  
  logoUrl: z.string().optional(),
  description: z.string().max(500).optional(),
})
.refine((data) => {
  if (data.hasTax && (!data.taxPercentage || data.taxPercentage <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Tax percentage must be greater than 0 when tax feature is enabled",
  path: ["taxPercentage"],
})
.refine((data) => {
  if (data.hasTax && !data.treasuryWallet) {
    return false;
  }
  return true;
}, {
  message: "Treasury wallet address is required when tax feature is enabled",
  path: ["treasuryWallet"],
})
.refine((data) => {
  if (data.isCapped && !data.maxSupply) {
    return false;
  }
  return true;
}, {
  message: "Maximum supply is required when capped feature is enabled",
  path: ["maxSupply"],
})
.refine((data) => {
  if (data.isCapped && data.maxSupply) {
    const total = parseFloat(data.totalSupply);
    const max = parseFloat(data.maxSupply);
    return max >= total;
  }
  return true;
}, {
  message: "Maximum supply must be greater than or equal to initial supply",
  path: ["maxSupply"],
})
// Multiple features can now be combined!

// Token deployment request schema for Solana
export const solanaTokenCreationSchema = z.object({
  name: z.string().min(1, "Token name is required").max(32, "Token name too long"),
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long"),
  decimals: z.number().int().min(0).max(9).default(9),
  totalSupply: z.string().refine((val) => {
    if (val.trim() === '' || val.trim() === '0') return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Total supply must be a number or 0 for unlimited supply"),
  chainId: z.enum(["solana-testnet", "solana-mainnet"]),
  description: z.string().max(200, "Description too long").optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  twitter: z.string().max(100).optional(),
  telegram: z.string().max(100).optional(),
  logoUrl: z.string().optional(),
  enableMintAuthority: z.boolean().default(true),
  enableFreezeAuthority: z.boolean().default(true),
  enableUpdateAuthority: z.boolean().default(true),
});

// Base schemas for discriminated union (without refine)
const evmTokenCreationBaseSchema = z.object({
  name: z.string().min(1, "Token name is required").max(50, "Token name too long"),
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long"),
  decimals: z.number().int().min(0).max(18).default(18),
  totalSupply: z.string().min(1, "Total supply is required"),
  chainId: z.enum([
    "ethereum-mainnet",
    "ethereum-testnet",
    "bsc-mainnet",
    "bsc-testnet",
  ]),
  isMintable: z.boolean().default(false),
  isBurnable: z.boolean().default(false),
  isPausable: z.boolean().default(false),
  isCapped: z.boolean().default(false),
  hasTax: z.boolean().default(false),
  hasBlacklist: z.boolean().default(false),
  maxSupply: z.string().optional(),
  taxPercentage: z.number().int().min(0).max(25).default(5),
  treasuryWallet: z.string().default(""),
  logoUrl: z.string().optional(),
  description: z.string().max(500).optional(),
});

// Unified token creation schema (without validation for discriminatedUnion)
export const tokenCreationSchema = z.discriminatedUnion("blockchainType", [
  z.object({
    blockchainType: z.literal("EVM"),
  }).merge(evmTokenCreationBaseSchema),
  z.object({
    blockchainType: z.literal("Solana"),
  }).merge(solanaTokenCreationSchema),
]);

export type EvmTokenCreationForm = z.infer<typeof evmTokenCreationSchema>;
export type SolanaTokenCreationForm = z.infer<typeof solanaTokenCreationSchema>;
export type TokenCreationForm = z.infer<typeof tokenCreationSchema>;

// RPC configuration schema
export const rpcConfigSchema = z.object({
  // Ethereum
  ethereumMainnet: z.string().url().optional(),
  ethereumTestnet: z.string().url().optional(),
  // BSC
  bscMainnet: z.string().url().optional(),
  bscTestnet: z.string().url().optional(),
  // Solana
  solanaDevnet: z.string().url().optional(),
  solanaTestnet: z.string().url().optional(),
  solanaMainnet: z.string().url().optional(),
});

export type RpcConfig = z.infer<typeof rpcConfigSchema>;

// User roles
export type UserRole = "user" | "premium" | "admin";

// Users table for advanced features
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email"),
  primaryWallet: text("primary_wallet"),
  hashedAccessKey: text("hashed_access_key"),
  role: text("role").notNull().default("user"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Wallets table
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  chainType: text("chain_type").notNull(),
  address: text("address").notNull(),
  verificationTxId: text("verification_tx_id"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

// Sessions table
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Airdrops table
export const airdrops = pgTable("airdrops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  tokenAddress: text("token_address").notNull(),
  chainId: text("chain_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  totalAmount: text("total_amount").notNull(),
  remainingAmount: text("remaining_amount").notNull(),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAirdropSchema = createInsertSchema(airdrops).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAirdrop = z.infer<typeof insertAirdropSchema>;
export type Airdrop = typeof airdrops.$inferSelect;

// Airdrop tasks table
export const airdropTasks = pgTable("airdrop_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  airdropId: varchar("airdrop_id").notNull().references(() => airdrops.id),
  taskType: text("task_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  rewardAmount: text("reward_amount").notNull(),
  taskData: text("task_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAirdropTaskSchema = createInsertSchema(airdropTasks).omit({
  id: true,
  createdAt: true,
});

export type InsertAirdropTask = z.infer<typeof insertAirdropTaskSchema>;
export type AirdropTask = typeof airdropTasks.$inferSelect;

// Airdrop participants table
export const airdropParticipants = pgTable("airdrop_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  airdropId: varchar("airdrop_id").notNull().references(() => airdrops.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  walletAddress: text("wallet_address").notNull(),
  tasksCompleted: text("tasks_completed").array(),
  rewardAmount: text("reward_amount"),
  claimTxId: text("claim_tx_id"),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAirdropParticipantSchema = createInsertSchema(airdropParticipants).omit({
  id: true,
  createdAt: true,
});

export type InsertAirdropParticipant = z.infer<typeof insertAirdropParticipantSchema>;
export type AirdropParticipant = typeof airdropParticipants.$inferSelect;

// Presales table
export const presales = pgTable("presales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  tokenAddress: text("token_address").notNull(),
  chainId: text("chain_id").notNull(),
  projectName: text("project_name").notNull(),
  description: text("description"),
  website: text("website"),
  twitter: text("twitter"),
  telegram: text("telegram"),
  tokenPrice: text("token_price").notNull(),
  softCap: text("soft_cap").notNull(),
  hardCap: text("hard_cap").notNull(),
  minContribution: text("min_contribution").notNull(),
  maxContribution: text("max_contribution").notNull(),
  totalRaised: text("total_raised").default("0"),
  status: text("status").notNull().default("pending"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPresaleSchema = createInsertSchema(presales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPresale = z.infer<typeof insertPresaleSchema>;
export type Presale = typeof presales.$inferSelect;

// Presale applicants table
export const presaleApplicants = pgTable("presale_applicants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  presaleId: varchar("presale_id").notNull().references(() => presales.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  walletAddress: text("wallet_address").notNull(),
  contributionAmount: text("contribution_amount").notNull(),
  txId: text("tx_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPresaleApplicantSchema = createInsertSchema(presaleApplicants).omit({
  id: true,
  createdAt: true,
});

export type InsertPresaleApplicant = z.infer<typeof insertPresaleApplicantSchema>;
export type PresaleApplicant = typeof presaleApplicants.$inferSelect;

// Verification transactions table
export const verificationTransactions = pgTable("verification_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  walletAddress: text("wallet_address").notNull(),
  chainType: text("chain_type").notNull(),
  txHash: text("tx_hash").notNull(),
  amount: text("amount").notNull(),
  status: text("status").notNull().default("pending"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVerificationTransactionSchema = createInsertSchema(verificationTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertVerificationTransaction = z.infer<typeof insertVerificationTransactionSchema>;
export type VerificationTransaction = typeof verificationTransactions.$inferSelect;

// Torch NFT balances table - tracks each user's Torch NFT count
export const torchNfts = pgTable("torch_nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  balance: integer("balance").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  totalBurned: integer("total_burned").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTorchNftSchema = createInsertSchema(torchNfts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTorchNft = z.infer<typeof insertTorchNftSchema>;
export type TorchNft = typeof torchNfts.$inferSelect;

// Torch NFT earning history - tracks how each torch was earned
export const torchEarnings = pgTable("torch_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  referredUserId: varchar("referred_user_id").notNull(),
  referredUsername: text("referred_username").notNull(),
  amount: integer("amount").notNull().default(1),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export const insertTorchEarningSchema = createInsertSchema(torchEarnings).omit({
  id: true,
  earnedAt: true,
});

export type InsertTorchEarning = z.infer<typeof insertTorchEarningSchema>;
export type TorchEarning = typeof torchEarnings.$inferSelect;

// Torch burn history - tracks burns
export const torchBurns = pgTable("torch_burns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  amount: integer("amount").notNull(),
  burnedAt: timestamp("burned_at").notNull().defaultNow(),
});

export const insertTorchBurnSchema = createInsertSchema(torchBurns).omit({
  id: true,
  burnedAt: true,
});

export type InsertTorchBurn = z.infer<typeof insertTorchBurnSchema>;
export type TorchBurn = typeof torchBurns.$inferSelect;

// Reward pool configuration
export const rewardPool = pgTable("reward_pool", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalBurnTarget: integer("total_burn_target").notNull().default(10000),
  currentBurned: integer("current_burned").notNull().default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RewardPool = typeof rewardPool.$inferSelect;

// Reward distribution - for top 100 burners
export const rewardDistributions = pgTable("reward_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  rank: integer("rank").notNull(),
  burnedAmount: integer("burned_amount").notNull(),
  ethReward: text("eth_reward").notNull(),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RewardDistribution = typeof rewardDistributions.$inferSelect;
