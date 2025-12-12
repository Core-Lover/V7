import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import './DeleteAccountPage.css';

const DeleteAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setPin(numericValue);
    setError('');
  };

  const handleConfirmDelete = async () => {
    setError('');

    if (!pin) {
      setError('PIN is required');
      return;
    }

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    setIsProcessing(true);

    try {
      if (!user) {
        setError('User not found');
        setIsProcessing(false);
        return;
      }

      const pinVerifyResponse = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pin: pin })
      });

      if (!pinVerifyResponse.ok) {
        setError('Invalid PIN');
        setIsProcessing(false);
        return;
      }

      const response = await fetch(`/api/auth/delete-account/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        logout();
        navigate('/');
      } else {
        setError('Failed to delete account');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="delete-account-page">
      <div className="delete-account-header-section">
        <button className="delete-account-back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="delete-account-title">Delete Account</h1>
      </div>

      <div className="delete-account-content">
        <motion.div
          className="delete-account-container"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {!confirmStep ? (
            <div className="delete-account-card">
              <div className="warning-icon">
                <AlertTriangle size={40} />
              </div>

              <h2 className="warning-title">Delete Account</h2>

              <p className="warning-message">
                Are you absolutely sure? This action cannot be undone. All your data including mining progress, referrals, and account information will be permanently deleted.
              </p>

              <div className="warning-list">
                <div className="warning-item">
                  <span className="warning-dot">•</span>
                  <span>All mining progress will be lost</span>
                </div>
                <div className="warning-item">
                  <span className="warning-dot">•</span>
                  <span>Referral rewards will be forfeited</span>
                </div>
                <div className="warning-item">
                  <span className="warning-dot">•</span>
                  <span>Verification status will be reset</span>
                </div>
                <div className="warning-item">
                  <span className="warning-dot">•</span>
                  <span>All account data will be permanently deleted</span>
                </div>
              </div>

              <div className="delete-account-actions">
                <button
                  className="delete-account-btn cancel"
                  onClick={() => navigate('/profile')}
                  disabled={isProcessing}
                >
                  Go Back
                </button>
                <button
                  className="delete-account-btn danger"
                  onClick={() => setConfirmStep(true)}
                  disabled={isProcessing}
                >
                  I Understand, Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="delete-account-card">
              <div className="pin-icon">
                <AlertTriangle size={40} />
              </div>

              <h2 className="pin-title">Confirm with PIN</h2>

              <p className="pin-message">
                Enter your 6-digit PIN to confirm account deletion
              </p>

              <div className="form-group">
                <label>Security PIN</label>
                <input
                  type="password"
                  placeholder="000000"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  disabled={isProcessing}
                  autoFocus
                />
                <p className="form-hint">Enter your 6-digit PIN to verify</p>
              </div>

              {error && (
                <motion.div
                  className="form-alert error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="delete-account-actions">
                <button
                  className="delete-account-btn cancel"
                  onClick={() => {
                    setConfirmStep(false);
                    setPin('');
                    setError('');
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  className="delete-account-btn danger"
                  onClick={handleConfirmDelete}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
