import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import PageNotFound from './PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { RenderBootProvider } from './RenderBootContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminGuard from '@/components/AdminGuard';
import AppShell from '@/components/AppShell';
import Landing from '@/pages/Landing';
import SplashScreen from './SplashScreen';
import Onboarding from './Onboarding';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import ReportWizard from '@/pages/ReportWizard';
import MyReports from '@/pages/MyReports';
import Matches from '@/pages/Matches';
import MatchDetails from '@/pages/MatchDetails';
import ClaimItem from '@/pages/ClaimItem';
import EvidenceStatus from '@/pages/EvidenceStatus';
import Notifications from '@/pages/Notifications';
import HandoverStatus from '@/pages/HandoverStatus';
import Profile from '@/pages/Profile';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminReports from '@/pages/AdminReports';
import AdminClaims from '@/pages/AdminClaims';
import AdminHandovers from '@/pages/AdminHandovers';
import EnterpriseTelemetryViewer from './EnterpriseTelemetryViewer';
import EnterpriseAdminDashboard from './EnterpriseAdminDashboard';
import SmartTagGenerator from './SmartTagGenerator';
import SafeChatWindow from './SafeChatWindow';
import DigitalHandoverCertificate from './DigitalHandoverCertificate';

const AppBackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle;
    const registerListener = async () => {
      listenerHandle = await CapApp.addListener('backButton', ({ canGoBack }) => {
        const rootPaths = ['/', '/dashboard', '/login', '/splash', '/onboarding'];
        const isRoot = rootPaths.includes(location.pathname);

        if (isRoot || !canGoBack) {
          CapApp.exitApp();
        } else {
          navigate(-1);
        }
      });
    };

    registerListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate, location.pathname]);

  return null;
};

const LandingWithSplashFlow = () => {
  const [hasSeenSplash, setHasSeenSplash] = useState(() => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('findback_splash_done') === 'true';
    }
    return false;
  });

  if (!hasSeenSplash) {
    return <SplashScreen onComplete={() => setHasSeenSplash(true)} />;
  }

  return <Landing />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-400">Verifying Supabase Session...</span>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<LandingWithSplashFlow />} />
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/enterprise-admin" element={<EnterpriseAdminDashboard />} />
      <Route path="/admin-console" element={<EnterpriseAdminDashboard />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report/:type" element={<ReportWizard />} />
          <Route path="/reports" element={<MyReports />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<MatchDetails />} />
          <Route path="/claim/:matchId" element={<ClaimItem />} />
          <Route path="/evidence/:claimId" element={<EvidenceStatus />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/handover" element={<HandoverStatus />} />
          <Route path="/smart-tag" element={<SmartTagGenerator />} />
          <Route path="/safe-chat" element={<SafeChatWindow />} />
          <Route path="/authority-handover" element={<DigitalHandoverCertificate />} />
          <Route path="/profile" element={<Profile />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/claims" element={<AdminClaims />} />
            <Route path="/admin/handovers" element={<AdminHandovers />} />
            <Route path="/admin/telemetry" element={<EnterpriseTelemetryViewer />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <RenderBootProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AppBackButtonHandler />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </RenderBootProvider>
  );
}

export default App;