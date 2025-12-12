import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import './PremiumSplashScreen.css';
import aiqxLogo from '../assets/aiqx-logo-cropped.png';

// Preload logo for instant visibility
const preloadImage = new Image();
preloadImage.src = aiqxLogo;
preloadImage.loading = 'eager';
preloadImage.decoding = 'sync';

interface PremiumSplashScreenProps {
  onComplete: () => void;
}

const PremiumSplashScreen = memo(({ onComplete }: PremiumSplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  // Memoize particles to prevent regeneration on every render - optimized for performance
  const particles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: `particle-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      zDepth: -50 + Math.random() * 300,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 2
    })), []
  );


  // Memoize vortex rings to prevent regeneration - optimized for performance
  const vortexRings = useMemo(() => 
    Array.from({ length: 3 }, (_, i) => ({
      id: `vortex-${i}`,
      size: 100 + i * 80,
      zPosition: i * -40,
      rotationSpeed: 20 + i * 5,
      delay: i * 0.1
    })), []
  );


  // Memoized complete handler
  const handleComplete = useCallback(() => {
    setIsExiting(true);
    setTimeout(onComplete, 500);
  }, [onComplete]);

  useEffect(() => {
    // Complete after 7 seconds without state updates for better performance
    const totalDuration = 7000; // 7 seconds
    
    const completeTimeout = setTimeout(handleComplete, totalDuration);

    return () => {
      clearTimeout(completeTimeout);
    };
  }, [handleComplete]);

  return (
    <div className={`premium-splash-container ${isExiting ? 'exiting' : ''}`}>
      {/* 3D Background Container with Perspective */}
      <div className="background-3d-container">
        {/* Layer 1: Deep space gradient base */}
        <div className="bg-layer-1" />
        
        {/* Layer 2: 3D Hexagonal Grid */}
        <div className="hex-grid" />
        
        {/* Layer 3: Energy waves */}
        <div className="energy-waves">
          <div className="wave wave-1" />
          <div className="wave wave-2" />
          <div className="wave wave-3" />
          <div className="wave wave-4" />
        </div>
        
        {/* Layer 4: 3D Particle Field - Memoized */}
        <div className="particle-field">
          {particles.map((particle) => (
            <div 
              key={particle.id} 
              className="particle-3d"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                '--particle-delay': `${particle.delay}s`,
                '--duration': `${particle.duration}s`,
                '--z-depth': `${particle.zDepth}px`
              } as React.CSSProperties}
            />
          ))}
        </div>
        
        
        {/* Layer 6: 3D Vortex Tunnel - Memoized */}
        <div className="vortex-tunnel">
          {vortexRings.map((ring) => (
            <div 
              key={ring.id}
              className="vortex-ring"
              style={{
                '--ring-size': `${ring.size}`,
                '--z-position': `${ring.zPosition}px`,
                '--rotation-speed': `${ring.rotationSpeed}s`,
                '--vortex-delay': `${ring.delay}s`
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Layer 7: Perfect Professional Rays */}
        <div className="perfect-rays-container">
          {/* Ambient glow base */}
          <div className="rays-ambient-glow" />
          
          {/* Primary ray system */}
          <svg className="rays-primary" viewBox="0 0 2000 2000" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="perfect-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#DAA520" stopOpacity="0.35" />
                <stop offset="25%" stopColor="#DAA520" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#FFA500" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
              </radialGradient>
              
              <linearGradient id="ray-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#DAA520" stopOpacity="0" />
                <stop offset="30%" stopColor="#DAA520" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#FFA500" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
              </linearGradient>
              
              <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <mask id="center-mask">
                <rect width="2000" height="2000" fill="white" />
                <circle cx="1000" cy="1000" r="250" fill="black" />
              </mask>
            </defs>
            
            <g mask="url(#center-mask)" filter="url(#soft-glow)">
              {/* Primary cardinal rays - ultra slim */}
              <path d="M1000,1000 L995,0 L1005,0 Z" fill="url(#perfect-gradient)" opacity="0.45" />
              <path d="M1000,1000 L2000,995 L2000,1005 Z" fill="url(#perfect-gradient)" opacity="0.45" />
              <path d="M1000,1000 L1005,2000 L995,2000 Z" fill="url(#perfect-gradient)" opacity="0.45" />
              <path d="M1000,1000 L0,1005 L0,995 Z" fill="url(#perfect-gradient)" opacity="0.45" />
              
              {/* Primary diagonal rays - slim and elegant */}
              <path d="M1000,1000 L1990,10 L2000,20 Z" fill="url(#perfect-gradient)" opacity="0.35" />
              <path d="M1000,1000 L1990,1990 L1980,2000 Z" fill="url(#perfect-gradient)" opacity="0.35" />
              <path d="M1000,1000 L10,1990 L20,1980 Z" fill="url(#perfect-gradient)" opacity="0.35" />
              <path d="M1000,1000 L10,10 L20,20 Z" fill="url(#perfect-gradient)" opacity="0.35" />
            </g>
          </svg>
          
          {/* Secondary ray system with animation - optimized */}
          <svg className="rays-secondary" viewBox="0 0 2000 2000" preserveAspectRatio="xMidYMid slice">
            <g mask="url(#center-mask)" opacity="0.3">
              {/* Secondary intermediate rays - reduced for performance */}
              <path d="M1000,1000 L1700,100 L1750,130 Z" fill="url(#ray-fade)" />
              <path d="M1000,1000 L1900,1300 L1870,1250 Z" fill="url(#ray-fade)" />
              <path d="M1000,1000 L1300,1900 L1250,1870 Z" fill="url(#ray-fade)" />
              <path d="M1000,1000 L100,1700 L130,1750 Z" fill="url(#ray-fade)" />
              <path d="M1000,1000 L100,700 L130,750 Z" fill="url(#ray-fade)" />
              <path d="M1000,1000 L700,100 L750,130 Z" fill="url(#ray-fade)" />
            </g>
          </svg>
          
          {/* Center corona effect */}
          <div className="rays-corona" />
          
          {/* Pulse rings */}
          <div className="pulse-ring-1" />
          <div className="pulse-ring-2" />
        </div>

      </div>

      {/* Main content */}
      <div className="splash-content">
        {/* Golden badge with logo image */}
        <div className="golden-badge-container">
          <img 
            src={aiqxLogo} 
            alt="EIX" 
            className="aiqx-logo"
            loading="eager"
            decoding="sync"
            style={{ opacity: 1 }}
          />
        </div>

        {/* Foundation text */}
        <div className="foundation-text">
          <div className="foundation-main">ETHICX</div>
          <div className="foundation-subtitle">
            <span>MULTI</span>
            <span className="bullet">•</span>
            <span>CHAIN</span>
            <span className="bullet">•</span>
            <span>TOOLS</span>
          </div>
        </div>
      </div>

      {/* Loading indicator with CSS-based progress */}
      <div className="loading-indicator">
        <div className="progress-container">
          <svg className="svg-progress-ring progress-ring" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#DAA520', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#DAA520', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="85"
              className="progress-track"
            />
            <circle
              cx="100"
              cy="100"
              r="85"
              className="progress-fill progress-animation"
              stroke="#DAA520"
              strokeWidth="3"
              fill="none"
              style={{
                strokeDasharray: '534.07 534.07',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
              }}
            />
          </svg>
          <div className="progress-percentage">
            <span className="progress-number"></span>
          </div>
        </div>
        <div className="loading-dots">
          <span className="dot">.</span>
          <span className="dot">.</span>
          <span className="dot">.</span>
        </div>
      </div>

    </div>
  );
});

PremiumSplashScreen.displayName = 'PremiumSplashScreen';

export default PremiumSplashScreen;