import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  RefreshCw, 
  Copy, 
  Check,
  TrendingUp,
  Clock,
  Wallet,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './WalletPage.css';

interface Transaction {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
};

const sheetVariants = {
  hidden: { 
    y: "100%",
    opacity: 0
  },
  visible: { 
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    y: "100%",
    opacity: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 40
    }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateBalance, refreshUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<'send' | 'receive' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setBalance(user.balance);
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/wallet/transactions/${user.id}?limit=15`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const refreshBalance = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      await refreshUser();
      await loadTransactions();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    if (!user) return;
    
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amount > balance) {
      setError('Insufficient balance');
      return;
    }
    
    if (!recipientUsername.trim()) {
      setError('Please enter a username');
      return;
    }
    
    setIsSending(true);
    
    try {
      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user.id,
          toUsername: recipientUsername.trim(),
          amount: amount
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Successfully sent ${amount} EIX to @${recipientUsername}`);
        setSendAmount('');
        setRecipientUsername('');
        updateBalance(data.newBalance);
        setBalance(data.newBalance);
        loadTransactions();
        setTimeout(() => {
          setSheetMode(null);
          setSuccessMessage(null);
        }, 2000);
      } else {
        setError(data.message || 'Transfer failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const copyUsername = async () => {
    if (user) {
      try {
        await navigator.clipboard.writeText(user.username);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const openSheet = (mode: 'send' | 'receive') => {
    setError(null);
    setSuccessMessage(null);
    setSheetMode(mode);
  };

  const closeSheet = () => {
    setSheetMode(null);
    setError(null);
    setSuccessMessage(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatBalance = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const formatAmount = (value: number) => {
    if (value >= 1000) {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toFixed(6);
  };

  const groupTransactionsByDay = (txs: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    txs.forEach(tx => {
      const txDate = new Date(tx.created_at);
      let dayLabel: string;

      if (txDate.toDateString() === today.toDateString()) {
        dayLabel = 'Today';
      } else if (txDate.toDateString() === yesterday.toDateString()) {
        dayLabel = 'Yesterday';
      } else {
        dayLabel = txDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: txDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      if (!groups[dayLabel]) {
        groups[dayLabel] = [];
      }
      groups[dayLabel].push(tx);
    });

    return groups;
  };

  const groupedTransactions = groupTransactionsByDay(transactions);

  if (!user) {
    return (
      <div className="wallet-container">
        <div className="wallet-loading">Loading wallet...</div>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <button 
          className="wallet-back-btn"
          onClick={() => navigate('/app')}
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="wallet-title">Wallet</h1>
        <button 
          className="wallet-refresh-btn"
          onClick={refreshBalance}
          disabled={isLoading}
          aria-label="Refresh balance"
        >
          <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      <motion.div 
        className="wallet-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero-balance-panel" variants={itemVariants}>
          <div className="hero-top-row">
            <div className="hero-token-badge">
              <div className="token-logo-container">
                <div className="token-logo-glow" />
                <div className="token-logo-ring">
                  <span className="token-logo-text">EIX</span>
                </div>
              </div>
              <div className="token-info">
                <span className="token-name">EIX Token</span>
                <span className="token-network">EthicX Network</span>
              </div>
            </div>
            <div className="hero-status-chip">
              <span className="status-dot" />
              <span className="status-text">Active</span>
            </div>
          </div>

          <div className="hero-balance-section">
            <span className="balance-label">Total Balance</span>
            <div className="balance-main-row">
              <motion.span 
                className="balance-value"
                key={balance}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {formatBalance(balance)}
              </motion.span>
              <span className="balance-currency">EIX</span>
            </div>
            <div className="balance-fiat-row">
              <span className="balance-fiat">≈ $0.00 USD</span>
              <span className="balance-change positive">
                <TrendingUp size={10} />
                +0.00%
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div className="action-rail" variants={itemVariants}>
          <motion.button 
            className="action-card"
            onClick={() => openSheet('send')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="action-icon-wrapper send">
              <ArrowUpRight size={22} />
            </div>
            <span className="action-label">Send</span>
          </motion.button>
          <motion.button 
            className="action-card"
            onClick={() => openSheet('receive')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="action-icon-wrapper receive">
              <ArrowDownLeft size={22} />
            </div>
            <span className="action-label">Receive</span>
          </motion.button>
        </motion.div>

        {transactions.length > 0 ? (
          <motion.div className="transactions-panel" variants={itemVariants}>
            <div className="transactions-header">
              <h3 className="transactions-title">Recent Activity</h3>
              <span className="transactions-count">{transactions.length} transactions</span>
            </div>
            <div className="transactions-timeline">
              {Object.entries(groupedTransactions).map(([dayLabel, dayTransactions], groupIndex) => (
                <div key={dayLabel} className="tx-day-group">
                  <div className="tx-day-header">
                    <span className="tx-day-label">{dayLabel}</span>
                    <span className="tx-day-count">{dayTransactions.length}</span>
                  </div>
                  <div className="tx-day-items">
                    {dayTransactions.map((tx, index) => {
                      const isSent = tx.from_user_id === user?.id;
                      const icon = isSent ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />;
                      const typeClass = isSent ? 'sent' : 'received';
                      const sign = isSent ? '-' : '+';
                      
                      return (
                        <motion.div 
                          key={tx.id} 
                          className="tx-item"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (groupIndex * 0.1) + (index * 0.03) }}
                        >
                          <div className={`tx-icon-container ${typeClass}`}>
                            {icon}
                          </div>
                          <div className="tx-details">
                            <span className="tx-primary">
                              {tx.description || (isSent ? 'Sent EIX' : 'Received EIX')}
                            </span>
                            <span className="tx-secondary">
                              <Clock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                              {formatDate(tx.created_at)}
                            </span>
                          </div>
                          <div className="tx-amount-container">
                            <span className={`tx-amount ${typeClass}`}>
                              {sign}{formatAmount(tx.amount)}
                            </span>
                            <span className={`tx-status-pill ${typeClass}`}>
                              <span className="status-indicator" />
                              Completed
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div className="transactions-panel" variants={itemVariants}>
            <div className="empty-state">
              <div className="empty-icon">
                <Wallet size={28} />
              </div>
              <h4 className="empty-title">No transactions yet</h4>
              <p className="empty-description">
                Your transaction history will appear here once you send or receive EIX
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {sheetMode && (
          <>
            <motion.div 
              className="sheet-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeSheet}
            />
            <motion.div 
              className="bottom-sheet"
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="sheet-handle-container">
                <div className="sheet-handle" />
              </div>
              
              <div className="sheet-header">
                <div className="sheet-header-content">
                  <div className={`sheet-icon ${sheetMode}`}>
                    {sheetMode === 'send' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                  </div>
                  <div className="sheet-title-group">
                    <h2 className="sheet-title">
                      {sheetMode === 'send' ? 'Send EIX' : 'Receive EIX'}
                    </h2>
                    <span className="sheet-subtitle">
                      {sheetMode === 'send' ? 'Transfer to any user' : 'Share your username'}
                    </span>
                  </div>
                </div>
                <button className="sheet-close-btn" onClick={closeSheet}>
                  <X size={20} />
                </button>
              </div>

              <div className="sheet-content">
                {sheetMode === 'send' && (
                  <form onSubmit={handleSend} className="send-form">
                    <div className="form-group">
                      <label className="form-label">Recipient</label>
                      <div className="input-wrapper">
                        <span className="input-prefix">@</span>
                        <input
                          type="text"
                          className="form-input with-prefix"
                          placeholder="Enter username"
                          value={recipientUsername}
                          onChange={(e) => setRecipientUsername(e.target.value)}
                          disabled={isSending}
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Amount</label>
                      <div className="input-wrapper">
                        <input
                          type="number"
                          step="0.000001"
                          className="form-input with-suffix"
                          placeholder="0.00"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          disabled={isSending}
                        />
                        <span className="input-suffix">EIX</span>
                      </div>
                      <div className="amount-helper">
                        <span className="available-balance">
                          Available: <span className="available-value">{balance.toFixed(6)} EIX</span>
                        </span>
                        <button 
                          type="button" 
                          className="max-btn"
                          onClick={() => setSendAmount(balance.toFixed(6))}
                          disabled={isSending}
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          className="alert-message alert-error"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {error}
                        </motion.div>
                      )}

                      {successMessage && (
                        <motion.div 
                          className="alert-message alert-success"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {successMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button 
                      type="submit"
                      className="submit-btn"
                      disabled={isSending || !recipientUsername || !sendAmount}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Send size={18} />
                      <span>{isSending ? 'Processing...' : 'Send EIX'}</span>
                    </motion.button>
                  </form>
                )}

                {sheetMode === 'receive' && (
                  <div className="receive-content">
                    <div className="receive-token-display">
                      <div className="receive-logo-container">
                        <div className="receive-logo-glow" />
                        <div className="receive-logo-ring">
                          <span className="receive-logo-text">EIX</span>
                        </div>
                      </div>
                      <span className="receive-token-name">EIX Token</span>
                    </div>
                    
                    <p className="receive-description">
                      Share your username with others to receive EIX tokens instantly on the EthicX Network
                    </p>
                    
                    <div className="username-card">
                      <span className="username-label">Your Username</span>
                      <div className="username-row">
                        <span className="username-value">@{user.username}</span>
                        <motion.button 
                          className="copy-btn" 
                          onClick={copyUsername}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Copy username"
                        >
                          {copied ? <Check size={18} /> : <Copy size={18} />}
                        </motion.button>
                      </div>
                    </div>

                    <div className="receive-note">
                      <span className="note-icon">💡</span>
                      <span className="note-text">Transfers are instant and free within EthicX</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletPage;
