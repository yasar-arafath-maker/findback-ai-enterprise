import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [actionBusy, setActionBusy] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }
  const [actionFilter, setActionFilter] = useState('all');

  const USERS_PER_PAGE = 5;

  const loadData = async () => {
    try {
      const [lost, found, matches, claims, actions, userList] = await Promise.all([
        db.entities.LostReports.list('-created_date', 100),
        db.entities.FoundReports.list('-created_date', 100),
        db.entities.AIMatches.list('-created_date', 100),
        db.entities.Claims.list('-created_date', 100),
        db.entities.AdminActions.list('-created_date', 50),
        db.entities.User ? db.entities.User.list('-created_date', 100).catch(() => []) : Promise.resolve([]),
      ]);
      setData({ lost, found, matches, claims, actions });
      setUsers(userList || []);
    } catch (e) {
      console.error('Failed to load admin dashboard data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUserStatusToggle = async (targetUser) => {
    const isSuspended = targetUser.account_status === 'suspended';
    const action = isSuspended ? 'activate_user' : 'suspend_user';
    const actionName = isSuspended ? 'Activate' : 'Suspend';

    if (!confirm(`Are you sure you want to ${actionName.toLowerCase()} account for ${targetUser.email || targetUser.id}?`)) {
      return;
    }

    setActionBusy(targetUser.id);
    setFeedback(null);

    try {
      if (typeof db.functions?.invoke === 'function') {
        await db.functions.invoke('adminControl', {
          action,
          userId: targetUser.id,
          notes: `Account ${actionName.toLowerCase()}d via Admin Dashboard`,
        });
      } else {
        // Fallback RLS admin update if functions not present
        await db.entities.User.update(targetUser.id, {
          account_status: isSuspended ? 'active' : 'suspended',
        });
        await db.entities.AdminActions.create({
          admin_id: 'admin',
          action_type: 'user_suspended',
          target_entity_type: 'User',
          target_entity_id: targetUser.id,
          notes: `Account status updated to ${isSuspended ? 'active' : 'suspended'}`,
        });
      }

      setFeedback({
        type: 'success',
        text: `User ${targetUser.email || targetUser.id} successfully ${isSuspended ? 'activated' : 'suspended'}.`,
      });
      loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Operation failed.',
      });
    } finally {
      setActionBusy('');
    }
  };

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8 text-sm text-slate-500">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin text-blue-600" />
        Loading administrative workspace…
      </div>
    );
  }

  const recoveredCount = data.claims.filter((c) => c.status === 'completed').length;
  const recoveryRate = data.lost.length ? Math.round((recoveredCount / data.lost.length) * 100) : 0;
  const pendingClaimsCount = data.claims.filter((c) => ['submitted', 'under_review', 'evidence_requested'].includes(c.status)).length;

  // Filtered users pagination
  const filteredUsers = users.filter(
    (u) =>
      (u.email || '').toLowerCase().includes(userQuery.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(userQuery.toLowerCase())
  );
  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;
  const displayedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  // Filtered admin actions
  const filteredActions = actionFilter === 'all'
    ? data.actions
    : data.actions.filter((a) => a.action_type === actionFilter);

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader
        eyebrow="Admin control center"
        title="Recovery & Enterprise Operations"
        description="Monitor system analytics, govern user access, and oversee immutable audit trails."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/reports"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Report Management
            </Link>
            <Link
              to="/admin/claims"
              className="rounded-xl bg-[#0F1F3D] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a2f5a]"
            >
              Review Claims ({pendingClaimsCount})
            </Link>
            <Link
              to="/admin/handovers"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Handover Queue
            </Link>
          </div>
        }
      />

      {/* ── Feedback Banner / Modal ───────────────────────────────── */}
      {feedback && (
        <div
          className={`mb-6 flex items-center justify-between rounded-xl p-4 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold uppercase opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Enterprise Analytics Cards ────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          [data.lost.length, 'Total Lost Reports', FileText, 'text-blue-600'],
          [data.found.length, 'Total Found Reports', FileText, 'text-emerald-600'],
          [data.matches.length, 'AI Matches', RefreshCw, 'text-violet-600'],
          [pendingClaimsCount, 'Pending Claims', Clock, 'text-amber-600'],
          [recoveredCount, 'Recovered Items', CheckCircle, 'text-green-600'],
          [`${recoveryRate}%`, 'Recovery Rate', ShieldCheck, 'text-indigo-600'],
        ].map(([val, label, Icon, colorClass]) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <Icon className={`h-5 w-5 ${colorClass}`} />
            <strong className="mt-4 block text-3xl font-extrabold text-[#0F1F3D]">{val}</strong>
            <span className="mt-1 block text-xs font-medium text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Cross-Device Live Server Sync Control Panel ───────────────── */}
      <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white uppercase flex items-center gap-2">
                ZEXO Native SSE Server Engine (0.0.0.0:5000)
              </h3>
              <p className="text-xs text-slate-300">
                Live JSON persistence storage (<code className="text-emerald-300 font-mono">local_db.json</code>) with Server-Sent Events (SSE) live sync stream.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="rounded-lg bg-white/10 px-3 py-1.5 border border-white/10 text-emerald-300 font-semibold">
              ● Server Online
            </span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5 border border-white/10 text-cyan-300 font-semibold">
              Multi-Device Live Sync
            </span>
          </div>
        </div>
      </div>

      {/* ── Middle Section: User Governance & Action Log ──────────── */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* User Governance & Account Controls */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-[#0F1F3D] flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Governance & Access
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={userQuery}
                onChange={(e) => {
                  setUserQuery(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search user email or ID..."
                className="h-9 w-full sm:w-56 pl-9 text-xs"
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-3">User / ID</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedUsers.length ? (
                  displayedUsers.map((u) => {
                    const isSuspended = u.account_status === 'suspended';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-medium">
                          <div>{u.email || u.id}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{u.id}</span>
                        </td>
                        <td className="p-3 capitalize font-semibold">{u.role || 'user'}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              isSuspended
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}
                          >
                            {isSuspended ? (
                              <ShieldAlert className="h-3 w-3" />
                            ) : (
                              <ShieldCheck className="h-3 w-3" />
                            )}
                            {u.account_status || 'active'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {u.role === 'admin' ? (
                            <span className="text-[10px] text-slate-400 italic">Protected</span>
                          ) : (
                            <Button
                              size="sm"
                              variant={isSuspended ? 'outline' : 'destructive'}
                              onClick={() => handleUserStatusToggle(u)}
                              disabled={actionBusy === u.id}
                              className="h-7 text-[11px] px-2"
                            >
                              {actionBusy === u.id
                                ? 'Saving...'
                                : isSuspended
                                ? 'Activate'
                                : 'Suspend'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* User Pagination */}
          {totalUserPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {userPage} of {totalUserPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={userPage <= 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={userPage >= totalUserPages}
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  className="h-7 px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Append-Only Admin Audit Log */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F1F3D] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Immutable Audit Trail
              </h2>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white text-xs px-2 text-slate-700"
              >
                <option value="all">All Actions</option>
                <option value="user_suspended">User Suspension</option>
                <option value="report_flagged">Report Flagged</option>
                <option value="duplicate_merged">Duplicate Merged</option>
                <option value="claim_approved">Claim Approved</option>
                <option value="claim_rejected">Claim Rejected</option>
                <option value="handover_managed">Handover Managed</option>
              </select>
            </div>

            <div className="mt-4 space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {filteredActions.length ? (
                filteredActions.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-slate-800">
                        {(a.action_type || '').replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {a.created_date ? new Date(a.created_date).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    <div className="mt-1 text-slate-600">
                      Target: <span className="font-mono">{a.target_entity_type || 'Entity'} #{a.target_entity_id || 'ID'}</span>
                    </div>
                    {a.notes && (
                      <p className="mt-1 text-slate-500 italic">"{a.notes}"</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-12 text-center text-xs text-slate-400">
                  No administrative actions recorded in audit log.
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 border-t pt-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Append-only trail (RLS protected)</span>
            <span>Total actions: {data.actions.length}</span>
          </div>
        </section>
      </div>
    </div>
  );
}