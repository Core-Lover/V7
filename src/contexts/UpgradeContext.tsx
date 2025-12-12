import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface UpgradeContextType {
  upgradeLevel: number;
  timerSeconds: number;
  currentHours: number;
  nextHours: number | null;
  canUpgrade: boolean;
  miningRate: number;
  nextRate: number | null;
  upgradeCost: number | null;
  upgrade: () => Promise<{ success: boolean; message: string }>;
  reset: () => void;
  refreshFromServer: () => Promise<void>;
}

const UpgradeContext = createContext<UpgradeContextType | undefined>(undefined);

const TIMER_TIERS = [
  { hours: 3, seconds: 10800, rate: 0.01 },
  { hours: 6, seconds: 21600, rate: 0.03 },
  { hours: 12, seconds: 43200, rate: 0.05 },
  { hours: 24, seconds: 86400, rate: 0.1 },
];

const UPGRADE_COSTS = [null, 6.60, 8.40, 10.00];

export const UpgradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUpgradeLevel, updateBalance } = useAuth();
  const [upgradeLevel, setUpgradeLevel] = useState<number>(0);

  useEffect(() => {
    if (user) {
      setUpgradeLevel(user.upgrade_level);
    }
  }, [user]);

  const refreshFromServer = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}`);
      const data = await response.json();
      if (data.success && data.user) {
        setUpgradeLevel(data.user.upgrade_level);
        updateUpgradeLevel(data.user.upgrade_level);
        updateBalance(data.user.balance);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [user, updateUpgradeLevel, updateBalance]);

  const upgrade = async (): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    if (upgradeLevel >= TIMER_TIERS.length - 1) {
      return { success: false, message: 'Already at maximum level' };
    }

    try {
      const response = await fetch('/api/mining/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUpgradeLevel(data.newLevel);
        updateUpgradeLevel(data.newLevel);
        await refreshFromServer();
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.message || 'Upgrade failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Upgrade failed' };
    }
  };

  const reset = () => {
    setUpgradeLevel(0);
  };

  const currentTier = TIMER_TIERS[upgradeLevel] || TIMER_TIERS[0];
  const nextTier = upgradeLevel < TIMER_TIERS.length - 1 ? TIMER_TIERS[upgradeLevel + 1] : null;
  
  const timerSeconds = currentTier.seconds;
  const currentHours = currentTier.hours;
  const nextHours = nextTier?.hours || null;
  const canUpgrade = upgradeLevel < TIMER_TIERS.length - 1;
  const miningRate = currentTier.rate;
  const nextRate = nextTier?.rate || null;
  const upgradeCost = canUpgrade ? UPGRADE_COSTS[upgradeLevel + 1] : null;

  return (
    <UpgradeContext.Provider value={{ 
      upgradeLevel,
      timerSeconds, 
      currentHours,
      nextHours,
      canUpgrade,
      miningRate,
      nextRate,
      upgradeCost,
      upgrade, 
      reset,
      refreshFromServer
    }}>
      {children}
    </UpgradeContext.Provider>
  );
};

export const useUpgrade = () => {
  const context = useContext(UpgradeContext);
  if (context === undefined) {
    throw new Error('useUpgrade must be used within an UpgradeProvider');
  }
  
  const isUpgraded = context.upgradeLevel > 0;
  
  return {
    ...context,
    isUpgraded
  };
};
