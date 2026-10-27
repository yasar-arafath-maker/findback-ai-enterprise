import { NavLink, Outlet, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { 
  LayoutDashboard, Search, PlusCircle, Bell, User, ShieldCheck, 
  LogOut, QrCode, MessageSquare, Award, CheckCircle2, Users, Activity 
} from 'lucide-react';
import Brand from '@/components/Brand';

const userLinks = [
  ['/dashboard', 'Overview', LayoutDashboard],
  ['/report/lost', 'Report Lost', PlusCircle],
  ['/reports', 'My Reports', Search],
  ['/matches', 'AI Matches', ShieldCheck],
  ['/smart-tag', 'Smart QR Tag', QrCode],
  ['/safe-chat', 'Safe Chat', MessageSquare],
  ['/authority-handover', 'Police Receipt', Award],
  ['/notifications', 'Alerts', Bell],
  ['/profile', 'My Profile', User],
];

const adminLinks = [
  ['/admin', 'Admin Overview', LayoutDashboard],
  ['/admin/claims', 'Claim Review Queue', CheckCircle2],
  ['/admin/handovers', 'Supervised Handovers', ShieldCheck],
  ['/admin/reports', 'All Reports Audit', Search],
  ['/enterprise-admin', 'Enterprise Governance', Users],
  ['/admin/telemetry', 'System Telemetry', Activity],
];

export default function AppShell() {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    (async () => {
      const u = authUser || (await db.auth.me().catch(() => null)) || { role: 'user' };
      setUser(u);
    })();
  }, [authUser]);

  // Poll for unread notifications for the current user
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const u = authUser || (await db.auth.me().catch(() => null));
        if (u) {
          const list = await db.entities.Notifications.filter({ user_id: u.id, is_read: false }).catch(() => []);
          setUnreadCount(list?.length || 0);
        }
      } catch {}
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 4000);
    return () => clearInterval(timer);
  }, [authUser]);

  const isAdmin = user?.role === 'admin';
  const activeLinks = isAdmin ? adminLinks : userLinks;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-[#0F1F3D] p-5 md:flex shadow-xl">
        <Brand light />

        <div className="mt-6 mb-2 px-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isAdmin ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
          }`}>
            {isAdmin ? '🛡️ Admin Workspace' : '👤 User Workspace'}
          </span>
        </div>

        <nav className="mt-2 space-y-1">
          {activeLinks.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? isAdmin
                      ? 'bg-amber-500/20 text-amber-200 border-l-4 border-amber-400 font-semibold shadow-inner'
                      : 'bg-blue-600/30 text-white border-l-4 border-blue-500 font-semibold shadow-inner'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              {label === 'Alerts' && unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Role Card */}
        <div className="mt-auto mb-3 p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              user?.role === 'admin' 
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
            }`}>
              {user?.role === 'admin' ? 'A' : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || user?.email || 'User'}</p>
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                user?.role === 'admin' ? 'bg-amber-400/20 text-amber-300' : 'bg-blue-400/20 text-blue-300'
              }`}>
                {user?.role === 'admin' ? '🛡️ Admin Supervisor' : '👤 Normal User'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => (logout ? logout() : db.auth.logout('/'))}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </aside>

      <main className="pb-20 md:ml-64 md:pb-0">
        {/* Mobile Top Header with Exit/Logout Button */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-[#0F1F3D] px-4 py-3 md:hidden shadow-md">
          <button
            onClick={() => (logout ? logout() : db.auth.logout('/'))}
            className="flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30 transition-all active:scale-95 shadow-sm"
            title="Exit Application / Log Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Exit / Log Out</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-200 truncate max-w-[130px]">
              {user?.full_name || user?.email?.split('@')[0] || 'ZEXO Mobile'}
            </span>
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[11px] font-black text-white shadow-sm border border-cyan-400/30">
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>

        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md p-2 md:hidden shadow-lg">
        {activeLinks.slice(0, 5).map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-14 flex-col items-center gap-1 p-1 text-[10px] font-semibold ${
                isActive ? 'text-blue-600 scale-105' : 'text-slate-500'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}