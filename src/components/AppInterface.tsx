import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Globe, Gift, Users, User, FlaskConical } from 'lucide-react';
import { useState, useCallback, memo, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpgrade } from '../contexts/UpgradeContext';
import { useAuth } from '../contexts/AuthContext';
import AnimatedNumberDisplay from './AnimatedNumberDisplay';
import './AppInterface.css';
import './Mining3D.css';


// Premium navigation button component
const PremiumNavButton = memo(({ 
  icon: Icon, 
  label, 
  onClick, 
  isActive = false 
}: { 
  icon: typeof Globe; 
  label: string; 
  onClick: () => void; 
  isActive?: boolean;
}) => (
  <motion.button
    className={`premium-nav-btn ${isActive ? 'active' : ''}`}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="nav-icon-wrapper">
      <div className="nav-icon-glow" />
      <Icon size={22} />
    </div>
    <span className="nav-label">{label}</span>
  </motion.button>
));

PremiumNavButton.displayName = 'PremiumNavButton';

// Premium home button component
const PremiumHomeButton = memo(({ onClick }: { onClick: () => void }) => (
  <motion.button
    className="premium-home-btn"
    whileHover={{ scale: 1.08, rotate: 5 }}
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, type: "spring" }}
  >
    <div className="home-icon-wrapper">
      <div className="home-icon-pulse" />
      <img src="/ethicx-logo.png" alt="EthicX" className="home-logo" style={{ width: 26, height: 26, objectFit: 'contain' }} />
    </div>
    <span className="home-label">EthicX</span>
  </motion.button>
));

PremiumHomeButton.displayName = 'PremiumHomeButton';

