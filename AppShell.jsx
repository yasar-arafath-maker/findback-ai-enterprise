import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Search, PlusCircle, Bell, User, ShieldCheck, LogOut, QrCode, MessageSquare, Award } from 'lucide-react';
import Brand from '@/components/Brand';

const links = [
  ['/dashboard', 'Overview', LayoutDashboard],
  ['/report/lost', 'Report', PlusCircle],
  ['/reports', 'My reports', Search],
  ['/matches', 'Matches', ShieldCheck],
  ['/smart-tag', 'Smart QR Tag', QrCode],
  ['/safe-chat', 'Safe Chat', MessageSquare],
  ['/authority-handover', 'Police Receipt', Award],
  ['/notifications', 'Alerts', Bell],
  ['/profile', 'Profile', User],
];

export default function AppShell() {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const u = authUser || (await db.auth.me().catch(() => null)) || { role: 'user' };
      setUser(u);
    })();
  }, [authUser]);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-[#0F1F3D] p-5 md:flex shadow-xl">
        <Brand light />
        <nav className="mt-10 space-y-1">
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/30 text-white border-l-4 border-blue-500 font-semibold shadow-inner'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-amber-300 hover:bg-amber-400/10"
            >
              <ShieldCheck className="h-4 w-4" /> Admin Supervisor
            </NavLink>
          )}
        </nav>
        <button
          onClick={() => (logout ? logout() : db.auth.logout('/'))}
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </aside>

      <main className="pb-20 md:ml-64 md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md p-2 md:hidden shadow-lg">
        {links.slice(0, 5).map(([to, label, Icon]) => (
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