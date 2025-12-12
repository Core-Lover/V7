
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Settings, Users, Wallet, Key, LogOut } from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [adminConfig, setAdminConfig] = useState({
    verificationFee: '0.01',
    receivingAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD21',
    alchemyApiKey: '',
    alchemyWebhookKey: '',
    walletConnectProjectId: ''
  });
  const [activeTab, setActiveTab] = useState('settings');

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleSaveConfig = () => {
    alert('Configuration saved! (In production, this would update your environment variables)');
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-branding">
          <Shield size={32} />
          <h1>EIX Admin Panel</h1>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          App Settings
        </button>
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Users
        </button>
        <button 
          className={`admin-tab ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          <Wallet size={18} />
          Withdrawals
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'settings' && (
          <div className="admin-section">
            <h2>Application Configuration</h2>
            
            <div className="config-group">
              <label>
                <Key size={16} />
                Verification Fee (ETH)
              </label>
              <input
                type="text"
                value={adminConfig.verificationFee}
                onChange={(e) => setAdminConfig({...adminConfig, verificationFee: e.target.value})}
                placeholder="0.01"
              />
            </div>

            <div className="config-group">
              <label>
                <Wallet size={16} />
                Team Receiving Address
              </label>
              <input
                type="text"
                value={adminConfig.receivingAddress}
                onChange={(e) => setAdminConfig({...adminConfig, receivingAddress: e.target.value})}
                placeholder="0x..."
              />
            </div>

            <div className="config-group">
              <label>
                <Key size={16} />
                Alchemy API Key
              </label>
              <input
                type="text"
                value={adminConfig.alchemyApiKey}
                onChange={(e) => setAdminConfig({...adminConfig, alchemyApiKey: e.target.value})}
                placeholder="Your Alchemy API Key"
              />
            </div>

            <div className="config-group">
              <label>
                <Key size={16} />
                Alchemy Webhook Signing Key
              </label>
              <input
                type="text"
                value={adminConfig.alchemyWebhookKey}
                onChange={(e) => setAdminConfig({...adminConfig, alchemyWebhookKey: e.target.value})}
                placeholder="Your Webhook Signing Key"
              />
            </div>

            <div className="config-group">
              <label>
                <Key size={16} />
                WalletConnect Project ID
              </label>
              <input
                type="text"
                value={adminConfig.walletConnectProjectId}
                onChange={(e) => setAdminConfig({...adminConfig, walletConnectProjectId: e.target.value})}
                placeholder="Your WalletConnect Project ID"
              />
            </div>

            <button className="admin-save-btn" onClick={handleSaveConfig}>
              Save Configuration
            </button>

            <div className="admin-info-box">
              <p><strong>Note:</strong> After saving, restart your application for changes to take effect.</p>
              <p>Update these values in Replit Secrets for production use.</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-section">
            <h2>User Management</h2>
            <p className="coming-soon">User management features coming soon...</p>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="admin-section">
            <h2>Withdrawal Requests</h2>
            <p className="coming-soon">Withdrawal management features coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
