import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Eye, EyeOff, ArrowRight, ArrowLeft, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AuthForms.css';

interface AuthFormsProps {
  onSuccess?: () => void;
}

export const AuthForms: React.FC<AuthFormsProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'landing' | 'import' | 'create'>('landing');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [signupUser, setSignupUser] = useState<any>(null);
  
  const { signup, login, finalizeSignup } = useAuth();
  
  const [privateKey, setPrivateKey] = useState('');
  const [signupForm, setSignupForm] = useState({
    username: '',
    referralCode: '',
    pin: ''
  });

  const validatePrivateKey = (key: string): boolean => {
    const trimmedKey = key.trim();
    if (!trimmedKey.startsWith('EIX-')) return false;
    const hexPart = trimmedKey.slice(4);
    // Accept 32-64 hex characters (allows flexibility for admin keys and user keys)
    return /^[0-9A-Fa-f]{32,64}$/.test(hexPart);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const trimmedKey = privateKey.trim();
    
    if (!trimmedKey) {
      setError('Private key is required');
      return;
    }
    
    if (!validatePrivateKey(trimmedKey)) {
      setError('Invalid private key format. Expected: EIX-[32-64 hex characters]');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await login(trimmedKey);
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (signupForm.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (!signupForm.pin || signupForm.pin.length !== 6 || !/^\d{6}$/.test(signupForm.pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signup(
        signupForm.username, 
        signupForm.referralCode || undefined,
        signupForm.pin
      );
      
      if (result.success && result.privateKey) {
        setGeneratedKey(result.privateKey);
        setSignupUser(result.user);
      } else {
        setError(result.message || 'Account creation failed - no private key received');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Account creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPrivateKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContinue = () => {
    if (generatedKey && signupUser) {
      finalizeSignup(signupUser, generatedKey);
    }
    onSuccess?.();
  };

  if (mode === 'landing') {
    return (
      <motion.div 
        className="auth-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <Shield size={24} strokeWidth={1.5} />
            </div>
            <h1 className="auth-title">EIX Account</h1>
            <p className="auth-subtitle">Choose how to access your account</p>
          </div>

          <div className="landing-buttons">
            <button 
              className="landing-btn import-btn"
              onClick={() => { setMode('import'); setError(null); }}
            >
              <span>Import Account</span>
            </button>
            <button 
              className="landing-btn create-btn"
              onClick={() => { setMode('create'); setError(null); }}
            >
              <span>Create Account</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (generatedKey) {
    return (
      <motion.div 
        className="auth-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="auth-card key-display-card">
          <button 
            type="button"
            className="back-btn"
            onClick={() => { setMode('landing'); setGeneratedKey(null); setKeySaved(false); }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="key-warning-header">
            <div className="warning-icon-large">
              <AlertTriangle size={28} strokeWidth={2} />
            </div>
            <h2 className="key-warning-title">SAVE YOUR PRIVATE KEY</h2>
          </div>

          <div className="key-warning-message">
            <p>
              This key is your <strong>ONLY</strong> way to access your account. 
              We do not store your private key. If you lose it, your account 
              cannot be recovered.
            </p>
          </div>

          <div className="private-key-display">
            <div className="private-key-header">
              <span className="private-key-label">PRIVATE KEY</span>
              <div className="private-key-actions">
                <button 
                  type="button"
                  className="key-action-btn"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  aria-label={showPrivateKey ? 'Hide key' : 'Show key'}
                >
                  {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button 
                  type="button"
                  className="key-action-btn"
                  onClick={copyPrivateKey}
                  aria-label="Copy key"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <div className="private-key-value">
              <code>
                {showPrivateKey ? generatedKey : '\u2022'.repeat(68)}
              </code>
            </div>
            {copied && (
              <div className="copy-confirmation">
                Copied to clipboard
              </div>
            )}
          </div>

          <label className="save-confirmation">
            <input 
              type="checkbox" 
              checked={keySaved}
              onChange={(e) => setKeySaved(e.target.checked)}
            />
            <span className="checkbox-visual"></span>
            <span className="checkbox-text">I have securely saved my private key</span>
          </label>

          <button 
            className="continue-btn"
            onClick={handleContinue}
            disabled={!keySaved}
          >
            <span>Continue</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="auth-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="auth-card">
        <button 
          type="button"
          className="back-btn"
          onClick={() => { setMode('landing'); setPrivateKey(''); setSignupForm({ username: '', referralCode: '', pin: '' }); setError(null); }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <Shield size={24} strokeWidth={1.5} />
          </div>
          <h1 className="auth-title">EIX Account</h1>
          <p className="auth-subtitle">
            {mode === 'import' 
              ? 'Import your account using your private key' 
              : 'Create a new account'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'import' ? (
            <motion.form 
              key="import"
              className="auth-form"
              onSubmit={handleImport}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="form-group">
                <label className="form-label">PRIVATE KEY</label>
                <div className="private-key-input-wrapper">
                  <textarea
                    className="form-textarea"
                    placeholder="Enter your private key"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value.toUpperCase())}
                    rows={3}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                  />
                </div>
                <span className="form-hint">Format: EIX-[64 hex characters]</span>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading || !privateKey.trim()}
              >
                {isLoading ? (
                  <span className="loading-text">Importing...</span>
                ) : (
                  <>
                    <span>Import Account</span>
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="create"
              className="auth-form"
              onSubmit={handleCreate}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="form-group">
                <label className="form-label">USERNAME</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Choose a username"
                  value={signupForm.username}
                  onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                  required
                  minLength={3}
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  REFERRAL CODE <span className="optional-tag">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter referral code"
                  value={signupForm.referralCode}
                  onChange={(e) => setSignupForm({ ...signupForm, referralCode: e.target.value })}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label">PIN</label>
                <div className="pin-input-wrapper">
                  <input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    className="form-input"
                    placeholder="Enter 6-digit PIN"
                    value={signupForm.pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setSignupForm({ ...signupForm, pin: value });
                    }}
                    maxLength={6}
                    pattern="[0-9]*"
                    required
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="pin-toggle-btn"
                    onClick={() => setShowPin(!showPin)}
                    aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span className="form-hint">Must be exactly 6 digits</span>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-text">Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AuthForms;
