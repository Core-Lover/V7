import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { initializeDatabase } from './db';
import { signup, login, getUserById, getReferralCount, getVerificationStatus, verifyUser, isVerificationTxHashUsed, isWalletAlreadyVerified, getDirectReferrals, verifyPin, changePin, deleteAccount } from './auth';

const ETHEREUM_RPC = 'https://eth.llamarpc.com';
const VERIFICATION_FEE_WEI = ethers.parseEther('0.01');
const RECEIVING_ADDRESS_LOWER = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD21'.toLowerCase();
import { 
  getMiningStatus, 
  startMining, 
  claimMiningReward, 
  purchaseUpgrade, 
  getMiningHistory,
  MINING_TIERS,
  UPGRADE_COSTS
} from './mining';
import { 
  getBalance, 
  sendEIXByUsername,
  sendEIXByUID,
  getTransactionHistory, 
  getWalletStats,
  getReferralStats,
  getReferralMembers,
  transferAssetByUID,
  createWithdrawRequest,
  getWithdrawRequests
} from './wallet';
import {
  getTorchBalance,
  getTorchEarnings,
  awardTorchToInviter,
  burnTorchNfts,
  getRewardPoolStatus,
  getBurnLeaderboard,
  getUserBurnRank
} from './torch';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize database
(async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, referralCode, pin } = req.body;
    const result = await signup(username, referralCode, pin);
    
    if (result.success && result.privateKey) {
      return res.json({
        success: true,
        message: result.message,
        privateKey: result.privateKey,
        user: result.user
      });
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey || !privateKey.trim()) {
      return res.status(400).json({ success: false, message: 'Private key is required' });
    }
    
    const result = await login(privateKey);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/user/:userId', async (req, res) => {
  try {
    const user = await getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const referralCount = await getReferralCount(user.id);
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        referral_code: user.referral_code,
        referred_by: user.referred_by,
        balance: user.balance,
        wallet_address: user.wallet_address || '',
        upgrade_level: user.upgrade_level,
        is_verified: user.is_verified,
        verified_at: user.verified_at,
        eth_wallet_address: user.eth_wallet_address,
        uid: user.is_verified === 1 ? (user.uid || null) : null,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        referral_count: referralCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/mining/status/:userId', async (req, res) => {
  try {
    const status = await getMiningStatus(req.params.userId);
    if (!status) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, ...status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/mining/start', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await startMining(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/mining/claim', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await claimMiningReward(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/mining/upgrade', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await purchaseUpgrade(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/mining/history/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await getMiningHistory(req.params.userId, limit);
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/mining/tiers', (req, res) => {
  res.json({ success: true, tiers: MINING_TIERS, upgradeCosts: UPGRADE_COSTS });
});

app.get('/api/wallet/balance/:userId', async (req, res) => {
  try {
    const balance = await getBalance(req.params.userId);
    if (balance === null) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, balance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/wallet/send-by-username', async (req, res) => {
  try {
    const { userId, toUsername, amount } = req.body;
    
    if (!toUsername || !toUsername.trim()) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const result = await sendEIXByUsername(userId, toUsername, parseFloat(amount));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/wallet/send-by-uid', async (req, res) => {
  try {
    const { userId, toUID, amount } = req.body;
    
    if (!toUID || !toUID.trim()) {
      return res.status(400).json({ success: false, message: 'UID is required' });
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const result = await sendEIXByUID(userId, toUID, parseFloat(amount));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/wallet/transactions/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const transactions = await getTransactionHistory(req.params.userId, limit);
    res.json({ success: true, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/wallet/stats/:userId', async (req, res) => {
  try {
    const stats = await getWalletStats(req.params.userId);
    if (!stats) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, ...stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Transfer asset by UID (requires verification)
app.post('/api/wallet/transfer-by-uid', async (req, res) => {
  try {
    const { userId, toUID, amount, asset } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    if (!toUID || !toUID.trim()) {
      return res.status(400).json({ success: false, message: 'Recipient UID is required' });
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const assetSymbol = asset || 'EIX';
    const result = await transferAssetByUID(userId, toUID, parseFloat(amount), assetSymbol);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create withdrawal request
app.post('/api/wallet/withdraw-request', async (req, res) => {
  try {
    const { userId, asset, amount, toAddress, network } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    if (!asset) {
      return res.status(400).json({ success: false, message: 'Asset type is required' });
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    if (!toAddress || !toAddress.trim()) {
      return res.status(400).json({ success: false, message: 'Wallet address is required' });
    }
    
    const result = await createWithdrawRequest(userId, asset, parseFloat(amount), toAddress, network || asset);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's withdrawal requests
app.get('/api/wallet/withdraw-requests/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const requests = await getWithdrawRequests(req.params.userId, limit);
    res.json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Referral/Team endpoints
app.get('/api/referral/stats/:userId', async (req, res) => {
  try {
    const stats = await getReferralStats(req.params.userId);
    res.json({ success: true, ...stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/referral/members/:userId', async (req, res) => {
  try {
    const members = await getReferralMembers(req.params.userId);
    res.json({ success: true, members });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/verification/status/:userId', async (req, res) => {
  try {
    const status = await getVerificationStatus(req.params.userId);
    if (!status) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, ...status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/verification/config', (req, res) => {
  res.json({
    success: true,
    receivingAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD21',
    requiredAmount: '0.006',
    network: 'ethereum',
    chainId: 1
  });
});

app.post('/api/verification/verify', async (req, res) => {
  try {
    const { userId, ethWalletAddress, txHash, signature, message } = req.body;
    
    if (!userId || !ethWalletAddress || !txHash || !signature || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields: userId, ethWalletAddress, txHash, signature, and message are required' });
    }
    
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction hash format' });
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(ethWalletAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address format' });
    }
    
    try {
      const expectedMessage = `EIX Verification: ${userId}`;
      if (message !== expectedMessage) {
        return res.status(400).json({ success: false, message: 'Invalid verification message' });
      }
      
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== ethWalletAddress.toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Signature does not match wallet address. Please sign with the correct wallet.' });
      }
    } catch (sigError: any) {
      console.error('Signature verification error:', sigError);
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    
    if (await isVerificationTxHashUsed(txHash)) {
      return res.status(400).json({ success: false, message: 'This transaction has already been used for verification' });
    }
    
    if (await isWalletAlreadyVerified(ethWalletAddress)) {
      return res.status(400).json({ success: false, message: 'This wallet is already verified on another account' });
    }
    
    try {
      const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        return res.status(400).json({ success: false, message: 'Transaction not found on blockchain' });
      }
      
      if (tx.to?.toLowerCase() !== RECEIVING_ADDRESS_LOWER) {
        return res.status(400).json({ success: false, message: 'Transaction recipient does not match verification address' });
      }
      
      if (tx.value < VERIFICATION_FEE_WEI) {
        return res.status(400).json({ success: false, message: 'Transaction amount is insufficient (requires 0.006 ETH)' });
      }
      
      if (tx.from.toLowerCase() !== ethWalletAddress.toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Transaction sender does not match your wallet address' });
      }
      
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        return res.status(400).json({ success: false, message: 'Transaction is not confirmed or failed' });
      }
      
    } catch (verifyError: any) {
      console.error('Transaction verification error:', verifyError);
      return res.status(400).json({ success: false, message: 'Failed to verify transaction on blockchain: ' + (verifyError.message || 'Unknown error') });
    }
    
    const success = await verifyUser(userId, ethWalletAddress, txHash);
    if (success) {
      // Award Torch NFT to inviter if the verified user was referred
      const user = await getUserById(userId);
      if (user && user.username) {
        const torchResult = await awardTorchToInviter(userId, user.username);
        console.log('Torch award result:', torchResult);
      }
      
      res.json({ success: true, message: 'Account verified successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Verification failed' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/verify-pin', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    
    if (!userId || !pin) {
      return res.status(400).json({ success: false, message: 'User ID and PIN are required' });
    }
    
    const isValid = await verifyPin(userId, pin);
    if (isValid) {
      res.json({ success: true, message: 'PIN verified' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid PIN' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/change-pin', async (req, res) => {
  try {
    const { userId, privateKey, newPin } = req.body;
    
    if (!userId || !privateKey || !newPin) {
      return res.status(400).json({ success: false, message: 'User ID, private key, and new PIN are required' });
    }
    
    const result = await changePin(userId, privateKey, newPin);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/auth/delete-account/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const result = await deleteAccount(userId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== TORCH NFT ENDPOINTS ==============

// Get user's torch balance and stats
app.get('/api/torch/balance/:userId', async (req, res) => {
  try {
    const balance = await getTorchBalance(req.params.userId);
    if (!balance) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, ...balance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's torch earning history
app.get('/api/torch/earnings/:userId', async (req, res) => {
  try {
    const earnings = await getTorchEarnings(req.params.userId);
    res.json({ success: true, earnings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's rank in burn leaderboard
app.get('/api/torch/rank/:userId', async (req, res) => {
  try {
    const rank = await getUserBurnRank(req.params.userId);
    res.json({ success: true, rank });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Burn torch NFTs
app.post('/api/torch/burn', async (req, res) => {
  try {
    const { userId, username, amount } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({ success: false, message: 'User ID and username are required' });
    }
    
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid burn amount' });
    }
    
    const result = await burnTorchNfts(userId, username, parseInt(amount));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get reward pool status (public)
app.get('/api/torch/pool-status', async (req, res) => {
  try {
    const status = await getRewardPoolStatus();
    res.json({ success: true, ...status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get burn leaderboard (public)
app.get('/api/torch/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const leaderboard = await getBurnLeaderboard(Math.min(limit, 100));
    res.json({ success: true, leaderboard });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
