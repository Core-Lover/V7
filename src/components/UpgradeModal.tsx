import React, { useState } from 'react';
import { useUpgrade } from '../contexts/UpgradeContext';
import { useAuth } from '../contexts/AuthContext';
import './UpgradeModal.css';

interface UpgradeModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  const { upgrade, upgradeLevel, upgradeCost, nextRate, nextHours } = useUpgrade();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;
  
  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await upgrade();
      if (result.success) {
        onConfirm();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Upgrade failed');
    } finally {
      setIsLoading(false);
    }
  };

  const appThemeColors = {
    theme: '#8FA4B8',
    themeRgba: '143, 164, 184'
  };

  const canAfford = user && upgradeCost !== null && user.balance >= upgradeCost;

  return (
    <div className="upgrade-modal-overlay">
      <div 
        className="upgrade-modal-container"
        style={{
          borderColor: `rgba(${appThemeColors.themeRgba}, 0.2)`,
          '--theme-color': appThemeColors.theme,
          '--theme-rgba': appThemeColors.themeRgba
        } as React.CSSProperties}
      >
        <div className="modal-animation-container">
          <div className={`mining-3d-container mining-reduced ${upgradeLevel === 0 ? 'theme-upgraded' : upgradeLevel === 1 ? 'theme-premium' : 'theme-ultimate'}`}>
            <div className="mining-scene">
              <div className="ring-system-3d test-mode">
                <div className="ring ring-orbit-1"></div>
                <div className="ring ring-orbit-2"></div>
                <div className="ring ring-orbit-3"></div>
                <div className="ring ring-orbit-4"></div>
                <div className="ring ring-orbit-5"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-upgrade-info">
          <div className="upgrade-detail">
            <span className="upgrade-label">New Rate</span>
            <span className="upgrade-value">{nextRate} EIX/hr</span>
          </div>
          <div className="upgrade-detail">
            <span className="upgrade-label">Duration</span>
            <span className="upgrade-value">{nextHours}h</span>
          </div>
        </div>

        <div 
          className="modal-fee-section"
          style={{ 
            background: `rgba(${appThemeColors.themeRgba}, 0.08)`,
            border: `1px solid rgba(${appThemeColors.themeRgba}, 0.25)`
          }}
        >
          <span className="fee-label">UPGRADE COST</span>
          <div className="fee-display-container">
            <img src="/eix-balance-grid.png" alt="EIX" className="eth-logo" />
            <span className="fee-amount" style={{ color: appThemeColors.theme }}>{upgradeCost?.toFixed(2)} EIX</span>
          </div>
          {user && (
            <div className="balance-info">
              Your Balance: {user.balance.toFixed(4)} EIX
            </div>
          )}
        </div>

        {error && (
          <div className="modal-error">{error}</div>
        )}

        {!canAfford && user && (
          <div className="modal-warning">
            Insufficient balance. You need {upgradeCost?.toFixed(2)} EIX to upgrade.
          </div>
        )}

        <div className="modal-actions">
          <button 
            className="modal-confirm-btn" 
            onClick={handleConfirm}
            disabled={isLoading || !canAfford}
          >
            {isLoading ? 'UPGRADING...' : 'CONFIRM'}
          </button>
          <button className="modal-cancel-btn" onClick={onCancel} disabled={isLoading}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
