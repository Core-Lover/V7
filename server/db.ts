import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function initializeDatabase() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        pin_hash TEXT NOT NULL DEFAULT '',
        access_key_hash TEXT NOT NULL,
        referral_code TEXT UNIQUE NOT NULL,
        referred_by TEXT,
        balance REAL DEFAULT 0,
        wallet_address TEXT UNIQUE,
        upgrade_level INTEGER DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        verified_at TEXT,
        eth_wallet_address TEXT,
        verification_tx_hash TEXT,
        uid TEXT UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login_at TEXT
      );

      CREATE TABLE IF NOT EXISTS mining_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        started_at TEXT NOT NULL,
        ends_at TEXT NOT NULL,
        mining_rate REAL NOT NULL,
        duration_hours INTEGER NOT NULL,
        claimed_at TEXT,
        reward_amount REAL,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id TEXT PRIMARY KEY,
        from_user_id TEXT REFERENCES users(id),
        to_user_id TEXT REFERENCES users(id),
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        referrer_id TEXT NOT NULL REFERENCES users(id),
        referred_id TEXT NOT NULL REFERENCES users(id),
        bonus_paid REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS upgrade_purchases (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        from_level INTEGER NOT NULL,
        to_level INTEGER NOT NULL,
        cost REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS torch_nfts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        balance INTEGER DEFAULT 0,
        total_earned INTEGER DEFAULT 0,
        total_burned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS torch_earnings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        referred_user_id TEXT NOT NULL,
        referred_username TEXT NOT NULL,
        amount INTEGER DEFAULT 1,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS torch_burns (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        amount INTEGER NOT NULL,
        burned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reward_pool (
        id TEXT PRIMARY KEY,
        total_burn_target INTEGER DEFAULT 10000,
        current_burned INTEGER DEFAULT 0,
        is_completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reward_distributions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        rank INTEGER NOT NULL,
        burned_amount INTEGER NOT NULL,
        eth_reward TEXT NOT NULL,
        claimed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS withdraw_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        asset TEXT NOT NULL,
        amount REAL NOT NULL,
        to_address TEXT NOT NULL,
        network TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        processed_at TIMESTAMP,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
      CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
      CREATE INDEX IF NOT EXISTS idx_mining_sessions_user_id ON mining_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_mining_sessions_active ON mining_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_from ON wallet_transactions(from_user_id);
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_to ON wallet_transactions(to_user_id);
      CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
      CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
      CREATE INDEX IF NOT EXISTS idx_torch_nfts_user ON torch_nfts(user_id);
      CREATE INDEX IF NOT EXISTS idx_torch_earnings_user ON torch_earnings(user_id);
      CREATE INDEX IF NOT EXISTS idx_torch_burns_user ON torch_burns(user_id);
      CREATE INDEX IF NOT EXISTS idx_torch_burns_amount ON torch_burns(amount DESC);
      CREATE INDEX IF NOT EXISTS idx_withdraw_requests_user ON withdraw_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON withdraw_requests(status);
    `);

    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export { pool };
