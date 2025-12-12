import CryptoJS from 'crypto-js';
import { query } from './db';

function generateId(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

function generatePrivateKey(): string {
  return 'EIX-' + CryptoJS.lib.WordArray.random(32).toString().toUpperCase();
}

function generateReferralCode(username: string): string {
  const randomPart = CryptoJS.lib.WordArray.random(4).toString().toUpperCase();
  return `${username.substring(0, 3).toUpperCase()}${randomPart}`;
}

function generateUID(): string {
  // Binance-style UID: numeric format (10 digits)
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 100000);
  const uid = String(timestamp % 10000000000) + String(randomPart).padStart(5, '0');
  return uid.substring(0, 10);
}

function hashPrivateKey(privateKey: string): string {
  return CryptoJS.SHA256(privateKey).toString();
}

function hashPin(pin: string): string {
  return CryptoJS.SHA256(pin).toString();
}

export interface User {
  id: string;
  username: string;
  access_key_hash: string;
  referral_code: string;
  referred_by: string | null;
  balance: number;
  wallet_address: string;
  upgrade_level: number;
  is_verified: number;
  verified_at: string | null;
  eth_wallet_address: string | null;
  uid: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface SignupResult {
  success: boolean;
  message: string;
  privateKey?: string;
  user?: Omit<User, 'access_key_hash'>;
}

export interface LoginResult {
  success: boolean;
  message: string;
  user?: Omit<User, 'access_key_hash'>;
}

export async function signup(username: string, referralCode?: string, pin?: string): Promise<SignupResult> {
  try {
    if (!username || username.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters' };
    }
    
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return { success: false, message: 'PIN must be exactly 6 digits' };
    }
    
    const existingResult = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingResult.rows.length > 0) {
      return { success: false, message: 'Username already taken' };
    }
    
    let referrerId: string | null = null;
    if (referralCode) {
      const referrerResult = await query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
      if (referrerResult.rows.length === 0) {
        return { success: false, message: 'Invalid referral code' };
      }
      referrerId = referrerResult.rows[0].id;
    }
    
    const userId = generateId();
    const privateKey = generatePrivateKey();
    const userReferralCode = generateReferralCode(username);
    const accessKeyHash = hashPrivateKey(privateKey);
    const pinHash = hashPin(pin);
    
    await query(
      `INSERT INTO users (id, username, pin_hash, access_key_hash, referral_code, referred_by, balance, upgrade_level)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0)`,
      [userId, username, pinHash, accessKeyHash, userReferralCode, referrerId]
    );
    
    if (referrerId) {
      const referralId = generateId();
      await query(
        `INSERT INTO referrals (id, referrer_id, referred_id, bonus_paid)
         VALUES ($1, $2, $3, 0)`,
        [referralId, referrerId, userId]
      );
    }
    
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0] as User;
    
    return {
      success: true,
      message: 'Account created successfully',
      privateKey: privateKey,
      user: {
        id: user.id,
        username: user.username,
        referral_code: user.referral_code,
        referred_by: user.referred_by,
        balance: user.balance,
        wallet_address: user.wallet_address || '',
        upgrade_level: user.upgrade_level,
        is_verified: user.is_verified || 0,
        verified_at: user.verified_at,
        eth_wallet_address: user.eth_wallet_address,
        uid: user.uid || null,
        created_at: user.created_at,
        last_login_at: user.last_login_at
      }
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    return { success: false, message: error.message || 'Signup failed' };
  }
}

export async function login(privateKey: string): Promise<LoginResult> {
  try {
    if (!privateKey || !privateKey.startsWith('EIX-')) {
      return { success: false, message: 'Invalid private key format' };
    }
    
    const accessKeyHash = hashPrivateKey(privateKey);
    const result = await query('SELECT * FROM users WHERE access_key_hash = $1', [accessKeyHash]);
    
    if (result.rows.length === 0) {
      return { success: false, message: 'Invalid private key' };
    }
    
    const user = result.rows[0] as User;
    
    await query(
      'UPDATE users SET last_login_at = $1 WHERE id = $2',
      [new Date().toISOString(), user.id]
    );
    
    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        referral_code: user.referral_code,
        referred_by: user.referred_by,
        balance: user.balance,
        wallet_address: user.wallet_address || '',
        upgrade_level: user.upgrade_level,
        is_verified: user.is_verified || 0,
        verified_at: user.verified_at || null,
        eth_wallet_address: user.eth_wallet_address || null,
        uid: user.uid || null,
        created_at: user.created_at,
        last_login_at: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, message: error.message || 'Login failed' };
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0] as User || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const result = await query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return result.rows[0] as User || null;
  } catch (error) {
    console.error('Get user by username error:', error);
    return null;
  }
}

export async function updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
  try {
    await query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, userId]);
    return true;
  } catch (error) {
    console.error('Update balance error:', error);
    return false;
  }
}

