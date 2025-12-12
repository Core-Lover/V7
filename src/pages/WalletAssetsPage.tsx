import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './WalletAssets.css';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  change24h: number;
  logo: string;
  color: string;
  network: string;
}

const WalletAssetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAssets();
  }, [user?.balance]);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const mockAssets: Asset[] = [
        {
          id: 'eix',
          symbol: 'EIX',
          name: 'EthicX',
          balance: user?.balance || 0,
          usdValue: 0,
          change24h: 0,
          logo: '/eix-balance-grid.png',
          color: '#FF7A1A',
          network: 'EthicX'
        },
        {
          id: 'btc',
          symbol: 'BTC',
          name: 'Bitcoin',
          balance: 0.00004489,
          usdValue: 4.28,
          change24h: 2.34,
          logo: '/logos/bitcoin.png',
          color: '#F7931A',
          network: 'Bitcoin'
        },
        {
          id: 'eth',
          symbol: 'ETH',
          name: 'Ethereum',
          balance: 0,
          usdValue: 0,
          change24h: -1.12,
          logo: '/logos/ethereum.png',
          color: '#627EEA',
          network: 'Ethereum'
        },
        {
          id: 'bnb',
          symbol: 'BNB',
          name: 'Binance Coin',
          balance: 0,
          usdValue: 0,
          change24h: 1.56,
          logo: '/logos/bnb.png',
          color: '#F3BA2F',
          network: 'Binance'
        },
        {
          id: 'sol',
          symbol: 'SOL',
          name: 'Solana',
          balance: 0,
          usdValue: 0,
          change24h: 3.45,
          logo: '/logos/solana.png',
          color: '#9945FF',
          network: 'Solana'
        }
      ];
      setAssets(mockAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (value: number, decimals: number = 6) => {
    if (value === 0) return '0.00';
    if (value >= 1000000) return (value / 1000000).toFixed(2) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(2) + 'K';
    return value.toFixed(decimals);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 400, damping: 28 }
    }
  } as const;

  return (
    <div className="wallet-assets-page">
      <div className="wallet-assets-header">
        <button className="header-back-btn" onClick={() => navigate('/app')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="header-title">Assets</h1>
        <button 
          className="header-refresh-btn" 
          onClick={loadAssets} 
          disabled={isLoading}
        >
          <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      <div className="wallet-assets-body">
        {assets.length > 0 && (
          <motion.div
            className="eix-hero-card"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => navigate(`/wallet/asset/${assets[0].id}`, { state: { asset: { ...assets[0], available: assets[0].balance, frozen: 0, icon: 'Ξ' } } })}
            style={{ cursor: 'pointer' }}
          >
            <div className="eix-left">
              <div className="eix-logo-wrapper">
                {assets[0].logo ? (
                  <img src={assets[0].logo} alt="EIX" className="eix-logo-img" style={{ width: '100%', height: '100%' }} />
                ) : (
                  <div className="eix-logo-fallback">
                    <span>{assets[0].symbol}</span>
                  </div>
                )}
              </div>
              <div className="eix-info">
                <span className="eix-symbol">{assets[0].symbol}</span>
                <span className="eix-name">{assets[0].name}</span>
              </div>
            </div>
            <div className="eix-right">
              <div className="eix-balance-display">
                <span className="eix-amount">{formatBalance(assets[0].balance, 6)}</span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          className="assets-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {assets.slice(1).map((asset) => (
            <motion.div
              key={asset.id}
              className="asset-row"
              variants={itemVariants}
              onClick={() => navigate(`/wallet/asset/${asset.id}`, { state: { asset } })}
            >
              <div className="asset-left">
                <div className="asset-logo-wrapper">
                  {asset.logo ? (
                    <img src={asset.logo} alt={asset.symbol} className="asset-logo-img" />
                  ) : (
                    <div 
                      className="asset-logo-fallback"
                      style={{ background: `linear-gradient(135deg, ${asset.color} 0%, ${asset.color}dd 100%)` }}
                    >
                      <span className="asset-logo-letter">{asset.symbol.charAt(0)}</span>
                    </div>
                  )}
                  <div className="asset-logo-glow" style={{ background: asset.color }} />
                </div>
                <div className="asset-info">
                  <span className="asset-symbol">{asset.symbol}</span>
                  <span className="asset-fullname">{asset.name}</span>
                </div>
              </div>
              <div className="asset-right">
                <div className="asset-balance-row">
                  <span className="asset-balance">{formatBalance(asset.balance, 8)}</span>
                </div>
                <div className="asset-value-row">
                  <span className="asset-usd">${asset.usdValue.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default WalletAssetsPage;
