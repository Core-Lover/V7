import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Trophy, Crown, Star, BookOpen, CheckCircle, AlertCircle, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import EthereumMagicPot from '../components/EthereumMagicPot';
import './RewardsPage.css';

const API_BASE = '/api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  burnedAmount: number;
  ethReward?: string;
}

interface TorchEarning {
  referredUsername: string;
  amount: number;
  earnedAt: Date;
}

const RewardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [poolStatus, setPoolStatus] = useState({
    totalBurnTarget: 10000,
    currentBurned: 0,
    progressPercentage: 0,
    isCompleted: false
  });
  
  const [userTorch, setUserTorch] = useState({
    balance: 0,
    totalEarned: 0,
    totalBurned: 0
  });
  
  const [userRank, setUserRank] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [torchEarnings, setTorchEarnings] = useState<TorchEarning[]>([]);
  
  const [burnAmount, setBurnAmount] = useState('');
  const [isBurning, setIsBurning] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAllData();
  }, [user?.id]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchPoolStatus(),
        fetchLeaderboard(),
        user?.id ? fetchUserData() : Promise.resolve()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPoolStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/torch/pool-status`);
      const data = await res.json();
      if (data.success) {
        setPoolStatus({
          totalBurnTarget: data.totalBurnTarget,
          currentBurned: data.currentBurned,
          progressPercentage: data.progressPercentage,
          isCompleted: data.isCompleted
        });
      }
    } catch (error) {
      console.error('Failed to fetch pool status:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/torch/leaderboard?limit=100`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    try {
      const [balanceRes, rankRes, earningsRes] = await Promise.all([
        fetch(`${API_BASE}/torch/balance/${user.id}`),
        fetch(`${API_BASE}/torch/rank/${user.id}`),
        fetch(`${API_BASE}/torch/earnings/${user.id}`)
      ]);
      
      const [balanceData, rankData, earningsData] = await Promise.all([
        balanceRes.json(),
        rankRes.json(),
        earningsRes.json()
      ]);
      
      if (balanceData.success) {
        setUserTorch({
          balance: balanceData.balance,
          totalEarned: balanceData.totalEarned,
          totalBurned: balanceData.totalBurned
        });
      }
      
      if (rankData.success && rankData.rank) {
        setUserRank(rankData.rank);
      }
      
      if (earningsData.success) {
        setTorchEarnings(earningsData.earnings);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleBurn = async () => {
    if (!user?.id || !user?.username) {
      setMessage({ type: 'error', text: 'Please login to burn Torch NFTs' });
      return;
    }
    
    const amount = parseInt(burnAmount);
    if (!amount || amount < 1) {
      setMessage({ type: 'error', text: 'Enter a valid burn amount' });
      return;
    }
    
    if (amount > userTorch.balance) {
      setMessage({ type: 'error', text: 'Insufficient Torch NFT balance' });
      return;
    }
    
    if (userTorch.balance < 5) {
      setMessage({ type: 'error', text: 'Minimum 5 Torch NFTs required to participate' });
      return;
    }
    
    setIsBurning(true);
    try {
      const res = await fetch(`${API_BASE}/torch/burn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          amount
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setBurnAmount('');
        await fetchAllData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to burn Torch NFTs' });
    } finally {
      setIsBurning(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown size={16} className="rank-badge gold" />;
    if (rank === 2) return <Crown size={16} className="rank-badge silver" />;
    if (rank === 3) return <Crown size={16} className="rank-badge bronze" />;
    if (rank <= 10) return <Star size={14} className="rank-badge elite" />;
    return null;
  };

  const getTierColor = (rank: number) => {
    if (rank <= 10) return 'tier-gold';
    if (rank <= 30) return 'tier-silver';
    if (rank <= 60) return 'tier-bronze';
    return 'tier-standard';
  };

  const canParticipate = userTorch.balance >= 5;

  return (
    <div className="rewards-page">
      <div className="rewards-header">
        <button 
          className="rewards-back-btn"
          onClick={() => navigate('/app')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="rewards-title">Torch Burn Event</h1>
        <button 
          className="guide-btn"
          onClick={() => setShowGuide(true)}
          title="How it works"
        >
          <BookOpen size={18} />
        </button>
      </div>

      <div className="rewards-content">
        <motion.div 
          className="magic-pot-section"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="pot-container">
            <EthereumMagicPot />
          </div>
          <div className="pot-label">
            <span className="pot-title">ETH Reward Pool</span>
            <span className="pot-subtitle">
              {poolStatus.isCompleted ? 'Event Completed!' : 'Burn to Earn ETH'}
            </span>
          </div>
        </motion.div>

        <motion.div 
          className="burn-progress-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="burn-progress-header">
            <div className="burn-icon-wrap">
              <Flame size={22} className={poolStatus.isCompleted ? 'completed' : ''} />
            </div>
            <div className="burn-progress-info">
              <span className="burn-progress-label">
                {poolStatus.isCompleted ? 'Burn Goal Reached!' : 'Global Burn Progress'}
              </span>
              <span className="burn-progress-stats">
                {formatNumber(poolStatus.currentBurned)} / {formatNumber(poolStatus.totalBurnTarget)} Torch NFTs Burned
              </span>
            </div>
            <div className="burn-progress-percentage">
              {poolStatus.progressPercentage.toFixed(1)}%
            </div>
          </div>
          
          <div className="burn-progress-bar-container">
            <motion.div 
              className={`burn-progress-bar-fill ${poolStatus.isCompleted ? 'completed' : ''}`}
              initial={{ width: 0 }}
              animate={{ width: `${poolStatus.progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          
          <div className="burn-milestone">
            <Flame size={14} />
            <span>
              {poolStatus.isCompleted 
                ? 'Rewards distributed to Top 100 burners!' 
                : `${formatNumber(poolStatus.totalBurnTarget - poolStatus.currentBurned)} more burns needed`}
            </span>
          </div>
        </motion.div>

        {user && (
          <>
            <motion.div 
              className="torch-balance-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="torch-balance-header">
                <img src="/attached_assets/ezgif-18dbbffc5e3d23f2_1764927973035.gif" alt="Torch NFT" className="torch-icon" />
                <div className="torch-balance-info">
                  <span className="torch-balance-label">Your Torch NFTs</span>
                  <span className="torch-balance-value">{userTorch.balance}</span>
                </div>
                <button 
                  className="view-earnings-btn"
                  onClick={() => setShowEarnings(true)}
                >
                  View History
                </button>
              </div>
              
              <div className="torch-stats-row">
                <div className="torch-stat">
                  <span className="torch-stat-label">Total Earned</span>
                  <span className="torch-stat-value">{userTorch.totalEarned}</span>
                </div>
                <div className="torch-stat">
                  <span className="torch-stat-label">Total Burned</span>
                  <span className="torch-stat-value">{userTorch.totalBurned}</span>
                </div>
                <div className="torch-stat">
                  <span className="torch-stat-label">Your Rank</span>
                  <span className="torch-stat-value">{userRank ? `#${userRank}` : '--'}</span>
                </div>
              </div>
              
              {!canParticipate && (
                <div className="torch-minimum-warning">
                  <AlertCircle size={16} />
                  <span>Invite at least 5 verified users to participate in burning. Earn 1 Torch NFT per verified referral.</span>
                </div>
              )}
            </motion.div>

            {!poolStatus.isCompleted && (
              <motion.div 
                className="burn-action-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="burn-action-header">
                  <Flame size={20} className="fire-icon" />
                  <span>Burn Torch NFTs</span>
                </div>
                
                <div className="burn-input-row">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                    min="1"
                    max={userTorch.balance}
                    disabled={!canParticipate || isBurning}
                    className="burn-input"
                  />
                  <button 
                    className="max-btn"
                    onClick={() => setBurnAmount(userTorch.balance.toString())}
                    disabled={!canParticipate || userTorch.balance === 0}
                  >
                    MAX
                  </button>
                </div>
                
                <button 
                  className={`burn-btn ${isBurning ? 'burning' : ''}`}
                  onClick={handleBurn}
                  disabled={!canParticipate || isBurning || !burnAmount}
                >
                  <Flame size={18} />
                  <span>{isBurning ? 'Burning...' : 'Burn'}</span>
                </button>
              </motion.div>
            )}
          </>
        )}

        <motion.div 
          className="leaderboard-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="leaderboard-header">
            <Trophy size={20} />
            <span>Top 100 Burners</span>
            {poolStatus.isCompleted && <span className="rewards-badge">Rewards Distributed</span>}
          </div>
          
          {leaderboard.length > 0 ? (
            <div className="leaderboard-list">
              {leaderboard.slice(0, 20).map((entry) => (
                <motion.div 
                  key={entry.userId}
                  className={`leaderboard-item ${getTierColor(entry.rank)} ${user?.id === entry.userId ? 'current-user' : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: entry.rank * 0.02 }}
                >
                  <div className="leaderboard-rank">
                    {getRankBadge(entry.rank)}
                    <span className="rank-number">#{entry.rank}</span>
                  </div>
                  <div className="leaderboard-user">
                    <div className="username-row">
                      <span className="user-name">{entry.username}</span>
                      <CheckCircle size={14} className="verified-badge" />
                    </div>
                    <span className="user-burns">{entry.burnedAmount} burned</span>
                  </div>
                  {entry.ethReward && (
                    <div className="leaderboard-reward">
                      <img src="/textures/eth-logo.png" alt="ETH" className="eth-coin-icon" />
                      <span className="reward-eth">{parseFloat(entry.ethReward).toFixed(4)}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="leaderboard-empty">
              <Flame size={32} />
              <span>No burns yet. Be the first!</span>
            </div>
          )}
          
          {leaderboard.length > 20 && (
            <div className="leaderboard-more">
              <span>+ {leaderboard.length - 20} more in Top 100</span>
            </div>
          )}
        </motion.div>

        {!user && (
          <motion.div 
            className="login-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Users size={24} />
            <span>Login to track your Torch NFTs and participate in burning</span>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showGuide && (
          <motion.div 
            className="guide-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGuide(false)}
          >
            <motion.div 
              className="guide-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="guide-modal-header">
                <BookOpen size={22} />
                <span>How Torch Burn Works</span>
                <button className="close-btn" onClick={() => setShowGuide(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="guide-content">
                <div className="guide-section">
                  <h3>Earning Torch NFTs</h3>
                  <ul>
                    <li>Invite friends to join EthicX using your referral code</li>
                    <li>When your referral completes KYC verification, you earn <strong>1 Torch NFT</strong></li>
                    <li>You must be verified yourself to receive Torch NFTs</li>
                    <li>This is the only way to earn Torch NFTs</li>
                  </ul>
                </div>
                
                <div className="guide-section">
                  <h3>Burning & Rewards</h3>
                  <ul>
                    <li>Minimum <strong>5 Torch NFTs</strong> required to participate</li>
                    <li>Burn your Torch NFTs to contribute to the global goal</li>
                    <li>Once <strong>10,000 Torch NFTs</strong> are burned globally, rewards unlock</li>
                    <li>Top 100 burners share the ETH reward pool based on burn weight</li>
                    <li>More NFTs burned = Higher ETH reward</li>
                  </ul>
                </div>
                
                <div className="guide-section">
                  <h3>Reward Distribution</h3>
                  <ul>
                    <li>Rewards are distributed proportionally</li>
                    <li>Higher ranked burners receive more ETH</li>
                    <li>Your rank is based on total NFTs burned</li>
                    <li>Winners are announced publicly on the leaderboard</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEarnings && (
          <motion.div 
            className="earnings-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEarnings(false)}
          >
            <motion.div 
              className="earnings-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="earnings-modal-header">
                <img src="/attached_assets/ezgif-18dbbffc5e3d23f2_1764927973035.gif" alt="Torch" className="torch-icon-small" />
                <span>Your Torch Earnings</span>
                <button className="close-btn" onClick={() => setShowEarnings(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="earnings-content">
                {torchEarnings.length > 0 ? (
                  <div className="earnings-list">
                    {torchEarnings.map((earning, index) => (
                      <div key={index} className="earning-item">
                        <div className="earning-icon">
                          <img src="/attached_assets/ezgif-18dbbffc5e3d23f2_1764927973035.gif" alt="Torch" />
                        </div>
                        <div className="earning-info">
                          <span className="earning-user">@{earning.referredUsername} verified</span>
                          <span className="earning-date">
                            {new Date(earning.earnedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="earning-amount">+{earning.amount}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="earnings-empty">
                    <img src="/attached_assets/ezgif-18dbbffc5e3d23f2_1764927973035.gif" alt="Torch" className="empty-torch" />
                    <span>No Torch NFTs earned yet</span>
                    <p>Invite friends and earn 1 Torch NFT when they complete verification!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {message && (
          <motion.div 
            className={`toast-message ${message.type}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            onClick={() => setMessage(null)}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RewardsPage;
