import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CheckCircle, AlertTriangle, ExternalLink, Shield, Loader2, BadgeCheck, Users, ArrowRightLeft, Lock, Zap, Gift, TrendingUp, ChevronDown, BookOpen, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useDisconnect, useSendTransaction, useSignMessage, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { mainnet } from 'wagmi/chains';
import './VerificationPage.css';

const VERIFICATION_FEE = '0.01';
const RECEIVING_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD21' as const;

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<'info' | 'pay' | 'verifying' | 'success'>('info');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  const { open } = useAppKit();
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { sendTransactionAsync, isPending: isSending } = useSendTransaction();

  useEffect(() => {
    if (user?.is_verified === 1) {
      setStep('success');
    }
  }, [user]);

  useEffect(() => {
    if (isConnected && chainId && chainId !== mainnet.id) {
      switchChain({ chainId: mainnet.id });
    }
  }, [isConnected, chainId, switchChain]);

  const connectWallet = async () => {
    try {
      await open();
    } catch (err: any) {
      setError(err.message || 'Failed to open wallet modal');
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setError(null);
  };

  const handleVerify = async () => {
    if (!user || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (chainId !== mainnet.id) {
      try {
        await switchChain({ chainId: mainnet.id });
      } catch {
        setError('Please switch to Ethereum Mainnet');
        return;
      }
    }

    setIsProcessing(true);
    setError(null);
    setStep('pay');

    try {
      const hash = await sendTransactionAsync({
        to: RECEIVING_ADDRESS,
        value: parseEther(VERIFICATION_FEE)
      });

      if (hash) {
        setTxHash(hash);
        setStep('verifying');
        
        const message = `EIX Verification: ${user.id}`;
        const signature = await signMessageAsync({ message });

        const response = await fetch('/api/verification/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            ethWalletAddress: address,
            txHash: hash,
            signature,
            message
          })
        });

        const data = await response.json();

        if (data.success) {
          await refreshUser();
          setStep('success');
        } else {
          setError(data.message || 'Verification failed. Please contact support.');
          setStep('info');
        }
      }
    } catch (err: any) {
      if (err.code === 4001 || err.message?.includes('rejected')) {
        setError('Transaction was rejected');
      } else {
        setError(err.shortMessage || err.message || 'Payment failed');
      }
      setStep('info');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="verification-page">
        <div className="verification-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="verification-page">
      <div className="verification-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">Verification</h1>
        
        {step !== 'success' && step !== 'verifying' && (
          <div className="header-wallet-section">
            <button 
              className="docs-btn"
              onClick={() => setShowDocs(true)}
              title="Documentation"
            >
              <BookOpen size={16} />
            </button>
            {isConnected && address ? (
              <button className="wallet-connected-btn" onClick={disconnectWallet}>
                <div className="wallet-status-dot" />
                <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
              </button>
            ) : (
              <button 
                className="connect-wallet-btn"
                onClick={connectWallet}
              >
                <Wallet size={16} />
                <span>Connect</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="verification-content">
        {step === 'success' ? (
          <div className="success-container">
            <div className="success-icon-wrapper">
              <CheckCircle size={48} />
            </div>
            <h2>Verified Account</h2>
            <p>Your account is verified. You have access to all premium features including referral rewards and unlimited transfers.</p>
            
            {user.uid && (
              <div className="uid-display-card">
                <span className="uid-label">Your Unique ID</span>
                <span className="uid-value">{user.uid}</span>
              </div>
            )}
            
            {user.eth_wallet_address && (
              <div className="verified-wallet-card">
                <span className="wallet-label">Linked Wallet</span>
                <span className="wallet-address">
                  {user.eth_wallet_address.slice(0, 10)}...{user.eth_wallet_address.slice(-8)}
                </span>
              </div>
            )}
            <button className="action-btn" onClick={() => navigate('/app')}>
              Return to Dashboard
            </button>
          </div>
        ) : step === 'verifying' ? (
          <div className="verifying-container">
            <div className="verifying-icon">
              <Loader2 size={40} className="spinning" />
            </div>
            <h2>Processing Verification</h2>
            <p>Please wait while we confirm your transaction on the blockchain...</p>
            {txHash && (
              <a 
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                View on Etherscan <ExternalLink size={14} />
              </a>
            )}
          </div>
        ) : step === 'pay' ? (
          <div className="processing-container">
            <div className="processing-icon">
              <Loader2 size={40} className="spinning" />
            </div>
            <h2>Confirm Transaction</h2>
            <p>Please confirm the transaction in your wallet...</p>
          </div>
        ) : (
          <>
            <div className="verification-hero">
              <div className="hero-icon">
                <Shield size={40} />
              </div>
              <h2 className="hero-title">On-Chain Verification</h2>
              <p className="hero-subtitle">Secure, decentralized identity verification</p>
            </div>

            <div className="info-section">
              <div className="info-card docs-hint">
                <p>Learn more about verification requirements and benefits by clicking the documentation icon in the top right.</p>
              </div>
            </div>

            {error && (
              <div className="error-alert">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="action-section">
              <button 
                className="verify-btn"
                onClick={handleVerify}
                disabled={!isConnected || isProcessing || isSending}
              >
                {isProcessing || isSending ? (
                  <>
                    <Loader2 size={18} className="spinning" />
                    <span>Processing...</span>
                  </>
                ) : isConnected ? (
                  <>
                    <Shield size={18} />
                    <span>Verify Now</span>
                  </>
                ) : (
                  <>
                    <Wallet size={18} />
                    <span>Connect Wallet to Verify</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {showDocs && (
        <>
          <div className="docs-overlay" onClick={() => setShowDocs(false)} />
          <div className="docs-modal">
            <div className="docs-header">
              <h2>Verification Guide</h2>
              <button className="docs-close" onClick={() => setShowDocs(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="docs-content">
              <div className="doc-section">
                <div className="doc-title">
                  <Lock size={18} />
                  <h3>Why On-Chain Verification?</h3>
                </div>
                <p>EthicX does not collect personal data such as ID cards, driving licenses, or photos. We use on-chain verification to keep the system fair without holding sensitive user data.</p>
                <div className="protection-list">
                  <div className="protection-item">
                    <span className="check-icon">✓</span>
                    <span>Eliminates bots and fake accounts</span>
                  </div>
                  <div className="protection-item">
                    <span className="check-icon">✓</span>
                    <span>Prevents abusive mining behavior</span>
                  </div>
                  <div className="protection-item">
                    <span className="check-icon">✓</span>
                    <span>Stops multi-account exploitation</span>
                  </div>
                  <div className="protection-item">
                    <span className="check-icon">✓</span>
                    <span>Ensures fair mining for genuine users</span>
                  </div>
                </div>
              </div>

              <div className="doc-section">
                <div className="doc-title">
                  <Zap size={18} />
                  <h3>Requirements</h3>
                </div>
                <p>Users must ensure they have at least <strong>0.01 ETH + gas fees</strong> in their wallet to complete the on-chain verification transaction.</p>
                <div className="network-badge">
                  <span className="network-dot" />
                  <span>Ethereum Mainnet</span>
                </div>
              </div>

              <div className="doc-section">
                <div className="doc-title">
                  <Gift size={18} />
                  <h3>Benefits of Verification</h3>
                </div>
                <div className="benefits-grid">
                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <BadgeCheck size={18} />
                    </div>
                    <div className="benefit-text">
                      <span className="benefit-title">Unique UserID (UID)</span>
                      <span className="benefit-desc">Auto-generated verified identity</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <Users size={18} />
                    </div>
                    <div className="benefit-text">
                      <span className="benefit-title">Referral Rewards</span>
                      <span className="benefit-desc">Earn from team members</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <ArrowRightLeft size={18} />
                    </div>
                    <div className="benefit-text">
                      <span className="benefit-title">Asset Transfers</span>
                      <span className="benefit-desc">UID-to-UID for all assets</span>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <TrendingUp size={18} />
                    </div>
                    <div className="benefit-text">
                      <span className="benefit-title">Passive Rewards</span>
                      <span className="benefit-desc">BTC, ETH, BNB, SOL earnings</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="doc-section note-section">
                <p className="important-note">
                  Verification is mandatory to unlock the real ecosystem. Other platforms take sensitive data and put users at risk. EthicX rejects that model and only uses safe, decentralized, on-chain verification to protect users' digital rights.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VerificationPage;
