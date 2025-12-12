import CryptoJS from 'crypto-js';
import { query } from './db';
import { getUserById, updateUserBalance, updateUserUpgradeLevel, getVerifiedDirectReferrals } from './auth';

function generateId(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

export const MINING_TIERS = {
  0: { rate: 0.01, hours: 3, name: 'Default' },
  1: { rate: 0.03, hours: 6, name: 'Bronze' },
  2: { rate: 0.05, hours: 12, name: 'Silver' },
  3: { rate: 0.1, hours: 24, name: 'Gold' }
};

export const UPGRADE_COSTS = {
  1: 6.60,
  2: 8.40,
  3: 10.00
};

export const REFERRAL_BONUS_PERCENT = 0.20; // 20% of mining rewards from verified referrals

export interface MiningSession {
  id: string;
  user_id: string;
  started_at: string;
  ends_at: string;
  mining_rate: number;
  duration_hours: number;
  claimed_at: string | null;
  reward_amount: number | null;
  is_active: number;
}

export interface MiningStatus {
  hasActiveSession: boolean;
  session: MiningSession | null;
  currentProgress: number;
  timeRemaining: number;
  canClaim: boolean;
  accumulatedReward: number;
  currentRate: number;
  currentDuration: number;
  upgradeLevel: number;
}

export async function getActiveMiningSession(userId: string): Promise<MiningSession | null> {
  try {
    const result = await query(
      `SELECT * FROM mining_sessions 
       WHERE user_id = $1 AND is_active = 1 AND claimed_at IS NULL
       ORDER BY started_at DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0] as MiningSession || null;
  } catch (error) {
    console.error('Get active mining session error:', error);
    return null;
  }
}

export async function getMiningStatus(userId: string): Promise<MiningStatus | null> {
  try {
    const user = await getUserById(userId);
    if (!user) return null;
    
    const upgradeLevel = user.upgrade_level;
    const tier = MINING_TIERS[upgradeLevel as keyof typeof MINING_TIERS] || MINING_TIERS[0];
    
    const session = await getActiveMiningSession(userId);
    
    if (!session) {
      return {
        hasActiveSession: false,
        session: null,
        currentProgress: 0,
        timeRemaining: tier.hours * 3600,
        canClaim: false,
        accumulatedReward: 0,
        currentRate: tier.rate,
        currentDuration: tier.hours,
        upgradeLevel: upgradeLevel
      };
    }
    
    const now = new Date();
    const startTime = new Date(session.started_at);
    const endTime = new Date(session.ends_at);
    
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    const remaining = Math.max(0, endTime.getTime() - now.getTime());
    
    const progress = Math.min(100, (elapsed / totalDuration) * 100);
    const canClaim = remaining <= 0;
    
    const hoursElapsed = Math.min(elapsed / (1000 * 60 * 60), session.duration_hours);
    const accumulatedReward = hoursElapsed * session.mining_rate;
    
    return {
      hasActiveSession: true,
      session: session,
      currentProgress: progress,
      timeRemaining: Math.floor(remaining / 1000),
      canClaim: canClaim,
      accumulatedReward: accumulatedReward,
      currentRate: session.mining_rate,
      currentDuration: session.duration_hours,
      upgradeLevel: upgradeLevel
    };
  } catch (error) {
    console.error('Get mining status error:', error);
    return null;
  }
}

export async function startMining(userId: string): Promise<{ success: boolean; message: string; session?: MiningSession }> {
  try {
    const existingSession = await getActiveMiningSession(userId);
    if (existingSession) {
      return { success: false, message: 'Mining session already active' };
    }
    
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    const tier = MINING_TIERS[user.upgrade_level as keyof typeof MINING_TIERS] || MINING_TIERS[0];
    
    const sessionId = generateId();
    const now = new Date();
    const endsAt = new Date(now.getTime() + tier.hours * 60 * 60 * 1000);
    
    await query(
      `INSERT INTO mining_sessions (id, user_id, started_at, ends_at, mining_rate, duration_hours, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 1)`,
      [sessionId, userId, now.toISOString(), endsAt.toISOString(), tier.rate, tier.hours]
    );
    
    const result = await query('SELECT * FROM mining_sessions WHERE id = $1', [sessionId]);
    const session = result.rows[0] as MiningSession;
    
    return {
      success: true,
      message: 'Mining started successfully',
      session: session
    };
  } catch (error: any) {
    console.error('Start mining error:', error);
    return { success: false, message: error.message || 'Failed to start mining' };
  }
}

export async function claimMiningReward(userId: string): Promise<{ success: boolean; message: string; reward?: number; newBalance?: number }> {
  try {
    const session = await getActiveMiningSession(userId);
    if (!session) {
      return { success: false, message: 'No active mining session' };
    }
    
    const now = new Date();
    const endTime = new Date(session.ends_at);
    
    if (now < endTime) {
      return { success: false, message: 'Mining session not complete yet' };
    }
    
    const reward = session.mining_rate * session.duration_hours;
    
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    const newBalance = user.balance + reward;
    
    await query(
      `UPDATE mining_sessions 
       SET claimed_at = $1, reward_amount = $2, is_active = 0
       WHERE id = $3`,
      [now.toISOString(), reward, session.id]
    );
    
    await updateUserBalance(userId, newBalance);
    
    const transactionId = generateId();
    await query(
      `INSERT INTO wallet_transactions (id, to_user_id, amount, transaction_type, description)
       VALUES ($1, $2, $3, 'mining_reward', 'Mining reward claim')`,
      [transactionId, userId, reward]
    );
    
    // Pay 20% referral bonus to referrer if user is verified
    if (user.referred_by && user.is_verified === 1) {
      const referrer = await getUserById(user.referred_by);
      if (referrer) {
        const referralBonus = reward * REFERRAL_BONUS_PERCENT;
        const referrerNewBalance = referrer.balance + referralBonus;
        await updateUserBalance(referrer.id, referrerNewBalance);
        
        const bonusTxId = generateId();
        await query(
          `INSERT INTO wallet_transactions (id, to_user_id, amount, transaction_type, description)
           VALUES ($1, $2, $3, 'referral_bonus', 'Referral bonus from verified user')`,
          [bonusTxId, referrer.id, referralBonus]
        );
        
        // Update referral bonus_paid
        await query(
          `UPDATE referrals SET bonus_paid = bonus_paid + $1 WHERE referrer_id = $2 AND referred_id = $3`,
          [referralBonus, referrer.id, userId]
        );
      }
    }
    
    return {
      success: true,
      message: 'Reward claimed successfully',
      reward: reward,
      newBalance: newBalance
    };
  } catch (error: any) {
    console.error('Claim mining reward error:', error);
    return { success: false, message: error.message || 'Failed to claim reward' };
  }
}

export async function purchaseUpgrade(userId: string): Promise<{ success: boolean; message: string; newLevel?: number; cost?: number }> {
  try {
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    const currentLevel = user.upgrade_level;
    if (currentLevel >= 3) {
      return { success: false, message: 'Already at maximum upgrade level' };
    }
    
    const nextLevel = currentLevel + 1;
    const cost = UPGRADE_COSTS[nextLevel as keyof typeof UPGRADE_COSTS];
    
    if (user.balance < cost) {
      return { success: false, message: `Insufficient balance. Need ${cost} EIX` };
    }
    
    const existingSession = await getActiveMiningSession(userId);
    if (existingSession) {
      await query('UPDATE mining_sessions SET is_active = 0 WHERE id = $1', [existingSession.id]);
    }
    
    const newBalance = user.balance - cost;
    await updateUserBalance(userId, newBalance);
    await updateUserUpgradeLevel(userId, nextLevel);
    
    const purchaseId = generateId();
    await query(
      `INSERT INTO upgrade_purchases (id, user_id, from_level, to_level, cost)
       VALUES ($1, $2, $3, $4, $5)`,
      [purchaseId, userId, currentLevel, nextLevel, cost]
    );
    
    const transactionId = generateId();
    await query(
      `INSERT INTO wallet_transactions (id, from_user_id, amount, transaction_type, description)
       VALUES ($1, $2, $3, 'upgrade_purchase', $4)`,
      [transactionId, userId, cost, `Mining upgrade to level ${nextLevel}`]
    );
    
    return {
      success: true,
      message: `Upgraded to ${MINING_TIERS[nextLevel as keyof typeof MINING_TIERS].name} tier`,
      newLevel: nextLevel,
      cost: cost
    };
  } catch (error: any) {
    console.error('Purchase upgrade error:', error);
    return { success: false, message: error.message || 'Failed to purchase upgrade' };
  }
}

export async function getMiningHistory(userId: string, limit: number = 10): Promise<MiningSession[]> {
  try {
    const result = await query(
      `SELECT * FROM mining_sessions 
       WHERE user_id = $1 
       ORDER BY started_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows as MiningSession[];
  } catch (error) {
    console.error('Get mining history error:', error);
    return [];
  }
}
