import { useAuth } from '@/lib/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * AdminGuard — renders child routes only when the AuthContext user has
 * role === 'admin'.  Relies exclusively on the already-resolved session
 * from AuthContext (no independent db.auth.me() call).
 */
export default function AdminGuard() {
  const { user, isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  // Resilience fallback: u?.role==='admin' | .catch(()=>setState('denied')) | 'loading'

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Checking access…
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}