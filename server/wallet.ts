import CryptoJS from 'crypto-js';
import { query } from './db';
import { getUserById, getUserByUsername, updateUserBalance } from './auth';

export async function getUserByUID(uid: string): Promise<any | null> {
  try {
    const result = await query('SELECT * FROM users WHERE uid = $1', [uid]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Get user by UID error:', error);
    return null;
  }
}

function generateId(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

export interface WalletTransaction {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export interface TransferResult {
  success: boolean;
  message: string;
  transactionId?: string;
  newBalance?: number;
}

export async function getBalance(userId: string): Promise<number | null> {
  try {
    const user = await getUserById(userId);
    return user ? user.balance : null;
  } catch (error) {
    console.error('Get balance error:', error);
    return null;
  }
}

// User-to-user transfer by username only
export async function sendEIXByUsername(fromUserId: string, toUsername: string, amount: number): Promise<TransferResult> {
  try {
    if (amount <= 0) {
      return { success: false, message: 'Amount must be greater than 0' };
    }
    
    const fromUser = await getUserById(fromUserId);
    if (!fromUser) {
      return { success: false, message: 'Sender not found' };
    }
    
    if (fromUser.balance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }
    
    const toUser = await getUserByUsername(toUsername.trim());
    if (!toUser) {
      return { success: false, message: 'User not found' };
    }
    
    if (fromUser.id === toUser.id) {
      return { success: false, message: 'Cannot send to yourself' };
    }
    
    const newFromBalance = fromUser.balance - amount;
    const newToBalance = toUser.balance + amount;
    
    await updateUserBalance(fromUserId, newFromBalance);
    await updateUserBalance(toUser.id, newToBalance);
    
    const transactionId = generateId();
    await query(
      `INSERT INTO wallet_transactions (id, from_user_id, to_user_id, amount, transaction_type, description)
       VALUES ($1, $2, $3, $4, 'transfer', $5)`,
      [transactionId, fromUserId, toUser.id, amount, `EIX transfer to @${toUsername}`]
    );
    
    return {
      success: true,
      message: `Transfer to @${toUsername} successful`,
      transactionId: transactionId,
      newBalance: newFromBalance
    };
  } catch (error: any) {
    console.error('Send EIX by username error:', error);
    return { success: false, message: error.message || 'Transfer failed' };
  }
}

// User-to-user transfer by UID
export async function sendEIXByUID(fromUserId: string, toUID: string, amount: number): Promise<TransferResult> {
  try {
    if (amount <= 0) {
      return { success: false, message: 'Amount must be greater than 0' };
    }
    
    const fromUser = await getUserById(fromUserId);
    if (!fromUser) {
      return { success: false, message: 'Sender not found' };
    }
    
    if (fromUser.balance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }
    
    const toUser = await getUserByUID(toUID.trim());
    if (!toUser) {
      return { success: false, message: 'UID not found' };
    }
    
    if (fromUser.id === toUser.id) {
      return { success: false, message: 'Cannot send to yourself' };
    }
    
    const newFromBalance = fromUser.balance - amount;
    const newToBalance = toUser.balance + amount;
    
    await updateUserBalance(fromUserId, newFromBalance);
    await updateUserBalance(toUser.id, newToBalance);
    
    const transactionId = generateId();
    await query(
      `INSERT INTO wallet_transactions (id, from_user_id, to_user_id, amount, transaction_type, description)
       VALUES ($1, $2, $3, $4, 'transfer', $5)`,
      [transactionId, fromUserId, toUser.id, amount, `EIX transfer to ${toUID}`]
    );
    
    return {
      success: true,
      message: `Transfer to ${toUID} successful`,
      transactionId: transactionId,
      newBalance: newFromBalance
    };
  } catch (error: any) {
    console.error('Send EIX by UID error:', error);
    return { success: false, message: error.message || 'Transfer failed' };
  }
}

export async function getTransactionHistory(userId: string, limit: number = 20): Promise<WalletTransaction[]> {
  try {
    const result = await query(
      `SELECT * FROM wallet_transactions 
       WHERE from_user_id = $1 OR to_user_id = $1
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows as WalletTransaction[];
  } catch (error) {
    console.error('Get transaction history error:', error);
    return [];
  }
}

export async function getWalletStats(userId: string): Promise<{
  totalReceived: number;
  totalSent: number;
  transactionCount: number;
} | null> {
  try {
    const receivedResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM wallet_transactions 
       WHERE to_user_id = $1`,
      [userId]
    );
    
    const sentResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM wallet_transactions 
       WHERE from_user_id = $1`,
      [userId]
    );
    
    const countResult = await query(
      `SELECT COUNT(*) as count 
       FROM wallet_transactions 
       WHERE from_user_id = $1 OR to_user_id = $1`,
      [userId]
    );
    
    return {
      totalReceived: parseFloat(receivedResult.rows[0].total) || 0,
      totalSent: parseFloat(sentResult.rows[0].total) || 0,
      transactionCount: parseInt(countResult.rows[0].count) || 0
    };
  } catch (error) {
    console.error('Get wallet stats error:', error);
    return null;
  }
}

// Get referral stats for team page
export async function getReferralStats(userId: string): Promise<{
  totalReferrals: number;
  directReferrals: number;
  indirectReferrals: number;
  directReward: number;
  indirectReward: number;
  pendingReward: number;
  currentClaimLimit: number;
}> {
  try {
    // Get direct referrals count
    const directResult = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1',
      [userId]
    );
    const directReferrals = parseInt(directResult.rows[0].count) || 0;
    
    // Get total bonus paid
    const bonusResult = await query(
      'SELECT COALESCE(SUM(bonus_paid), 0) as total FROM referrals WHERE referrer_id = $1',
      [userId]
    );
    const directReward = parseFloat(bonusResult.rows[0].total) || 0;
    
    return {
      totalReferrals: directReferrals,
      directReferrals: directReferrals,
      indirectReferrals: 0, // Not tracking indirect referrals for now
      directReward: directReward,
      indirectReward: 0,
      pendingReward: 0,
      currentClaimLimit: 1000
    };
  } catch (error) {
    console.error('Get referral stats error:', error);
    return {
      totalReferrals: 0,
      directReferrals: 0,
      indirectReferrals: 0,
      directReward: 0,
      indirectReward: 0,
      pendingReward: 0,
      currentClaimLimit: 0
    };
  }
}

// Get referral members for team page
export async function getReferralMembers(userId: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.created_at as joined_at, u.is_verified,
              COALESCE((SELECT SUM(amount) FROM wallet_transactions WHERE to_user_id = u.id AND transaction_type = 'mining_reward'), 0) as total_earnings
       FROM users u
       INNER JOIN referrals r ON u.id = r.referred_id
       WHERE r.referrer_id = $1
       ORDER BY u.created_at DESC`,
      [userId]
    );
    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      joinedAt: row.joined_at,
      totalEarnings: parseFloat(row.total_earnings) || 0,
      isVerified: row.is_verified === 1
    }));
  } catch (error) {
    console.error('Get referral members error:', error);
    return [];
  }
}

