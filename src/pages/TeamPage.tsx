import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import './TeamPage.css';

interface TeamMember {
  id: string;
  username: string;
  joinedAt: string;
  totalEarnings: number;
  isVerified?: boolean;
}

const TeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    directReferrals: 0,
    verifiedMembers: 0,
    directReward: 0,
    pendingReward: 0,
    totalEarned: 0
  });
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchTeamData();
    }
  }, [user?.id]);

  const fetchTeamData = async () => {
    try {
      const [statsRes, membersRes] = await Promise.all([
        fetch(`/api/referral/stats/${user?.id}`),
        fetch(`/api/referral/members/${user?.id}`)
      ]);
      
      const statsData = await statsRes.json();
      const membersData = await membersRes.json();
      
      if (statsData.success) {
        const verifiedCount = membersData.members?.filter((m: TeamMember) => m.isVerified)?.length || 0;
        setStats({
          totalReferrals: statsData.totalReferrals || 0,
          directReferrals: statsData.directReferrals || 0,
          verifiedMembers: verifiedCount,
          directReward: statsData.directReward || 0,
          pendingReward: statsData.pendingReward || 0,
          totalEarned: (statsData.directReward || 0) + (statsData.indirectReward || 0)
        });
      }
      
      if (membersData.success) {
        setTeamMembers(membersData.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    }
  };

  const handleClaimRewards = async () => {
    if (stats.pendingReward <= 0 || isClaiming) return;
    
    setIsClaiming(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to claim rewards:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  };

  const getInitial = (username: string) => {
    return username?.charAt(0)?.toUpperCase() || '?';
  };

  return (
    <div className="team-page">
      <div className="team-header">
        <button 
          className="team-back-btn"
          onClick={() => navigate('/app')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="team-title">Team</h1>
      </div>

      <div className="team-content">
        <motion.div 
          className="earnings-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="earnings-header">
            <span className="earnings-label">Total Earned</span>
          </div>
          <div className="earnings-display">
            <img src="/eix-balance-grid.png" alt="EIX" className="earnings-logo" />
            <span className="earnings-amount">{formatNumber(stats.totalEarned)}</span>
            <span className="earnings-currency">EIX</span>
          </div>
          <div className="earnings-subtitle">
            From verified team members mining rewards
          </div>
        </motion.div>

        {teamMembers.length > 0 && (
          <motion.div 
            className="members-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="members-header">
              <span className="members-title">Team Members <span className="members-count">{teamMembers.length}</span></span>
              {stats.pendingReward > 0 && (
                <button 
                  className="header-claim-btn"
                  onClick={handleClaimRewards}
                  disabled={isClaiming}
                >
                  {isClaiming ? 'Claiming...' : `Claim ${formatNumber(stats.pendingReward)}`}
                </button>
              )}
            </div>
            <div className="members-list">
              {teamMembers.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-avatar">
                    {getInitial(member.username)}
                  </div>
                  <div className="member-info">
                    <div className="member-name-row">
                      <span className="member-name">{member.username}</span>
                      {member.isVerified && (
                        <CheckCircle size={14} className="verified-badge" />
                      )}
                    </div>
                    <span className="member-contribution">
                      Contributed: {member.totalEarnings.toFixed(4)} EIX
                    </span>
                  </div>
                  <div className="member-status">
                    {member.isVerified ? (
                      <span className="status-verified">Verified</span>
                    ) : (
                      <span className="status-pending">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {teamMembers.length === 0 && (
          <motion.div 
            className="members-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="members-header">
              <span className="members-title">Team Members <span className="members-count">0</span></span>
              {stats.pendingReward > 0 && (
                <button 
                  className="header-claim-btn"
                  onClick={handleClaimRewards}
                  disabled={isClaiming}
                >
                  {isClaiming ? 'Claiming...' : `Claim ${formatNumber(stats.pendingReward)}`}
                </button>
              )}
            </div>
            <div className="members-list">
              <div className="empty-state">
                <Users size={40} className="empty-icon" />
                <span className="empty-title">No Team Members Yet</span>
                <span className="empty-text">
                  Invite friends to join your team and earn rewards from their mining activities.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
};

export default TeamPage;