export async function updateUserUpgradeLevel(userId: string, newLevel: number): Promise<boolean> {
  try {
    await query('UPDATE users SET upgrade_level = $1 WHERE id = $2', [newLevel, userId]);
    return true;
  } catch (error) {
    console.error('Update upgrade level error:', error);
    return false;
  }
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  try {
    const result = await query('SELECT pin_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return false;
    
    const pinHash = hashPin(pin);
    return result.rows[0].pin_hash === pinHash;
  } catch (error) {
    console.error('Verify PIN error:', error);
    return false;
  }
}

export async function changePin(userId: string, privateKey: string, newPin: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      return { success: false, message: 'PIN must be exactly 6 digits' };
    }

    const userResult = await query('SELECT access_key_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const storedHash = userResult.rows[0].access_key_hash;
    const privateKeyHash = hashPrivateKey(privateKey);

    if (storedHash !== privateKeyHash) {
      return { success: false, message: 'Invalid private key' };
    }

    const newPinHash = hashPin(newPin);
    await query('UPDATE users SET pin_hash = $1 WHERE id = $2', [newPinHash, userId]);

    return { success: true, message: 'PIN changed successfully' };
  } catch (error: any) {
    console.error('Change PIN error:', error);
    return { success: false, message: error.message || 'Failed to change PIN' };
  }
}

export async function getReferralCount(userId: string): Promise<number> {
  try {
    const result = await query('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1', [userId]);
    return parseInt(result.rows[0].count) || 0;
  } catch (error) {
    console.error('Get referral count error:', error);
    return 0;
  }
}

export async function getDirectReferrals(userId: string): Promise<User[]> {
  try {
    const result = await query(
      `SELECT u.* FROM users u 
       INNER JOIN referrals r ON u.id = r.referred_id 
       WHERE r.referrer_id = $1`,
      [userId]
    );
    return result.rows as User[];
  } catch (error) {
    console.error('Get direct referrals error:', error);
    return [];
  }
}

export async function getVerifiedDirectReferrals(userId: string): Promise<User[]> {
  try {
    const result = await query(
      `SELECT u.* FROM users u 
       INNER JOIN referrals r ON u.id = r.referred_id 
       WHERE r.referrer_id = $1 AND u.is_verified = 1`,
      [userId]
    );
    return result.rows as User[];
  } catch (error) {
    console.error('Get verified direct referrals error:', error);
    return [];
  }
}

export async function getVerificationStatus(userId: string): Promise<{ isVerified: boolean; verifiedAt: string | null; ethWalletAddress: string | null } | null> {
  try {
    const result = await query('SELECT is_verified, verified_at, eth_wallet_address FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return null;
    const user = result.rows[0];
    return {
      isVerified: user.is_verified === 1,
      verifiedAt: user.verified_at,
      ethWalletAddress: user.eth_wallet_address
    };
  } catch (error) {
    console.error('Get verification status error:', error);
    return null;
  }
}

export async function isVerificationTxHashUsed(txHash: string): Promise<boolean> {
  try {
    const result = await query('SELECT id FROM users WHERE verification_tx_hash = $1', [txHash]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Check txHash error:', error);
    return true;
  }
}

export async function isWalletAlreadyVerified(ethWalletAddress: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT id FROM users WHERE eth_wallet_address = $1 AND is_verified = 1',
      [ethWalletAddress.toLowerCase()]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Check wallet error:', error);
    return true;
  }
}

export async function verifyUser(userId: string, ethWalletAddress: string, txHash: string): Promise<boolean> {
  try {
    if (await isVerificationTxHashUsed(txHash)) {
      console.error(`Verification rejected: txHash ${txHash} already used`);
      return false;
    }
    
    const existingWallet = await query(
      'SELECT id FROM users WHERE eth_wallet_address = $1 AND is_verified = 1 AND id != $2',
      [ethWalletAddress.toLowerCase(), userId]
    );
    if (existingWallet.rows.length > 0) {
      console.error(`Verification rejected: wallet ${ethWalletAddress} already verified on another account`);
      return false;
    }
    
    const uid = generateUID();
    await query(
      'UPDATE users SET is_verified = 1, verified_at = $1, eth_wallet_address = $2, verification_tx_hash = $3, uid = $4 WHERE id = $5',
      [new Date().toISOString(), ethWalletAddress.toLowerCase(), txHash, uid, userId]
    );
    console.log(`User ${userId} verified with wallet ${ethWalletAddress}, txHash: ${txHash}, UID: ${uid}`);
    return true;
  } catch (error) {
    console.error('Verify user error:', error);
    return false;
  }
}

export async function deleteAccount(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!userId) {
      return { success: false, message: 'User ID is required' };
    }

    const userResult = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    await query('DELETE FROM referrals WHERE referrer_id = $1 OR referred_id = $1', [userId]);
    await query('DELETE FROM mining_sessions WHERE user_id = $1', [userId]);
    await query('DELETE FROM wallet_transactions WHERE from_user_id = $1 OR to_user_id = $1', [userId]);
    await query('DELETE FROM upgrade_purchases WHERE user_id = $1', [userId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);

    return { success: true, message: 'Account deleted successfully' };
  } catch (error: any) {
    console.error('Delete account error:', error);
    return { success: false, message: error.message || 'Failed to delete account' };
  }
}