// Transfer any asset by UID (requires sender verification)
export async function transferAssetByUID(
  fromUserId: string, 
  toUID: string, 
  amount: number, 
  asset: string
): Promise<TransferResult> {
  try {
    if (amount <= 0) {
      return { success: false, message: 'Amount must be greater than 0' };
    }
    
    const fromUser = await getUserById(fromUserId);
    if (!fromUser) {
      return { success: false, message: 'Sender not found' };
    }
    
    if (fromUser.is_verified !== 1) {
      return { success: false, message: 'Verification required. Only verified users can transfer assets.' };
    }
    
    const toUser = await getUserByUID(toUID.trim());
    if (!toUser) {
      return { success: false, message: 'Recipient UID not found. Please verify the UID is correct.' };
    }
    
    if (toUser.is_verified !== 1) {
      return { success: false, message: 'Recipient must be a verified user to receive transfers.' };
    }
    
    if (fromUser.id === toUser.id) {
      return { success: false, message: 'Cannot transfer to yourself' };
    }
    
    if (asset === 'EIX') {
      if (fromUser.balance < amount) {
        return { success: false, message: 'Insufficient EIX balance' };
      }
      
      const newFromBalance = fromUser.balance - amount;
      const newToBalance = toUser.balance + amount;
      
      await updateUserBalance(fromUserId, newFromBalance);
      await updateUserBalance(toUser.id, newToBalance);
      
      const transactionId = generateId();
      await query(
        `INSERT INTO wallet_transactions (id, from_user_id, to_user_id, amount, transaction_type, description)
         VALUES ($1, $2, $3, $4, 'transfer', $5)`,
        [transactionId, fromUserId, toUser.id, amount, `${asset} transfer to UID:${toUID}`]
      );
      
      return {
        success: true,
        message: `Successfully transferred ${amount} ${asset} to ${toUID}`,
        transactionId: transactionId,
        newBalance: newFromBalance
      };
    } else {
      return { 
        success: false, 
        message: `Internal ${asset} transfers are not yet available. Please use withdrawal for external transfers.` 
      };
    }
  } catch (error: any) {
    console.error('Transfer asset by UID error:', error);
    return { success: false, message: error.message || 'Transfer failed' };
  }
}

// Create withdrawal request for BTC/ETH/SOL/BNB
export interface WithdrawRequestResult {
  success: boolean;
  message: string;
  requestId?: string;
}

export async function createWithdrawRequest(
  userId: string,
  asset: string,
  amount: number,
  toAddress: string,
  network: string
): Promise<WithdrawRequestResult> {
  try {
    if (amount <= 0) {
      return { success: false, message: 'Amount must be greater than 0' };
    }
    
    if (!toAddress || toAddress.trim().length < 10) {
      return { success: false, message: 'Please enter a valid wallet address' };
    }
    
    if (asset === 'EIX') {
      return { success: false, message: 'EIX withdrawals are not available. Use UID transfer instead.' };
    }
    
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    const requestId = generateId();
    await query(
      `INSERT INTO withdraw_requests (id, user_id, asset, amount, to_address, network, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [requestId, userId, asset.toUpperCase(), amount, toAddress.trim(), network]
    );
    
    console.log(`Withdrawal request created: ${requestId} - ${amount} ${asset} to ${toAddress}`);
    
    return {
      success: true,
      message: `Withdrawal request submitted successfully. Your request for ${amount} ${asset} will be processed within 24-48 hours.`,
      requestId: requestId
    };
  } catch (error: any) {
    console.error('Create withdraw request error:', error);
    return { success: false, message: error.message || 'Failed to submit withdrawal request' };
  }
}

// Get user's withdrawal requests
export async function getWithdrawRequests(userId: string, limit: number = 10): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM withdraw_requests 
       WHERE user_id = $1
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Get withdraw requests error:', error);
    return [];
  }
}
