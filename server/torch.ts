import { query } from './db';
import CryptoJS from 'crypto-js';

function generateId(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

// Get user's Torch NFT balance and stats
export async function getTorchBalance(userId: string): Promise<{
  balance: number;
  totalEarned: number;
  totalBurned: number;
} | null> {
  try {
    const result = await query(
      'SELECT balance, total_earned, total_burned FROM torch_nfts WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create initial record if doesn't exist
      await query(
        `INSERT INTO torch_nfts (id, user_id, balance, total_earned, total_burned)
         VALUES ($1, $2, 0, 0, 0)`,
        [generateId(), userId]
      );
      return { balance: 0, totalEarned: 0, totalBurned: 0 };
    }
    
    return {
      balance: result.rows[0].balance,
      totalEarned: result.rows[0].total_earned,
      totalBurned: result.rows[0].total_burned
    };
  } catch (error) {
    console.error('Get torch balance error:', error);
    return null;
  }
}

// Get torch earning history for a user
export async function getTorchEarnings(userId: string): Promise<Array<{
  referredUsername: string;
  amount: number;
  earnedAt: Date;
}>> {
  try {
    const result = await query(
      `SELECT referred_username, amount, earned_at 
       FROM torch_earnings 
       WHERE user_id = $1 
       ORDER BY earned_at DESC`,
      [userId]
    );
    
    return result.rows.map(row => ({
      referredUsername: row.referred_username,
      amount: row.amount,
      earnedAt: row.earned_at
    }));
  } catch (error) {
    console.error('Get torch earnings error:', error);
    return [];
  }
}

// Award Torch NFT to verified inviter when their referral gets verified
export async function awardTorchToInviter(
  referredUserId: string,
  referredUsername: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the inviter (referrer) of this user
    const referralResult = await query(
      'SELECT referrer_id FROM referrals WHERE referred_id = $1',
      [referredUserId]
    );
    
    if (referralResult.rows.length === 0) {
      return { success: false, message: 'No inviter found for this user' };
    }
    
    const inviterId = referralResult.rows[0].referrer_id;
    
    // Check if the inviter is verified
    const inviterResult = await query(
      'SELECT is_verified FROM users WHERE id = $1',
      [inviterId]
    );
    
    if (inviterResult.rows.length === 0) {
      return { success: false, message: 'Inviter not found' };
    }
    
    if (inviterResult.rows[0].is_verified !== 1) {
      return { success: false, message: 'Inviter is not verified - no Torch NFT awarded' };
    }
    
    // Check if already awarded for this referral
    const existingEarning = await query(
      'SELECT id FROM torch_earnings WHERE user_id = $1 AND referred_user_id = $2',
      [inviterId, referredUserId]
    );
    
    if (existingEarning.rows.length > 0) {
      return { success: false, message: 'Torch NFT already awarded for this referral' };
    }
    
    // Award 1 Torch NFT to the inviter
    // First, ensure torch_nfts record exists
    const torchRecord = await query(
      'SELECT id, balance, total_earned FROM torch_nfts WHERE user_id = $1',
      [inviterId]
    );
    
    if (torchRecord.rows.length === 0) {
      // Create new record
      await query(
        `INSERT INTO torch_nfts (id, user_id, balance, total_earned, total_burned)
         VALUES ($1, $2, 1, 1, 0)`,
        [generateId(), inviterId]
      );
    } else {
      // Update existing record
      await query(
        `UPDATE torch_nfts 
         SET balance = balance + 1, total_earned = total_earned + 1, updated_at = NOW()
         WHERE user_id = $1`,
        [inviterId]
      );
    }
    
    // Record the earning
    await query(
      `INSERT INTO torch_earnings (id, user_id, referred_user_id, referred_username, amount)
       VALUES ($1, $2, $3, $4, 1)`,
      [generateId(), inviterId, referredUserId, referredUsername]
    );
    
    return { success: true, message: 'Torch NFT awarded to inviter' };
  } catch (error) {
    console.error('Award torch to inviter error:', error);
    return { success: false, message: 'Failed to award Torch NFT' };
  }
}

// Burn Torch NFTs
export async function burnTorchNfts(
  userId: string,
  username: string,
  amount: number
): Promise<{ success: boolean; message: string; newBalance?: number }> {
  try {
    if (amount < 1) {
      return { success: false, message: 'Must burn at least 1 Torch NFT' };
    }
    
    // Check if pool is already completed
    const poolResult = await query('SELECT is_completed FROM reward_pool LIMIT 1');
    if (poolResult.rows.length > 0 && poolResult.rows[0].is_completed) {
      return { success: false, message: 'Burn event has already ended' };
    }
    
    // Get current balance
    const balanceResult = await query(
      'SELECT balance FROM torch_nfts WHERE user_id = $1',
      [userId]
    );
    
    if (balanceResult.rows.length === 0 || balanceResult.rows[0].balance < amount) {
      return { success: false, message: 'Insufficient Torch NFT balance' };
    }
    
    // Check minimum 5 requirement for participation
    if (balanceResult.rows[0].balance < 5) {
      return { success: false, message: 'You need at least 5 Torch NFTs to participate in burning' };
    }
    
    // Update balance
    await query(
      `UPDATE torch_nfts 
       SET balance = balance - $1, total_burned = total_burned + $1, updated_at = NOW()
       WHERE user_id = $2`,
      [amount, userId]
    );
    
    // Record burn
    await query(
      `INSERT INTO torch_burns (id, user_id, username, amount)
       VALUES ($1, $2, $3, $4)`,
      [generateId(), userId, username, amount]
    );
    
    // Update global burn counter
    await query(
      `UPDATE reward_pool SET current_burned = current_burned + $1 WHERE id = (SELECT id FROM reward_pool LIMIT 1)`,
      [amount]
    );
    
    // Check if target reached
    const updatedPool = await query('SELECT current_burned, total_burn_target FROM reward_pool LIMIT 1');
    if (updatedPool.rows.length > 0) {
      const { current_burned, total_burn_target } = updatedPool.rows[0];
      if (current_burned >= total_burn_target) {
        await query(`UPDATE reward_pool SET is_completed = true, completed_at = NOW() WHERE id = (SELECT id FROM reward_pool LIMIT 1)`);
        // Calculate and store rewards for top 100 burners
        await calculateAndDistributeRewards();
      }
    }
    
    // Get new balance
    const newBalanceResult = await query('SELECT balance FROM torch_nfts WHERE user_id = $1', [userId]);
    
    return { 
      success: true, 
      message: `Successfully burned ${amount} Torch NFT(s)`,
      newBalance: newBalanceResult.rows[0].balance
    };
  } catch (error) {
    console.error('Burn torch NFTs error:', error);
    return { success: false, message: 'Failed to burn Torch NFTs' };
  }
}

