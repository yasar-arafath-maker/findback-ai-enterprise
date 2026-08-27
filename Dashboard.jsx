import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

import { Search, PlusCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const activeUser = user || (await db.auth.me().catch(() => null)) || { id: 'guest-user', full_name: 'Guest User' };
      const userId = activeUser?.id || 'guest-user';
      try {
        // Fetch reports belonging to the current user
        const [lost, found, notes] = await Promise.all([
          db.entities.LostReports.filter({ reporter_id: userId }, '-created_date', 6).catch(() => []),
          db.entities.FoundReports.filter({ finder_id: userId }, '-created_date', 6).catch(() => []),
          db.entities.Notifications.filter({ user_id: userId, is_read: false }, '-created_date', 5).catch(() => []),
        ]);

        // Concurrent parallel batch fetch for matches
        const reportIds = [...(lost || []).map(r => r.id), ...(found || []).map(r => r.id)].slice(0, 5);
        const matchPromises = reportIds.flatMap(reportId => [
          db.entities.AIMatches.filter({ lost_report_id: reportId }, '-created_date', 5).catch(() => []),
          db.entities.AIMatches.filter({ found_report_id: reportId }, '-created_date', 5).catch(() => []),
        ]);
        const matchResults = await Promise.all(matchPromises);
        let matches = matchResults.flat();
        // Deduplicate
        const seen = new Set();
        matches = matches.filter(m => {
          if (!m?.id || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        setData({ u: activeUser, lost: lost || [], found: found || [], matches: matches || [], notes: notes || [] });
      } catch (err) {
        setData({ u: activeUser, lost: [], found: [], matches: [], notes: [] });
      }
    })();
  }, [user]);

  if (!data) {
    return <div className="p-6 text-sm text-slate-500">Loading your recovery workspace…</div>;
  }

  const recovered = data.lost.filter(x => x.status === 'closed').length;
  const stats = [
    [data.lost.length, 'Total Lost', Search],
    [data.found.length, 'Total Found', PlusCircle],
    [data.matches.length, 'Potential Matches', Sparkles],
    [recovered, 'Recovered Items', CheckCircle2],
  ];

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader
        eyebrow="Recovery workspace"
        title={`Welcome back${data.u.full_name ? `, ${data.u.full_name.split(' ')[0]}` : ''}`}
        description="Track reports, review AI suggestions, and move verified claims toward a safe handover."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([v, l, I]) => (
          <div key={l} className="rounded-2xl border bg-white p-5 shadow-sm">
            <I className="h-5 w-5 text-blue-600" />
            <strong className="mt-5 block text-3xl text-[#0F1F3D]">{v}</strong>
            <span className="text-sm text-slate-500">{l}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="font-bold">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link className="rounded-xl bg-blue-600 p-4 font-semibold text-white" to="/report/lost">
              Report Lost
            </Link>
            <Link className="rounded-xl border p-4 font-semibold" to="/report/found">
              Report Found
            </Link>
            <Link className="rounded-xl border p-4 font-semibold text-violet-700" to="/matches">
              View Matches
            </Link>
          </div>

          <h2 className="mt-8 font-bold">Recent reports</h2>
          <div className="mt-3 space-y-2">
            {[...data.lost, ...data.found].slice(0, 4).map(r => (
              <div key={r.id} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm">
                <span className="font-medium">{r.title}</span>
                <span className="capitalize text-slate-500">{r.status.replace('_', ' ')}</span>
              </div>
            ))}
            {!data.lost.length && !data.found.length && (
              <p className="py-8 text-center text-sm text-slate-500">
                Your lost and found reports will appear here.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6">
          <div className="flex justify-between">
            <h2 className="font-bold">Unread notifications</h2>
            <span className="rounded-full bg-blue-50 px-2 text-sm text-blue-700">
              {data.notes.length}
            </span>
          </div>
          {data.notes.map(n => (
            <div key={n.id} className="mt-4 border-l-2 border-blue-600 pl-3">
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{n.message}</p>
            </div>
          ))}
          {!data.notes.length && (
            <p className="py-12 text-center text-sm text-slate-500">You're all caught up.</p>
          )}
        </section>
      </div>
    </div>
  );
}