import { useAuth } from '@/lib/AuthContext';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * AdminGuard — renders child routes only when the AuthContext user has
 * role === 'admin'. Explains security boundaries if a normal user attempts entry.
 */
export default function AdminGuard() {
  const { user, isAuthenticated, isLoadingAuth, authChecked, logout } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Checking security clearance…
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login?returnTo=/admin" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-xl p-6 sm:p-12 mt-10">
        <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="inline-block rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1 mb-2">
            RBAC Access Guard
          </span>
          <h2 className="text-2xl font-bold text-slate-900">Admin Privileges Required</h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            You are currently authenticated as a <strong className="text-slate-900">Normal User ({user.email})</strong>. 
            The Claim Review Queue, Evidence Audit, and Supervised Handovers are restricted to authorized <strong className="text-amber-700">Security Administrators</strong>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">
                Back to User Dashboard
              </Button>
            </Link>
            <Link to="/login">
              <Button className="w-full sm:w-auto bg-[#0F1F3D] hover:bg-[#1a2f57] text-white">
                <UserCheck className="mr-2 h-4 w-4" />
                Switch to Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}