const AppInterface = memo(() => {
  const navigate = useNavigate();
  const { timerSeconds, upgradeLevel, miningRate } = useUpgrade();
  const { user, updateBalance } = useAuth();
  const [miningActive, setMiningActive] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [isBalanceAnimating, setIsBalanceAnimating] = useState(false);
  const [animatedBalance, setAnimatedBalance] = useState(0);
  const [pendingReward, setPendingReward] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedStatus = useRef(false);
  
  // Track if user has ever started mining
  const [hasEverMined, setHasEverMined] = useState(false);

  // Get real balance from user context
  const balance = user?.balance || 0;
  
  // Fetch mining status on mount
  useEffect(() => {
    if (!user?.id || hasFetchedStatus.current) return;
    
    const fetchMiningStatus = async () => {
      try {
        const response = await fetch(`/api/mining/status/${user.id}`);
        const data = await response.json();
        
        if (data.success) {
          hasFetchedStatus.current = true;
          
          if (data.hasActiveSession && data.session) {
            setHasEverMined(true);
            const startTime = new Date(data.session.started_at).getTime();
            const endTime = new Date(data.session.ends_at).getTime();
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
            const totalDuration = (endTime - startTime) / 1000;
            const elapsed = (now - startTime) / 1000;
            const progress = Math.min(100, (elapsed / totalDuration) * 100);
            
            setCountdownSeconds(remaining);
            setMiningProgress(progress);
            setPendingReward(data.accumulatedReward || 0);
            
            if (remaining <= 0 || data.canClaim) {
              setMiningActive(false);
              setCanClaim(true);
              setMiningProgress(100);
            } else {
              setMiningActive(true);
              setCanClaim(false);
            }
          } else {
            setMiningActive(false);
            setCanClaim(false);
            setMiningProgress(0);
          }
        }
      } catch (error) {
        console.error('Failed to fetch mining status:', error);
      }
    };
    
    fetchMiningStatus();
  }, [user?.id]);

  // Update display balance when user balance changes
  useEffect(() => {
    if (!isBalanceAnimating) {
      setDisplayBalance(balance);
    }
  }, [balance, isBalanceAnimating]);

  // Get theme colors based on upgrade level (always visible) - Use useMemo to update when upgradeLevel changes
  const themeColors = useMemo(() => {
    if (upgradeLevel === 1) {
      // Green theme for 6 hours upgrade - Single color with monochromatic shades
      return {
        primary: '#00FF7F',
        secondary: '#00E070',
        tertiary: '#00C060',
        gradientStart: '#00FF7F',
        gradientMid: '#00FF7F',
        gradientEnd: '#00FF7F',
        rgba: '0, 255, 127'
      };
    } else if (upgradeLevel === 2) {
      // Purple theme for 12 hours upgrade - Single color with monochromatic shades
      return {
        primary: '#9333EA',
        secondary: '#8020D0',
        tertiary: '#7010C0',
        gradientStart: '#9333EA',
        gradientMid: '#9333EA',
        gradientEnd: '#9333EA',
        rgba: '147, 51, 234'
      };
    } else if (upgradeLevel === 3) {
      // Orange theme for 24 hours ultimate upgrade - Single color with monochromatic shades
      return {
        primary: '#FF7A1A',
        secondary: '#E66A10',
        tertiary: '#CC5A00',
        gradientStart: '#FF7A1A',
        gradientMid: '#FF7A1A',
        gradientEnd: '#FF7A1A',
        rgba: '255, 122, 26'
      };
    } else {
      // Default golden theme for level 0 - Single color with monochromatic shades
      return {
        primary: '#DAA520',
        secondary: '#C89510',
        tertiary: '#B68500',
        gradientStart: '#DAA520',
        gradientMid: '#DAA520',
        gradientEnd: '#DAA520',
        rgba: '218, 165, 32'
      };
    }
  }, [upgradeLevel]); // Recalculate whenever upgradeLevel changes

  // Countdown timer and progress effect with fast reward display animation
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    let displayInterval: NodeJS.Timeout | null = null;
    
    if (miningActive && countdownSeconds > 0) {
      // Main countdown - updates every second for time tracking
      countdownInterval = setInterval(() => {
        setCountdownSeconds(prev => {
          const newCountdown = prev - 1;
          if (newCountdown <= 0) {
            setMiningActive(false);
            setCanClaim(true);
            setMiningProgress(100);
            setPendingReward(miningRate * (timerSeconds / 3600));
            return 0;
          }
          // Calculate progress based on countdown
          const elapsed = timerSeconds - newCountdown;
          const progress = Math.min(100, (elapsed / timerSeconds) * 100);
          setMiningProgress(progress);
          return newCountdown;
        });
      }, 1000);
      
      // Fast display update - updates every 100ms for smooth visual counting
      displayInterval = setInterval(() => {
        setCountdownSeconds(prev => {
          const elapsed = timerSeconds - prev;
          const hoursElapsed = elapsed / 3600;
          setPendingReward(miningRate * hoursElapsed);
          return prev;
        });
      }, 100);
    }
    
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      if (displayInterval) {
        clearInterval(displayInterval);
      }
    };
  }, [miningActive, countdownSeconds, timerSeconds, miningRate]);

  const handleStartMining = useCallback(async () => {
    if (!user?.id || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/mining/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      const data = await response.json();
      
      if (data.success && data.session) {
        setHasEverMined(true);
        const endTime = new Date(data.session.ends_at).getTime();
        const remaining = Math.floor((endTime - Date.now()) / 1000);
        
        setMiningActive(true);
        setCanClaim(false);
        setMiningProgress(0);
        setCountdownSeconds(remaining);
        setPendingReward(0);
      } else {
        console.error('Failed to start mining:', data.message);
      }
    } catch (error) {
      console.error('Error starting mining:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isLoading]);

  const handleClaimRewards = useCallback(async () => {
    if (!user?.id || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/mining/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const rewardAmount = data.reward || 0;
        const newBalance = data.newBalance || balance + rewardAmount;
        
        // Trigger balance animation
        const previousBalance = balance;
        
        setIsBalanceAnimating(true);
        setAnimatedBalance(rewardAmount);
        
        // Animate balance counting from old to new
        const startTime = Date.now();
        const animationDuration = 2000;
        
        const animateBalanceDisplay = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);
          const currentBalance = previousBalance + (rewardAmount * progress);
          setDisplayBalance(currentBalance);
          
          if (progress < 1) {
            requestAnimationFrame(animateBalanceDisplay);
          }
        };
        
        animateBalanceDisplay();
        
        // Update auth context balance after animation
        setTimeout(async () => {
          setIsBalanceAnimating(false);
          setAnimatedBalance(0);
          setDisplayBalance(newBalance);
          updateBalance(newBalance);
          setCanClaim(false);
          setMiningProgress(0);
          setPendingReward(0);
          
          // Automatically restart mining after claiming
          try {
            const startResponse = await fetch('/api/mining/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id }),
            });
            
            const startData = await startResponse.json();
            
            if (startData.success && startData.session) {
              const endTime = new Date(startData.session.ends_at).getTime();
              const remaining = Math.floor((endTime - Date.now()) / 1000);
              
              setMiningActive(true);
              setCountdownSeconds(remaining);
            }
          } catch (error) {
            console.error('Error auto-restarting mining:', error);
          }
        }, 2000);
      } else {
        console.error('Failed to claim reward:', data.message);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isLoading, balance, updateBalance]);

  const handleHomeClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleLabClick = useCallback(() => {
    navigate('/lab');
  }, [navigate]);

  const handleProfileClick = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  const handleTeamClick = useCallback(() => {
    navigate('/team');
  }, [navigate]);

  const handleRewardsClick = useCallback(() => {
    navigate('/rewards');
  }, [navigate]);

  return (
    <div className="app-interface-premium" style={{
      minHeight: '100vh',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative',
      scrollBehavior: 'smooth',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* Premium gradient background */}
      <div className="premium-bg-gradient" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -2
      }} />
      
      {/* Animated mesh overlay */}
      <div className="animated-mesh" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1
      }} />
      
      {/* Floating orbs */}
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />
      <div className="floating-orb orb-3" />

      {/* Main Dashboard Container */}
      <motion.div
        className="premium-dashboard"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          paddingBottom: '150px',
          minHeight: 'calc(100vh - 80px)'
        }}
      >
        {/* Dashboard Header */}
        <motion.div 
          className="dashboard-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="header-left">
            <Cpu className="header-icon" />
            <h1 className="dashboard-title">EIX Mining</h1>
          </div>
        </motion.div>

        {/* ========== UNIFIED MINING DASHBOARD GRID ========== */}
        <motion.div 
          className="unified-mining-dashboard"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Row 1: Balance */}
          <div 
            className="dashboard-balance-row"
            onClick={() => navigate('/wallet/assets')}
            style={{
              background: `rgba(${themeColors.rgba}, 0.06)`,
              borderBottomColor: `rgba(${themeColors.rgba}, 0.15)`
            }}
          >
            <div className="balance-icon-circle" style={{ width: '48px', height: '48px' }}>
              <img src="/eix-balance-grid.png" alt="EIX" className="balance-icon" style={{ width: '36px', height: '36px' }} />
            </div>
            <div className="balance-info-compact">
              <div className="balance-info-label-compact">BALANCE</div>
              <motion.div 
                className="balance-amount-compact"
                animate={isBalanceAnimating ? { scale: 1.06 } : { scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {(isBalanceAnimating ? displayBalance : balance).toFixed(6)} <span className="balance-unit-compact" style={{ color: themeColors.primary }}>EIX</span>
              </motion.div>
              {isBalanceAnimating && (
                <motion.div
                  className="balance-reward-compact"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -25 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  style={{ color: themeColors.primary }}
                >
                  +{animatedBalance.toFixed(6)}
                </motion.div>
              )}
            </div>
          </div>

          {/* New Professional Mining Interface */}
          <div className="mining-status-display" style={{
            padding: '30px',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            minHeight: '200px'
          }}>
            <div className="status-header-professional" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: miningActive ? themeColors.primary : '#9CA3AF'
            }}>
              <div className={`status-dot-large ${miningActive ? 'active' : ''}`} style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: miningActive ? themeColors.primary : '#4B5563',
                boxShadow: miningActive ? `0 0 15px ${themeColors.primary}` : 'none'
              }} />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}>
                {miningActive ? 'System Active' : 'System Standby'}
              </span>
            </div>

            <div className="mining-rate-professional" style={{
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Hashpower</div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '800', 
                color: '#F4F6F8',
                fontFamily: 'monospace'
              }}>
                {miningActive ? (miningRate * 0.95 + Math.random() * 0.1 * miningRate).toFixed(2) : '0.00'} <span style={{ fontSize: '16px', color: themeColors.primary }}>GH/s</span>
              </div>
            </div>
          </div>

          {/* Row 3: Mining Progress - Inside Unified Grid */}
          <div className="dashboard-progress-row" style={{
            display: (miningActive || miningProgress === 100 || canClaim || !hasEverMined) ? 'block' : 'none'
          }}>
            {/* Mining Control System */}
            <div className="mining-control-system" style={{ margin: 0, padding: 0 }}>
          
          {/* Professional Action Button - Always visible area */}
          <div className="mining-action-container">
            {!miningActive && !hasEverMined ? (
              <button 
                className="start-mining-btn"
                onClick={handleStartMining}
                style={{ 
                  background: '#1E242E',
                  color: '#C5CBD4',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  border: '1px solid rgba(120, 132, 156, 0.18)',
                  fontSize: '13px',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease',
                  minWidth: '180px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#232936';
                  e.currentTarget.style.borderColor = 'rgba(120, 132, 156, 0.25)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
                  e.currentTarget.style.color = '#F4F6F8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1E242E';
                  e.currentTarget.style.borderColor = 'rgba(120, 132, 156, 0.18)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.color = '#C5CBD4';
                }}
              >
                <span>START MINING</span>
              </button>
            ) : null}
          </div>
          
          {/* Professional Mining Progress Container */}
          <div className="mining-progress-container" style={{
            visibility: (miningActive || miningProgress === 100 || canClaim) ? 'visible' : 'hidden',
            opacity: (miningActive || miningProgress === 100 || canClaim) ? 1 : 0,
            transition: 'opacity 0.3s ease',
            height: (miningActive || miningProgress === 100 || canClaim) ? 'auto' : '0',
            minHeight: '0'
          }}>
            
            {/* Header */}
            <div className="mining-progress-container-header">
              MINING PROGRESS
            </div>

            {/* Timer Display */}
            <div className="mining-progress-timer">
              {Math.floor(countdownSeconds / 3600).toString().padStart(2, '0')}:
              {Math.floor((countdownSeconds % 3600) / 60).toString().padStart(2, '0')}:
              {(countdownSeconds % 60).toString().padStart(2, '0')}
            </div>

            {/* Progress Bar with Percentage */}
            <div className="professional-progress-bar-container">
              <div className="professional-progress-bar">
                <div className="progress-fill-professional" style={{ 
                  width: `${miningProgress}%`,
                  background: `linear-gradient(90deg, ${themeColors.gradientStart}, ${themeColors.gradientMid}, ${themeColors.gradientEnd})`,
                  height: '100%',
                  transition: 'width 0.3s ease',
                  boxShadow: `0 0 12px rgba(${themeColors.rgba}, 0.6)`
                }}>
                  <div className="progress-glow" style={{
                    background: `rgba(${themeColors.rgba}, 0.3)`,
                    height: '100%'
                  }}></div>
                  {/* Floating Particles */}
                  <div className="progress-particle particle-1" style={{ backgroundColor: `rgba(${themeColors.rgba}, 0.8)` }}></div>
                  <div className="progress-particle particle-2" style={{ backgroundColor: `rgba(${themeColors.rgba}, 0.6)` }}></div>
                  <div className="progress-particle particle-3" style={{ backgroundColor: `rgba(${themeColors.rgba}, 0.7)` }}></div>
                  <div className="progress-particle particle-4" style={{ backgroundColor: `rgba(${themeColors.rgba}, 0.5)` }}></div>
                  <div className="progress-particle particle-5" style={{ backgroundColor: `rgba(${themeColors.rgba}, 0.9)` }}></div>
                </div>
              </div>
              {/* Percentage on right */}
              <span style={{
                position: 'absolute',
                right: '0',
                top: '-18px',
                fontSize: '11px',
                fontWeight: '700',
                color: themeColors.primary
              }}>{miningProgress.toFixed(1)}%</span>
            </div>

            {/* Info Display - Changes based on mining status */}
            {miningProgress >= 100 && canClaim ? (
              <>
                {/* Available For Claim text */}
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: themeColors.primary,
                  textAlign: 'left',
                  marginBottom: '8px'
                }}>
                  Available For Claim
                </div>
                {/* Mined Amount with Token Logo */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '10px'
                }}>
                  <img 
                    src="/ethicx-logo.png" 
                    alt="EIX" 
                    style={{
                      width: '20px',
                      height: '20px',
                      objectFit: 'contain'
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#E5E7EB'
                  }}>
                    +{(pendingReward > 0 ? pendingReward : miningRate * (timerSeconds / 3600)).toFixed(6)} EIX
                  </span>
                </div>
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{
                  fontSize: '11px',
                  color: '#9CA3AF',
                  fontWeight: '500'
                }}>Accumulating: <span style={{ color: '#E5E7EB', fontFamily: 'Monaco, Courier New, monospace' }}>+<AnimatedNumberDisplay value={pendingReward > 0 ? pendingReward : (miningRate * ((timerSeconds - countdownSeconds) / 3600))} decimals={6} color="#E5E7EB" /> EIX</span></span>
                <span style={{
                  fontSize: '11px',
                  color: '#9CA3AF',
                  fontWeight: '500',
                  display: 'none'
                }}>Rate: <span style={{ color: themeColors.primary }}>{miningRate} EIX/hr</span></span>
              </div>
            )}

            {/* CLAIM Button - Right aligned when at 100% */}
            {miningProgress >= 100 && canClaim && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '16px'
              }}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (canClaim && miningProgress >= 100) {
                      handleClaimRewards();
                    }
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.gradientStart}, ${themeColors.gradientEnd})`,
                    color: '#1A1F2E',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 16px rgba(${themeColors.rgba}, 0.4)`,
                    minWidth: '160px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px rgba(${themeColors.rgba}, 0.6)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 16px rgba(${themeColors.rgba}, 0.4)`;
                  }}
                >
                  CLAIM
                </button>
              </div>
            )}
          </div>
          </div>
          </div>
        </motion.div>
        {/* End Unified Mining Dashboard */}

        
        {/* Bottom Spacer for Scrolling */}
        <div style={{ height: '100px' }}></div>
      </motion.div>


      {/* Premium Bottom Navigation */}
      <AnimatePresence>
        <motion.div 
          className="premium-bottom-nav"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <div className="nav-glass-bg" />
          <div className="nav-content">
            <PremiumNavButton icon={FlaskConical} label="Lab" onClick={handleLabClick} />
            <PremiumNavButton icon={Gift} label="Rewards" onClick={handleRewardsClick} />
            <PremiumHomeButton onClick={handleHomeClick} />
            <PremiumNavButton icon={Users} label="Team" onClick={handleTeamClick} />
            <PremiumNavButton icon={User} label="Profile" onClick={handleProfileClick} />
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  );
});

AppInterface.displayName = 'AppInterface';

export default AppInterface;