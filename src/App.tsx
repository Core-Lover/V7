import { useState, useCallback, memo, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UpgradeProvider } from './contexts/UpgradeContext';
import CompactProfessional from './pages/CompactProfessional';
import AuthForms from './components/AuthForms';
import './App.css';

const SmoothFallback = () => (
  <div style={{ 
    width: '100vw', 
    height: '100vh', 
    background: '#0E1116',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }} />
);

const PremiumSplashScreen = lazy(() => import('./pages/PremiumSplashScreen'));
const AppInterface = lazy(() => import('./components/AppInterface'));
const UpgradeZone = lazy(() => import('./pages/UpgradeZone'));
const Lab = lazy(() => import('./features/lab'));
const MiningPage = lazy(() => import('./pages/MiningPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const WalletAssetsPage = lazy(() => import('./pages/WalletAssetsPage'));
const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const VerificationPage = lazy(() => import('./pages/VerificationPage'));
const ChangePinPage = lazy(() => import('./pages/ChangePinPage'));
const DeleteAccountPage = lazy(() => import('./pages/DeleteAccountPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <SmoothFallback />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AuthRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  if (isAuthenticated) {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    return <Navigate to={isAdmin ? "/admin" : "/app"} replace />;
  }
  
  return <AuthForms onSuccess={() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    navigate(isAdmin ? '/admin' : '/app', { replace: true });
  }} />;
};

const AppContent = memo(() => {
  const [showSplash, setShowSplash] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return (
      <Suspense fallback={null}>
        <PremiumSplashScreen onComplete={handleSplashComplete} />
      </Suspense>
    );
  }

  return (
    <UpgradeProvider>
      <Routes>
        <Route path="/" element={<CompactProfessional />} />
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/app/*" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <AppInterface />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/upgrade" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <UpgradeZone />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/lab/*" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <Lab />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/mining" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <MiningPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/wallet" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <WalletPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/wallet/assets" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <WalletAssetsPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/wallet/asset/:id" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <AssetDetailPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/team" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <TeamPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/verification" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <VerificationPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/change-pin" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <ChangePinPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/delete-account" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <DeleteAccountPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/rewards" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <RewardsPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/privacy" element={
          <Suspense fallback={<SmoothFallback />}>
            <PrivacyPage />
          </Suspense>
        } />
        <Route path="/terms" element={
          <Suspense fallback={<SmoothFallback />}>
            <TermsPage />
          </Suspense>
        } />
        <Route path="/documentation" element={
          <Suspense fallback={<SmoothFallback />}>
            <DocumentationPage />
          </Suspense>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Suspense fallback={<SmoothFallback />}>
              <AdminPanel />
            </Suspense>
          </ProtectedRoute>
        } />
      </Routes>
    </UpgradeProvider>
  );
});

AppContent.displayName = 'AppContent';

const App = memo(() => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
});

App.displayName = 'App';

export default App;
