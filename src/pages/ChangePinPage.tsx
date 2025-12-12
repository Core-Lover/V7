import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import './ChangePinPage.css';

const ChangePinPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ privateKey: '', newPin: '', confirmPin: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    if (field !== 'privateKey' && !/^\d*$/.test(value)) {
      return;
    }
    setForm({ ...form, [field]: value });
    setError('');
  };

  const handleConfirm = async () => {
    setError('');
    setSuccess('');

    if (!form.privateKey.trim()) {
      setError('Private key is required');
      return;
    }

    if (!form.newPin || form.newPin.length !== 6 || !/^\d{6}$/.test(form.newPin)) {
      setError('New PIN must be exactly 6 digits');
      return;
    }

    if (form.newPin !== form.confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsProcessing(true);

    try {
      if (!user) {
        setError('User not found');
        setIsProcessing(false);
        return;
      }

      const response = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          privateKey: form.privateKey,
          newPin: form.newPin,
        }),
      });

      if (response.ok) {
        setSuccess('PIN updated successfully!');
        setForm({ privateKey: '', newPin: '', confirmPin: '' });
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to change PIN');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="change-pin-page">
      <div className="change-pin-header-section">
        <button className="change-pin-back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="change-pin-title">Change PIN</h1>
      </div>

      <div className="change-pin-content">
        <motion.div
          className="change-pin-container"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="change-pin-card">
            <div className="form-group">
              <label>Private Key</label>
              <input
                type="password"
                placeholder="Enter your private key"
                value={form.privateKey}
                onChange={(e) => handleInputChange('privateKey', e.target.value)}
                disabled={isProcessing}
              />
              <p className="form-hint">Your private key is required to verify your identity</p>
            </div>

            <div className="form-group">
              <label>New PIN</label>
              <input
                type="password"
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                value={form.newPin}
                onChange={(e) => handleInputChange('newPin', e.target.value)}
                disabled={isProcessing}
              />
              <p className="form-hint">Must be exactly 6 digits (0-9)</p>
            </div>

            <div className="form-group">
              <label>Confirm PIN</label>
              <input
                type="password"
                placeholder="Confirm 6-digit PIN"
                maxLength={6}
                value={form.confirmPin}
                onChange={(e) => handleInputChange('confirmPin', e.target.value)}
                disabled={isProcessing}
              />
              <p className="form-hint">Re-enter your new PIN to confirm</p>
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

            {success && (
              <motion.div
                className="form-alert success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle size={16} />
                <span>{success}</span>
              </motion.div>
            )}

            <div className="change-pin-actions">
              <button
                className="change-pin-btn cancel"
                onClick={() => navigate('/profile')}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="change-pin-btn confirm"
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Updating...
                  </>
                ) : (
                  'Update PIN'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChangePinPage;
