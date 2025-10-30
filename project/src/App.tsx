import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { detectAppInstall, isAppInstalled } from './lib/installDetection';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import RoleSelection from './pages/RoleSelection';
import DashboardRouter from './pages/DashboardRouter';
import { useEffect } from 'react';

function AppContent() {
  const { profile } = useAuth();

  useEffect(() => {
    detectAppInstall(profile?.id);

    if (isAppInstalled()) {
      console.log('Running as installed PWA');
      document.body.classList.add('pwa-installed');
    }
  }, [profile?.id]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/select-role" element={<RoleSelection />} />
      <Route path="/dashboard" element={<DashboardRouter />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
