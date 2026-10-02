import { useEffect, useState } from 'react';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import { Bell } from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const [notes, setNotes] = useState(null);

  const load = async () => {
    try {
      const u = user || (await db.auth.me().catch(() => null)) || { id: 'guest-user' };
      const userId = u?.id || 'guest-user';
      let userNotes = await db.entities.Notifications.filter({ user_id: userId }, '-created_date', 50).catch(() => []);
      
      // Fallback: if user has no specific notifications yet, fetch general notifications
      if (!userNotes.length) {
        userNotes = await db.entities.Notifications.filter({}, '-created_date', 20).catch(() => []);
      }
      
      setNotes(userNotes);
    } catch {
      setNotes([]);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const read = async n => {
    if (!n.is_read) {
      try {
        await db.entities.Notifications.update(n.id, { is_read: true });
        load();
      } catch (err) {
        console.warn('Notification update failed:', err);
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-5 sm:p-8 animate-fade-in-up">
      <PageHeader
        eyebrow="Updates & Alerts"
        title="Notifications"
        description="Important match, claim, and handover security activity appears here."
      />
      {!notes ? (
        <div className="p-8 text-sm text-slate-500 animate-pulse">Loading notifications…</div>
      ) : notes.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {notes.map(n => (
            <button
              key={n.id}
              onClick={() => read(n)}
              className={`block w-full border-b border-slate-100 p-5 text-left transition-colors last:border-0 hover:bg-slate-50 ${
                n.is_read ? 'bg-white' : 'bg-blue-50/60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className={`mt-0.5 p-2 rounded-xl ${n.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">{n.message}</p>
                  </div>
                </div>
                {!n.is_read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 animate-pulse" />}
              </div>
              <p className="mt-3 text-xs text-slate-400 font-mono">
                {n.created_date ? new Date(n.created_date).toLocaleString() : 'Just now'}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white py-20 text-center text-sm text-slate-500 shadow-sm">
          <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          No notifications yet. You're all caught up.
        </div>
      )}
    </div>
  );
}