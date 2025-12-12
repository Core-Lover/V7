import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  LogOut, 
  Shield,
  FileText,
  MessageSquare,
  Twitter,
  Send,
  Trash2,
  Key,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const [copiedUID, setCopiedUID] = React.useState(false);

  // Refresh user data on component mount to get latest verification status
  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteClick = () => {
    navigate('/delete-account');
  };

  const copyUsername = () => {
    if (user?.username) {
      navigator.clipboard.writeText(user.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyUID = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUID(true);
      setTimeout(() => setCopiedUID(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-loading">Loading...</div>
      </div>
    );
  }

  const isVerified = user.is_verified === 1;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button 
          className="profile-back-btn"
          onClick={() => navigate('/app')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="profile-title">Profile</h1>
      </div>

      <div className="profile-content">
        {/* Professional User Identity Card */}
        <motion.div 
          className="profile-identity-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="identity-avatar">
            <img src="/ethicx-logo.png" alt="EthicX" className="avatar-logo" />
          </div>
          
          <div className="identity-info">
            <div className="identity-username-row">
              <h2 className="identity-username">@{user.username}</h2>
              {isVerified && (
                <div className="verified-badge">
                  <CheckCircle size={16} />
                </div>
              )}
            </div>
            
            {isVerified && user.uid ? (
              <button className="copy-uid-btn" onClick={copyUID} title="Click to copy your UID">
                <div className="uid-info">
                  <span className="uid-label">UID:</span>
                  <span className="uid-value">{user.uid}</span>
                </div>
                {copiedUID ? (
                  <Check size={12} />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            ) : (
              <div className="uid-unavailable">
                <span className="unavailable-label">UID:</span>
                <span className="unavailable-message">Get verified</span>
              </div>
            )}
          </div>

          {!isVerified && (
            <button 
              className="get-verified-btn"
              onClick={() => navigate('/verification')}
            >
              <Shield size={16} />
              <span>Get Verified</span>
            </button>
          )}
        </motion.div>

        {/* Menu Options */}
        <motion.div 
          className="profile-options-section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="section-label">SETTINGS</h3>
          <div className="profile-grid-menu">
            <button className="profile-menu-item" onClick={() => navigate('/verification')}>
              <Shield size={16} />
              <span>Verification</span>
            </button>
            <button className="profile-menu-item" onClick={() => navigate('/change-pin')}>
              <Key size={16} />
              <span>Change PIN</span>
            </button>
          </div>

          <h3 className="section-label">LEGAL</h3>
          <div className="profile-grid-menu">
            <button className="profile-menu-item" onClick={() => navigate('/privacy')}>
              <FileText size={16} />
              <span>Privacy Policy</span>
            </button>
            <button className="profile-menu-item" onClick={() => navigate('/terms')}>
              <FileText size={16} />
              <span>Terms of Service</span>
            </button>
            <button className="profile-menu-item" onClick={() => navigate('/documentation')}>
              <FileText size={16} />
              <span>Documentation</span>
            </button>
          </div>

          <h3 className="section-label">SUPPORT</h3>
          <div className="profile-grid-menu">
            <button className="profile-menu-item">
              <MessageSquare size={16} />
              <span>Contact Support</span>
            </button>
          </div>

          <div className="profile-social-icons-left">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon" title="Twitter">
              <Twitter size={18} />
            </a>
            <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="social-icon" title="Telegram">
              <Send size={18} />
            </a>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          className="profile-danger-zone"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <h3 className="section-label danger">DANGER ZONE</h3>
          <button className="profile-menu-item profile-menu-item-danger" onClick={handleDeleteClick}>
            <Trash2 size={16} />
            <span>Delete Account</span>
          </button>
        </motion.div>

        <motion.button 
          className="logout-full-btn"
          onClick={handleLogout}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </div>
  );
};

export default ProfilePage;
