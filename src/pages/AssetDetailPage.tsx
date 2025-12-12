import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Send, ArrowRightLeft, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AssetDetailPage.css';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  available: number;
  frozen: number;
  icon: string;
  color: string;
  logo?: string;
  network?: string;
}

interface Transaction {
  id: string;
  type: 'transfer_out' | 'withdraw' | 'transfer_in' | 'withdraw_request';
  amount: number;
  status: 'completed' | 'pending';
  time: string;
  date: string;
}

type ModalType = 'transfer' | 'withdraw' | null;

const AssetDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const asset = location.state?.asset as Asset | undefined;
  const [logoError, setLogoError] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [recipientUID, setRecipientUID] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const defaultAsset: Asset = {
    id: 'eix',
    symbol: 'EIX',
    name: 'EthicX Token',
    balance: user?.balance || 0,
    available: user?.balance || 0,
    frozen: 0,
    icon: 'Ξ',
    color: '#FF7A1A'
  };

  const currentAsset = asset || defaultAsset;
  const isEIX = currentAsset.symbol === 'EIX';
  const isVerified = user?.is_verified === 1;

  useEffect(() => {
    setLogoError(false);
  }, [asset?.id]);

  const handleLogoError = useCallback(() => {
    setLogoError(true);
  }, []);

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setError(null);
    setSuccess(null);
    setRecipientUID('');
    setWithdrawAddress('');
    setAmount('');
  };

  const closeModal = () => {
    setActiveModal(null);
    setError(null);
    setSuccess(null);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipientUID.trim() || !amount) return;

    if (!isVerified) {
      setError('Your account is not verified. Please complete identity verification to enable transfers. Visit the Verification page to get started.');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (transferAmount > currentAsset.balance) {
      setError('Insufficient balance');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/wallet/transfer-by-uid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          toUID: recipientUID.trim(),
          amount: transferAmount,
          asset: currentAsset.symbol
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Successfully transferred ${transferAmount} ${currentAsset.symbol} to ${recipientUID}`);
        await refreshUser();
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        setError(data.message || 'Transfer failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !withdrawAddress.trim() || !amount) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > currentAsset.balance) {
      setError('Insufficient balance');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          asset: currentAsset.symbol,
          amount: withdrawAmount,
          toAddress: withdrawAddress.trim(),
          network: currentAsset.network || currentAsset.name
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Withdrawal request submitted for ${withdrawAmount} ${currentAsset.symbol}. You will be notified once processed.`);
        setTimeout(() => {
          closeModal();
        }, 3000);
      } else {
        setError(data.message || 'Withdrawal request failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const mockTransactions: Transaction[] = currentAsset.balance > 0 ? [
    {
      id: '1',
      type: 'transfer_in',
      amount: 0.00015928,
      status: 'completed',
      time: '19:25 12/05',
      date: 'Transfer In'
    },
    {
      id: '2',
      type: 'transfer_in',
      amount: 0.00013585,
      status: 'completed',
      time: '11:42 12/04',
      date: 'Transfer In'
    }
  ] : [];

  return (
    <div className="asset-detail-container">
      <div className="asset-detail-header">
        <button className="asset-detail-back-btn" onClick={() => navigate('/wallet/assets')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="asset-detail-title">Asset Detail</h1>
        <div style={{ width: 36 }} />
      </div>

      <motion.div className="asset-detail-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="asset-detail-grid">
          <div className="asset-detail-hero">
            <div className="asset-detail-icon-wrapper">
              {currentAsset.logo && !logoError ? (
                <img
                  src={currentAsset.logo}
                  alt={currentAsset.symbol}
                  className="asset-detail-logo-img"
                  onError={handleLogoError}
                />
              ) : (
                <div className="asset-detail-icon" style={{ background: currentAsset.color }}>
                  <span>{currentAsset.icon || currentAsset.symbol.charAt(0)}</span>
                </div>
              )}
            </div>
            <h2 className="asset-detail-symbol">{currentAsset.symbol}</h2>
            <span className="asset-detail-name">{currentAsset.name}</span>
          </div>

          <div className="asset-detail-stats">
            <div className="detail-stat">
              <span className="detail-stat-label">Balance</span>
              <span className="detail-stat-value">{(currentAsset.balance || 0).toFixed(8)}</span>
            </div>
          </div>


          <div className="action-buttons">
            <button className="action-btn deposit-btn disabled" disabled>
              <Download size={18} />
              <span>DEPOSIT</span>
            </button>
            
            {isEIX ? (
              <button className="action-btn withdraw-btn disabled" disabled>
                <Send size={18} />
                <span>WITHDRAW</span>
              </button>
            ) : (
              <button 
                className="action-btn withdraw-btn"
                onClick={() => openModal('withdraw')}
              >
                <Send size={18} />
                <span>WITHDRAW</span>
              </button>
            )}
            
            <button 
              className="action-btn transfer-btn"
              onClick={() => openModal('transfer')}
            >
              <ArrowRightLeft size={18} />
              <span>TRANSFER</span>
            </button>
          </div>

          <div className="financial-records">
            <h3 className="records-title">Financial Records</h3>

            <div className="records-container">
              {mockTransactions.length > 0 ? (
                mockTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    className="transaction-item-flat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="transaction-type-label">{tx.date}</div>
                    <div className="transaction-details">
                      <span className="detail-amount">{tx.amount.toFixed(8)}</span>
                      <span className={`detail-status ${tx.status}`}>{tx.status}</span>
                      <span className="detail-time">{tx.time}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-records">
                  <span>No transactions yet</span>
                </div>
              )}
              <div className="records-end-footer">
                <div className="end-divider" />
                <span className="end-text">End of Records</span>
                <div className="end-divider" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            />
            <motion.div 
              className="modal-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="modal-handle-container">
                <div className="modal-handle" />
              </div>

              <div className="modal-header">
                <div className="modal-title-section">
                  <div className={`modal-icon ${activeModal}`}>
                    {activeModal === 'transfer' ? <ArrowRightLeft size={22} /> : <Send size={22} />}
                  </div>
                  <div className="modal-title-group">
                    <h2 className="modal-title">
                      {activeModal === 'transfer' ? `Transfer ${currentAsset.symbol}` : `Withdraw ${currentAsset.symbol}`}
                    </h2>
                    <span className="modal-subtitle">
                      {activeModal === 'transfer' ? 'Send to verified UID' : 'Request withdrawal to external address'}
                    </span>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-content">
                {activeModal === 'transfer' ? (
                  <form onSubmit={handleTransfer} className="modal-form">
                    <div className="form-group">
                      <label className="form-label">Recipient UID</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter verified user UID"
                        value={recipientUID}
                        onChange={(e) => setRecipientUID(e.target.value)}
                        disabled={isProcessing}
                      />
                      <span className="form-hint">Transfers are only possible to verified users</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Amount</label>
                      <div className="input-with-suffix">
                        <input
                          type="number"
                          step="0.00000001"
                          className="form-input"
                          placeholder="0.00000000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={isProcessing}
                        />
                        <span className="input-suffix">{currentAsset.symbol}</span>
                      </div>
                      <div className="balance-row">
                        <span className="available-text">Available: {currentAsset.balance.toFixed(8)}</span>
                        <button 
                          type="button" 
                          className="max-btn"
                          onClick={() => setAmount(currentAsset.balance.toFixed(8))}
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="modal-alert error">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                      </div>
                    )}

                    {success && (
                      <div className="modal-alert success">
                        <CheckCircle size={16} />
                        <span>{success}</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={isProcessing || !recipientUID || !amount}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={18} className="spinning" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft size={18} />
                          <span>Transfer {currentAsset.symbol}</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleWithdrawRequest} className="modal-form">
                    <div className="form-group">
                      <label className="form-label">{currentAsset.symbol} Address</label>
                      <input
                        type="text"
                        className="form-input address-input"
                        placeholder={`Enter ${currentAsset.name} wallet address`}
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        disabled={isProcessing}
                      />
                      <span className="form-hint">Make sure this is a valid {currentAsset.network || currentAsset.name} address</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Amount</label>
                      <div className="input-with-suffix">
                        <input
                          type="number"
                          step="0.00000001"
                          className="form-input"
                          placeholder="0.00000000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={isProcessing}
                        />
                        <span className="input-suffix">{currentAsset.symbol}</span>
                      </div>
                      <div className="balance-row">
                        <span className="available-text">Available: {currentAsset.balance.toFixed(8)}</span>
                        <button 
                          type="button" 
                          className="max-btn"
                          onClick={() => setAmount(currentAsset.balance.toFixed(8))}
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <div className="withdraw-notice">
                      <AlertTriangle size={16} />
                      <span>Withdrawal requests are processed manually. You will receive an update once your request is reviewed.</span>
                    </div>

                    {error && (
                      <div className="modal-alert error">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                      </div>
                    )}

                    {success && (
                      <div className="modal-alert success">
                        <CheckCircle size={16} />
                        <span>{success}</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={isProcessing || !withdrawAddress || !amount}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={18} className="spinning" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          <span>Submit Request</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetDetailPage;
