import { motion } from 'framer-motion';
import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pickaxe, Layers } from 'lucide-react';
import './CompactProfessional.css';

const FloatingParticles = memo(() => {
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: i * 0.08,
      duration: 10 + Math.random() * 5,
      left: Math.random() * 100,
    })),
    []
  );

  return (
    <div className="particles-container">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="particle"
          style={{ left: `${p.left}%` }}
          animate={{
            y: ['0%', '100%'],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
});

const PremiumLanding = memo(() => {
  const navigate = useNavigate();

  const handleLaunchApp = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  const features = [
    {
      title: 'For Miners',
      subtitle: 'Mine & Earn',
      description: 'Participate in our intelligent mining network to generate passive income through efficient, community-driven operations.',
      icon: <Pickaxe size={48} />,
    },
    {
      title: 'For Developers',
      subtitle: 'Professional Tools',
      description: 'Access enterprise-grade blockchain operations for Solana and EVM chains. Create, mint, and manage tokens seamlessly.',
      icon: <Layers size={48} />,
    },
  ];

  return (
    <div className="premium-landing">
      <FloatingParticles />

      {/* Hero Section */}
      <motion.section
        className="hero-premium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-container">
          <motion.div
            className="hero-title-label"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0 }}
          >
            EthicX Lab Network
          </motion.div>

          {/* Video Background with Text Overlay */}
          <motion.div
            className="hero-video-overlay-container"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <video 
              className="hero-video-background"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/videos/hero-background.mp4" type="video/mp4" />
            </video>
            
            <motion.h1
              className="hero-headline-overlay"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              The Collective Intelligence Layer<br />
              for Community <span className="accent">Earning</span>
            </motion.h1>
          </motion.div>

          <motion.p
            className="hero-subtext"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Mine EIX, grow your team, and access professional blockchain tools in one unified platform.
          </motion.p>

          <motion.button
            className="btn-launch-app"
            onClick={handleLaunchApp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Launch App
          </motion.button>
        </div>

        {/* Glow Effects */}
        <div className="hero-glow-1"></div>
        <div className="hero-glow-2"></div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="features-premium"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: false, margin: '-100px' }}
      >
        <div className="features-container">
          <h2>Built for Everyone</h2>
          <p className="features-subtitle">Whether you're mining, building a team, or developing on blockchain, EthicX has the tools you need.</p>

          <div className="features-grid">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                className="feature-premium"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: false }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-badge">{feature.subtitle}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="footer-premium"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: false }}
      >
        <div className="footer-container">
          <p>&copy; 2025 EthicX Network. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
});

PremiumLanding.displayName = 'PremiumLanding';

export default PremiumLanding;
