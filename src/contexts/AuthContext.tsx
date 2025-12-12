import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  username: string;
  referral_code: string;
  referred_by: string | null;
  balance: number;
  wallet_address: string;
  upgrade_level: number;
  is_verified: number;
  verified_at: string | null;
  eth_wallet_address: string | null;
  uid: string | null;
  created_at: string;
  last_login_at: string | null;
  referral_count?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signup: (username: string, referralCode?: string, pin?: string) => Promise<{ success: boolean; message: string; privateKey?: string; user?: any }>;
  login: (privateKey: string) => Promise<{ success: boolean; message: string; isAdmin?: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  updateUpgradeLevel: (newLevel: number) => void;
  finalizeSignup: (user: User, privateKey: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'eix_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Added isAuthenticated state

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      const { userId } = JSON.parse(stored);
      const response = await fetch(`/api/user/${userId}`);
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true); // Set isAuthenticated to true if user data is found
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setIsAuthenticated(false); // Set isAuthenticated to false if user data is not found
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setIsAuthenticated(false); // Set isAuthenticated to false on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signup = async (username: string, referralCode?: string, pin?: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, referralCode, pin }),
      });

      const data = await response.json();

      if (data.success && data.user && data.privateKey) {
        return { success: true, message: data.message, privateKey: data.privateKey, user: data.user };
      }

      return { success: false, message: data.message || 'Signup failed' };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, message: error.message || 'Signup failed' };
    }
  };

  const login = async (privateKey: string) => {
    setIsLoading(true);
    try {
      // Check if this is the admin access key
      const adminKeyResponse = await fetch('/admin-config.txt');
      const adminKeyText = await adminKeyResponse.text();
      const adminKey = adminKeyText.split('=')[1]?.trim();

      if (privateKey === adminKey) {
        // Admin login
        setUser({
          id: 'admin',
          username: 'Administrator',
          is_verified: 1,
          balance: 0,
          referral_code: 'ADMIN',
          upgrade_level: 3
        } as any);
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userId', 'admin');
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('privateKey', privateKey);
        return { success: true, isAdmin: true };
      }

      // Regular user login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey })
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('privateKey', privateKey);
        localStorage.removeItem('isAdmin');
        return { success: true, isAdmin: false };
      }

      return { success: false, message: data.message || 'Invalid credentials' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false); // Set isAuthenticated to false on logout
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('isAdmin'); // Remove admin flag on logout
  };

  const finalizeSignup = (user: User, _privateKey: string) => {
    setUser(user);
    setIsAuthenticated(true); // Set isAuthenticated to true after finalizing signup
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      userId: user.id
    }));
  };

  const updateBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance });
    }
  };

  const updateUpgradeLevel = (newLevel: number) => {
    if (user) {
      setUser({ ...user, upgrade_level: newLevel });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated, // Use the state variable here
      isLoading,
      signup,
      login,
      logout,
      refreshUser,
      updateBalance,
      updateUpgradeLevel,
      finalizeSignup
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};