// Calculate and distribute rewards to top 100 burners
async function calculateAndDistributeRewards(): Promise<void> {
  try {
    const TOTAL_ETH_POOL = 20; // Hidden from public
    
    // Get top 100 burners by total burned amount
    const topBurners = await query(
      `SELECT user_id, username, SUM(amount) as total_burned
       FROM torch_burns
       GROUP BY user_id, username
       ORDER BY total_burned DESC
       LIMIT 100`
    );
    
    if (topBurners.rows.length === 0) return;
    
    // Calculate total burned by top 100
    const totalBurnedByTop100 = topBurners.rows.reduce((sum, row) => sum + parseInt(row.total_burned), 0);
    
    // Calculate proportional rewards
    let rank = 1;
    for (const burner of topBurners.rows) {
      const burnedAmount = parseInt(burner.total_burned);
      const proportion = burnedAmount / totalBurnedByTop100;
      const ethReward = (proportion * TOTAL_ETH_POOL).toFixed(6);
      
      await query(
        `INSERT INTO reward_distributions (id, user_id, username, rank, burned_amount, eth_reward)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [generateId(), burner.user_id, burner.username, rank, burnedAmount, ethReward]
      );
      
      rank++;
    }
  } catch (error) {
    console.error('Calculate rewards error:', error);
  }
}

// Get reward pool status
export async function getRewardPoolStatus(): Promise<{
  totalBurnTarget: number;
  currentBurned: number;
  progressPercentage: number;
  isCompleted: boolean;
}> {
  try {
    let result = await query('SELECT * FROM reward_pool LIMIT 1');
    
    // Initialize pool if doesn't exist
    if (result.rows.length === 0) {
      await query(
        `INSERT INTO reward_pool (id, total_burn_target, current_burned)
         VALUES ($1, 10000, 0)`,
        [generateId()]
      );
      return {
        totalBurnTarget: 10000,
        currentBurned: 0,
        progressPercentage: 0,
        isCompleted: false
      };
    }
    
    const pool = result.rows[0];
    return {
      totalBurnTarget: pool.total_burn_target,
      currentBurned: pool.current_burned,
      progressPercentage: Math.min((pool.current_burned / pool.total_burn_target) * 100, 100),
      isCompleted: pool.is_completed || false
    };
  } catch (error) {
    console.error('Get reward pool status error:', error);
    return {
      totalBurnTarget: 10000,
      currentBurned: 0,
      progressPercentage: 0,
      isCompleted: false
    };
  }
}

// Get leaderboard (top burners)
export async function getBurnLeaderboard(limit: number = 100): Promise<Array<{
  rank: number;
  userId: string;
  username: string;
  burnedAmount: number;
  ethReward?: string;
}>> {
  try {
    // Check if pool is completed - show from distributions table
    const poolResult = await query('SELECT is_completed FROM reward_pool LIMIT 1');
    
    if (poolResult.rows.length > 0 && poolResult.rows[0].is_completed) {
      // Get from reward_distributions
      const result = await query(
        `SELECT user_id, username, rank, burned_amount, eth_reward
         FROM reward_distributions
         ORDER BY rank ASC
         LIMIT $1`,
        [limit]
      );
      
      return result.rows.map(row => ({
        rank: row.rank,
        userId: row.user_id,
        username: row.username,
        burnedAmount: row.burned_amount,
        ethReward: row.eth_reward
      }));
    }
    
    // Pool not completed - calculate live leaderboard
    const result = await query(
      `SELECT user_id, username, SUM(amount) as total_burned
       FROM torch_burns
       GROUP BY user_id, username
       ORDER BY total_burned DESC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      username: row.username,
      burnedAmount: parseInt(row.total_burned)
    }));
  } catch (error) {
    console.error('Get burn leaderboard error:', error);
    return [];
  }
}

// Get user's rank in burn leaderboard
export async function getUserBurnRank(userId: string): Promise<number | null> {
  try {
    const result = await query(
      `SELECT rank FROM (
        SELECT user_id, RANK() OVER (ORDER BY SUM(amount) DESC) as rank
        FROM torch_burns
        GROUP BY user_id
      ) ranked
      WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) return null;
    return result.rows[0].rank;
  } catch (error) {
    console.error('Get user burn rank error:', error);
    return null;
  }
}
