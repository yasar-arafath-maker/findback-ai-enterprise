import { useEffect, useState } from 'react';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';

/**
 * Mask a verification code for display.
 * Admins see the full code; regular users see only the last 2 characters.
 */
function maskVerificationCode(code, isAdmin) {
  if (!code) return '—';
  if (isAdmin) return code;
  const visible = code.slice(-2);
  return '••••' + visible;
}

export default function HandoverStatus() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!user) return;
    // RLS already scopes reads to involved parties + admins.
    // Filter client-side by the current user's involvement for safety.
    (async () => {
      const all = await db.entities.Handovers.filter({}, '-created_date', 20).catch(() => []);
      const mine = all.filter(
        h =>
          h.lost_owner_id === user.id ||
          h.found_reporter_id === user.id ||
          user.role === 'admin'
      );
      setItems(mine);
    })();
  }, [user]);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="mx-auto max-w-4xl p-5 sm:p-8">
      <PageHeader
        eyebrow="Secure recovery"
        title="Handover status"
        description="Only approved parties and administrators can view these coordination details."
      />

      {!items ? (
        <p className="text-sm text-slate-500">Loading handovers…</p>
      ) : items.length ? (
        items.map(h => (
          <div key={h.id} className="mb-4 rounded-2xl border bg-white p-6">
            <div className="flex justify-between">
              <h2 className="font-bold">Supervised handover</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                {h.status.replaceAll('_', ' ')}
              </span>
            </div>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Scheduled location</dt>
                <dd className="mt-1 font-semibold">{h.scheduled_location}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Scheduled date</dt>
                <dd className="mt-1 font-semibold">
                  {new Date(h.scheduled_datetime).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Verification code</dt>
                <dd className="mt-1 font-mono text-xl font-bold tracking-widest">
                  {maskVerificationCode(h.verification_code, isAdmin)}
                </dd>
                {!isAdmin && h.verification_code && (
                  <p className="mt-1 text-xs text-slate-400">
                    Full code available only to the supervising admin.
                  </p>
                )}
              </div>
              <div>
                <dt className="text-slate-500">Next step</dt>
                <dd className="mt-1 font-semibold">
                  Bring the item and verify in person with admin supervision.
                </dd>
              </div>
            </dl>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border bg-white py-20 text-center text-sm text-slate-500">
          No handover has been scheduled.
        </div>
      )}
    </div>
  );
}