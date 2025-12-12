import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Globe, Gift, Users, User, FlaskConical } from 'lucide-react';
import { useState, useCallback, memo, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpgrade } from '../contexts/UpgradeContext';
import { useAuth } from '../contexts/AuthContext';
import AnimatedNumberDisplay from './AnimatedNumberDisplay';
import './AppInterface.css';
import './Mining3D.css';
import MiningCubeGrid from './MiningCubeGrid';


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

          {/* Row 2: Mining Visualization + Reward Rate */}
          <div className="dashboard-main-content">
            {/* Left: Mining Animation */}
            <div 
              className="dashboard-mining-section"
              onClick={() => navigate('/upgrade')}>
            {/* 3D Mining Visualization */}
            <div className={`mining-3d-container mining-reduced ${upgradeLevel === 1 ? 'theme-upgraded' : upgradeLevel === 2 ? 'theme-premium' : upgradeLevel === 3 ? 'theme-ultimate' : ''}`}>
              <div className={`mining-scene ${miningActive ? 'mining-active' : ''}`}>
            
            
            {/* 24-Hour Time Ring */}
            <div className={`time-ring-24h ${miningActive ? 'mining-active' : ''}`}>
              <svg className="time-ring-svg" viewBox="0 0 400 400">
                <defs>
                  <linearGradient id="timeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={themeColors.gradientStart} stopOpacity="1" />
                    <stop offset="50%" stopColor={themeColors.gradientMid} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={themeColors.gradientEnd} stopOpacity="1" />
                  </linearGradient>
                  <filter id="professionalGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Subtle Glow */}
                <circle cx="200" cy="200" r="180" fill="none" stroke={`rgba(${themeColors.rgba}, 0.2)`} strokeWidth="18" opacity="0.9" />
                
                {/* Main Ring - Continuous Animated Progress Fill */}
                <circle 
                  className="time-progress-background" 
                  cx="200" 
                  cy="200" 
                  r="180" 
                  fill="none" 
                  stroke={`rgba(${themeColors.rgba}, 0.25)`} 
                  strokeWidth="14"
                />
                <circle 
                  className="time-progress-fill" 
                  cx="200" 
                  cy="200" 
                  r="180" 
                  fill="none" 
                  stroke="url(#timeGradient)" 
                  strokeWidth="14"
                  filter="url(#professionalGlow)"
                  strokeDasharray={`${2 * Math.PI * 180}`}
                  strokeDashoffset={`${2 * Math.PI * 180 * (1 - miningProgress / 100)}`}
                  transform="rotate(-90 200 200)"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            
            {/* Rotating Rings System - TEST MODE ENABLED for fast animation */}
            <div className={`ring-system-3d test-mode ${miningActive ? 'active-mining' : ''}`}>
              <div className="ring ring-orbit-1"></div>
              <div className="ring ring-orbit-2"></div>
              <div className="ring ring-orbit-3"></div>
              <div className="ring ring-orbit-4"></div>
              <div className="ring ring-orbit-5"></div>
              
              {/* Official EIX Logo - Always rendered to prevent layout shift */}
              <div className={`aiqx-official-logo mining-logo-appear ${miningActive ? 'mining-active' : ''}`} style={{
                opacity: miningActive ? 1 : 0,
                visibility: miningActive ? 'visible' : 'hidden',
                transition: 'opacity 0.3s ease'
              }}>
                <svg className="aiqx-logo-svg" viewBox="0 0 160 160">
                  {/* Coin outer ring */}
                  <defs>
                    <radialGradient id="goldGradient" cx="50%" cy="50%">
                      <stop offset="0%" stopColor={themeColors.primary} />
                      <stop offset="70%" stopColor={themeColors.secondary} />
                      <stop offset="100%" stopColor={themeColors.tertiary} />
                    </radialGradient>
                    <radialGradient id="innerGradient" cx="50%" cy="40%">
                      <stop offset="0%" stopColor="#1a1a1a" />
                      <stop offset="100%" stopColor="#000000" />
                    </radialGradient>
                  </defs>
                  
                  {/* Outer ring */}
                  <circle cx="80" cy="80" r="78" fill="url(#goldGradient)" />
                  <circle cx="80" cy="80" r="72" fill={themeColors.tertiary} />
                  
                  {/* Inner black circle with gradient */}
                  <circle cx="80" cy="80" r="68" fill="url(#innerGradient)" />
                  
                  {/* Exact Circuit Board Pattern from EIX Logo */}
                  <g className="circuit-pattern-exact">
                    
                    {/* Top Circuit Lines */}
                    <g className="circuit-top">
                      <path className="circuit-line circuit-1" d="M80,20 L80,35" stroke={themeColors.tertiary} strokeWidth="1.2" fill="none" />
                      <path className="circuit-line circuit-2" d="M80,35 L75,40 L75,50" stroke={themeColors.tertiary} strokeWidth="1" fill="none" />
                      <path className="circuit-line circuit-3" d="M80,35 L85,40 L85,50" stroke={themeColors.tertiary} strokeWidth="1" fill="none" />
                      <path className="circuit-line circuit-4" d="M65,25 L70,30 L70,45" stroke={themeColors.tertiary} strokeWidth="0.8" fill="none" />
                      <path className="circuit-line circuit-5" d="M95,25 L90,30 L90,45" stroke={themeColors.tertiary} strokeWidth="0.8" fill="none" />
                      <circle cx="80" cy="20" r="1.5" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="65" cy="25" r="1" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="95" cy="25" r="1" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="80" cy="35" r="0.8" fill={themeColors.tertiary} className="circuit-node" />
                    </g>
                    
                    {/* Right Circuit Lines */}
                    <g className="circuit-right">
                      <path className="circuit-line circuit-6" d="M140,80 L125,80" stroke={themeColors.tertiary} strokeWidth="1.2" fill="none" />
                      <path className="circuit-line circuit-7" d="M125,80 L120,75 L110,75" stroke={themeColors.tertiary} strokeWidth="1" fill="none" />
                      <path className="circuit-line circuit-8" d="M125,80 L120,85 L110,85" stroke={themeColors.tertiary} strokeWidth="1" fill="none" />
                      <path className="circuit-line circuit-9" d="M135,65 L130,70 L115,70" stroke={themeColors.tertiary} strokeWidth="0.8" fill="none" />
                      <path className="circuit-line circuit-10" d="M135,95 L130,90 L115,90" stroke={themeColors.tertiary} strokeWidth="0.8" fill="none" />
                      <circle cx="140" cy="80" r="1.5" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="135" cy="65" r="1" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="135" cy="95" r="1" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="125" cy="80" r="0.8" fill={themeColors.tertiary} className="circuit-node" />
                    </g>
                    
                    {/* Bottom Circuit Lines */}
                    <g className="circuit-bottom">
                      <path className="circuit-line circuit-11" d="M80,140 L80,125" stroke={themeColors.tertiary} strokeWidth="1.2" fill="none" />
                      <path className="circuit-line circuit-12" d="M80,125 L75,120 L75,110" stroke={themeColors.tertiary} strokeWidth="1" fill="none" />
                      <path className="circuit-line circuit-13" d="M80,125 L85,120 L85,110" stroke={themeColors.tertiary} strokeWidth="1" fill="none" />
                      <path className="circuit-line circuit-14" d="M65,135 L70,130 L70,115" stroke={themeColors.tertiary} strokeWidth="0.8" fill="none" />
                      <path className="circuit-line circuit-15" d="M95,135 L90,130 L90,115" stroke={themeColors.tertiary} strokeWidth="0.8" fill="none" />
                      <circle cx="80" cy="140" r="1.5" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="65" cy="135" r="1" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="95" cy="135" r="1" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="80" cy="125" r="0.8" fill={themeColors.tertiary} className="circuit-node" />
                    </g>
                    
                    {/* Left Circuit Lines */}
                    <g className="circuit-left">
                      <path className="circuit-line circuit-16" d="M20,80 L35,80" stroke={themeColors.tertiary} strokeWidth="1.2" fill="none" />
                      <path className="circuit-line circuit-17" d="M35,80 L40,75 L50,75" stroke={themeColors.tertiary} strokeWidth="1" fill="none" />
                      <path className="circuit-line circuit-18" d="M35,80 L40,85 L50,85" stroke={themeColors.tertiary} strokeWidth="1" fill="none" />
                      <path className="circuit-line circuit-19" d="M25,65 L30,70 L45,70" stroke={themeColors.tertiary} strokeWidth="0.8" fill="none" />
                      <path className="circuit-line circuit-20" d="M25,95 L30,90 L45,90" stroke={themeColors.tertiary} strokeWidth="0.8" fill="none" />
                      <circle cx="20" cy="80" r="1.5" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="25" cy="65" r="1" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="25" cy="95" r="1" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="35" cy="80" r="0.8" fill={themeColors.tertiary} className="circuit-node" />
                    </g>
                    
                    {/* Corner Circuit Connections */}
                    <g className="circuit-corners">
                      {/* Top-Right */}
                      <path className="circuit-line circuit-21" d="M110,50 L105,45 L100,45" stroke={themeColors.tertiary} strokeWidth="0.7" fill="none" />
                      <path className="circuit-line circuit-22" d="M115,40 L110,45 L110,50" stroke={themeColors.tertiary} strokeWidth="0.7" fill="none" />
                      <circle cx="115" cy="40" r="0.8" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="105" cy="45" r="0.6" fill={themeColors.tertiary} className="circuit-node" />
                      
                      {/* Top-Left */}
                      <path className="circuit-line circuit-23" d="M50,50 L55,45 L60,45" stroke={themeColors.tertiary} strokeWidth="0.7" fill="none" />
                      <path className="circuit-line circuit-24" d="M45,40 L50,45 L50,50" stroke={themeColors.tertiary} strokeWidth="0.7" fill="none" />
                      <circle cx="45" cy="40" r="0.8" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="55" cy="45" r="0.6" fill={themeColors.tertiary} className="circuit-node" />
                      
                      {/* Bottom-Right */}
                      <path className="circuit-line circuit-25" d="M110,110 L105,115 L100,115" stroke={themeColors.tertiary} strokeWidth="0.7" fill="none" />
                      <path className="circuit-line circuit-26" d="M115,120 L110,115 L110,110" stroke={themeColors.tertiary} strokeWidth="0.7" fill="none" />
                      <circle cx="115" cy="120" r="0.8" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="105" cy="115" r="0.6" fill={themeColors.tertiary} className="circuit-node" />
                      
                      {/* Bottom-Left */}
                      <path className="circuit-line circuit-27" d="M50,110 L55,115 L60,115" stroke={themeColors.tertiary} strokeWidth="0.7" fill="none" />
                      <path className="circuit-line circuit-28" d="M45,120 L50,115 L50,110" stroke={themeColors.tertiary} strokeWidth="0.7" fill="none" />
                      <circle cx="45" cy="120" r="0.8" fill={themeColors.tertiary} className="circuit-node" />
                      <circle cx="55" cy="115" r="0.6" fill={themeColors.tertiary} className="circuit-node" />
                    </g>
                    
                    {/* Inner Connection Points */}
                    <g className="inner-connections">
                      <circle cx="75" cy="50" r="0.5" fill={themeColors.tertiary} opacity="0.6" />
                      <circle cx="85" cy="50" r="0.5" fill={themeColors.tertiary} opacity="0.6" />
                      <circle cx="110" cy="75" r="0.5" fill={themeColors.tertiary} opacity="0.6" />
                      <circle cx="110" cy="85" r="0.5" fill={themeColors.tertiary} opacity="0.6" />
                      <circle cx="85" cy="110" r="0.5" fill={themeColors.tertiary} opacity="0.6" />
                      <circle cx="75" cy="110" r="0.5" fill={themeColors.tertiary} opacity="0.6" />
                      <circle cx="50" cy="85" r="0.5" fill={themeColors.tertiary} opacity="0.6" />
                      <circle cx="50" cy="75" r="0.5" fill={themeColors.tertiary} opacity="0.6" />
                    </g>
                  </g>
                  
                  {/* Central Hash Chip Icon - Mathematically Centered */}
                  <foreignObject x="66" y="66" width="28" height="28">
                    <div style={{ 
                      width: '28px', 
                      height: '28px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <Cpu 
                        size={26} 
                        color={themeColors.primary}
                        strokeWidth={1.5}
                        style={{ 
                          filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.8))',
                          animation: miningActive ? 'pulse 2s ease-in-out infinite' : 'none',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    </div>
                  </foreignObject>
                </svg>
              </div>
              
            </div>
          </div>
          </div>
          </div>
            {/* End Mining Section */}
          
            {/* Right: Reward Rate Section */}
            <div className="dashboard-reward-section">
              <MiningCubeGrid 
                miningRate={miningRate}
                themeColors={themeColors}
              />
            </div>
          </div>
          {/* End dashboard-main-content */}

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