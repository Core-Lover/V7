import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUpgrade } from '../contexts/UpgradeContext';
import './UpgradeZone.css';
import '../components/Mining3D.css';
import UpgradeModal from '../components/UpgradeModal';

const UpgradeZone: React.FC = () => {
  const navigate = useNavigate();
  const { upgradeLevel, nextHours, canUpgrade, reset } = useUpgrade();
  const [miningActive] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleUpgrade = () => {
    setShowModal(true);
  };

  const handleConfirmUpgrade = () => {
    setShowModal(false);
  };

  const handleCancelUpgrade = () => {
    setShowModal(false);
  };


  return (
    <div className="upgrade-zone-container">
      {/* Header */}
      <div className="upgrade-zone-header">
        <button 
          className="back-button-icon"
          onClick={() => navigate('/app')}
          title="Back to Dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="upgrade-zone-title">
          UPGRADE ZONE
        </h1>
        <div className="header-spacer"></div>
      </div>

      {/* Reset Button */}
      <button 
        className="reset-button"
        onClick={() => {
          reset();
          navigate('/app');
        }}
        title="Reset to Level 0 (Testing)"
      >
        ↻
      </button>

      {/* Professional Upgrade Zone - Complete Redesign */}
      <div 
        className="upgrade-content-wrapper"
        style={{
          background: '#0E1116'
        }}
      >
        <div className="upgrade-professional-card">
          {/* Mining Animation */}
          <div className="mining-section">
            <div className="upgrade-mining-container">
              <div className={`mining-3d-container mining-reduced ${upgradeLevel === 0 ? '' : upgradeLevel === 1 ? 'theme-upgraded' : upgradeLevel === 2 ? 'theme-premium' : upgradeLevel === 3 ? 'theme-ultimate' : ''}`}>
                <div className={`mining-scene ${miningActive ? 'mining-active' : ''}`}>
                  <div className={`ring-system-3d test-mode ${miningActive ? 'active-mining' : ''}`}>
                    <div className="ring ring-orbit-1"></div>
                    <div className="ring ring-orbit-2"></div>
                    <div className="ring ring-orbit-3"></div>
                    <div className="ring ring-orbit-4"></div>
                    <div className="ring ring-orbit-5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Upgrade Info & Button */}
          {canUpgrade ? (
            <div className="upgrade-section">
              <div className="upgrade-info">
                <div className="upgrade-arrow">↓</div>
                <div className="next-tier-label">Increase Claim Time</div>
                <div className="next-tier-time">
                  {nextHours}h
                </div>
              </div>
              <button 
                className="upgrade-action-button"
                onClick={handleUpgrade}
              >
                <span className="button-text">UPGRADE</span>
              </button>
            </div>
          ) : (
            <div className="upgrade-section">
              <div className="max-level-card">
                <span className="max-icon">✓</span>
                <span className="max-text">MAXIMUM LEVEL REACHED</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showModal}
        onConfirm={handleConfirmUpgrade}
        onCancel={handleCancelUpgrade}
      />
    </div>
  );
};

export default UpgradeZone;