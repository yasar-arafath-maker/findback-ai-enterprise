import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminGuard from '@/components/AdminGuard';
import AppShell from '@/components/AppShell';
import Landing from '@/pages/Landing';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
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
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App