import { useEffect, useState } from 'react';
import { db } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Flag,
  GitMerge,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  RefreshCw,
} from 'lucide-react';

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [type, setType] = useState('lost'); // 'lost' | 'found'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'matched' | 'flagged' | 'merged' | 'closed'
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Feedback state
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  // Action Modals State
  const [flagModalReport, setFlagModalReport] = useState(null);
  const [flagReason, setFlagReason] = useState('');

  const [mergeModalReport, setMergeModalReport] = useState(null);
  const [primaryReportId, setPrimaryReportId] = useState('');
  const [mergeNotes, setMergeNotes] = useState('');

  const [busy, setBusy] = useState(false);

  const loadData = async () => {
    try {
      const [lost, found] = await Promise.all([
        db.entities.LostReports.list('-created_date', 100),
        db.entities.FoundReports.list('-created_date', 100),
      ]);
      setData({ lost, found });
    } catch (e) {
      console.error('Failed to load reports:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic
  const rawList = data?.[type] || [];
  const filteredList = rawList.filter((r) => {
    const matchesSearch =
      (r.title || '') +
      ' ' +
      (r.category || '') +
      ' ' +
      (r.location_text || '') +
      ' ' +
      (r.id || '')
        .toLowerCase()
        .includes(q.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE) || 1;
  const paginatedList = filteredList.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Flag report submission
  const handleFlagSubmit = async () => {
    if (!flagModalReport) return;
    setBusy(true);
    setFeedback(null);
    try {
      if (typeof db.functions?.invoke === 'function') {
        await db.functions.invoke('adminControl', {
          action: 'flag_report',
          reportId: flagModalReport.id,
          reportType: type,
          reason: flagReason,
        });
      } else {
        const entityName = type === 'lost' ? 'LostReports' : 'FoundReports';
        await db.entities[entityName].update(flagModalReport.id, {
          status: 'flagged',
        });
        await db.entities.AdminActions.create({
          admin_id: 'admin',
          action_type: 'report_flagged',
          target_entity_type: entityName,
          target_entity_id: flagModalReport.id,
          notes: flagReason || 'Flagged by administrator',
        });
      }

      setFeedback({
        type: 'success',
        text: `Report "${flagModalReport.title}" successfully flagged.`,
      });
      setFlagModalReport(null);
      setFlagReason('');
      loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to flag report.',
      });
    } finally {
      setBusy(false);
    }
  };

  // Merge report submission
  const handleMergeSubmit = async () => {
    if (!mergeModalReport || !primaryReportId) {
      setFeedback({ type: 'error', text: 'Please select a valid primary report ID.' });
      return;
    }
    if (primaryReportId === mergeModalReport.id) {
      setFeedback({ type: 'error', text: 'Cannot merge a report into itself.' });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      if (typeof db.functions?.invoke === 'function') {
        await db.functions.invoke('adminControl', {
          action: 'merge_reports',
          primaryReportId,
          duplicateReportId: mergeModalReport.id,
          reportType: type,
          notes: mergeNotes,
        });
      } else {
        const entityName = type === 'lost' ? 'LostReports' : 'FoundReports';
        await db.entities[entityName].update(mergeModalReport.id, {
          status: 'merged',
          is_duplicate_of: primaryReportId,
        });
        await db.entities.AdminActions.create({
          admin_id: 'admin',
          action_type: 'duplicate_merged',
          target_entity_type: entityName,
          target_entity_id: mergeModalReport.id,
          notes: mergeNotes || `Merged duplicate ${mergeModalReport.id} into ${primaryReportId}`,
        });
      }

      setFeedback({
        type: 'success',
        text: `Report ${mergeModalReport.id} merged into primary report ${primaryReportId} safely.`,
      });
      setMergeModalReport(null);
      setPrimaryReportId('');
      setMergeNotes('');
      loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to merge reports.',
      });
    } finally {
      setBusy(false);
    }
  };

  const candidatePrimaryReports = rawList.filter(
    (r) => r.id !== mergeModalReport?.id && r.status !== 'merged'
  );

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader
        eyebrow="Admin control center"
        title="Report Management & Governance"
        description="Search, flag inappropriate content, and merge duplicate reports with complete audit traceability."
      />

      {/* ── Feedback Notification ─────────────────────────────────── */}
      {feedback && (
        <div
          className={`mb-6 flex items-center justify-between rounded-xl p-4 text-sm font-medium border ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
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

      {/* ── Controls Header: Tabs & Filters ────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Lost vs Found Selector */}
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {['lost', 'found'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setPage(1);
                }}
                className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  type === t
                    ? 'bg-[#0F1F3D] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t} Reports ({data?.[t]?.length || 0})
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="matched">Matched</option>
              <option value="flagged">Flagged</option>
              <option value="merged">Merged</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search title, category, location or ID..."
            className="h-10 pl-9 text-xs"
          />
        </div>
      </div>

      {/* ── Reports Queue Table ────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {!data ? (
          <div className="flex items-center justify-center p-12 text-sm text-slate-400">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading reports…
          </div>
        ) : paginatedList.length ? (
          <div className="divide-y divide-slate-100">
            {paginatedList.map((r) => (
              <div
                key={r.id}
                className="grid gap-3 p-4 text-xs sm:grid-cols-[2fr_1fr_1fr_1.2fr_auto] sm:items-center hover:bg-slate-50/60 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{r.title}</span>
                    {r.is_duplicate_of && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 font-mono">
                        Dup of #{r.is_duplicate_of.slice(-5)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400 font-mono">ID: {r.id}</p>
                </div>

                <div className="text-slate-600 font-medium">{r.category}</div>

                <div className="text-slate-500">
                  {r.lost_date || r.found_date || 'N/A'}
                  <span className="block text-[10px] text-slate-400 truncate max-w-[140px]">
                    {r.location_text}
                  </span>
                </div>

                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      r.status === 'active'
                        ? 'bg-blue-50 text-blue-700'
                        : r.status === 'flagged'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : r.status === 'merged'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : r.status === 'closed'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {r.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFlagModalReport(r);
                      setFlagReason('');
                    }}
                    disabled={r.status === 'flagged'}
                    className="h-8 text-[11px] border-slate-200 hover:border-red-300 hover:text-red-700"
                  >
                    <Flag className="mr-1 h-3 w-3 text-red-500" />
                    Flag
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMergeModalReport(r);
                      setPrimaryReportId('');
                      setMergeNotes('');
                    }}
                    disabled={r.status === 'merged'}
                    className="h-8 text-[11px] border-slate-200 hover:border-blue-300 hover:text-blue-700"
                  >
                    <GitMerge className="mr-1 h-3 w-3 text-blue-600" />
                    Merge
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">
            No {type} reports match your criteria.
          </div>
        )}
      </div>

      {/* ── Pagination Controls ───────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(page * ITEMS_PER_PAGE, filteredList.length)} of{' '}
            {filteredList.length} reports
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
            </Button>
            <span className="font-semibold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3"
            >
              Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── FLAG REPORT MODAL ─────────────────────────────────────── */}
      {flagModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-600" /> Flag Report
              </h3>
              <button
                onClick={() => setFlagModalReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Flagging report "{flagModalReport.title}" (ID: {flagModalReport.id}). Flagged reports are hidden from public matches.
            </p>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Flagging
              </label>
              <Textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Fraudulent content, inappropriate image, spam..."
                className="text-xs"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlagModalReport(null)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleFlagSubmit}
                disabled={busy}
              >
                {busy ? 'Flagging...' : 'Confirm Flag'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MERGE DUPLICATE REPORT MODAL ──────────────────────────── */}
      {mergeModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F1F3D] flex items-center gap-2">
                <GitMerge className="h-5 w-5 text-blue-600" /> Merge Duplicate Report
              </h3>
              <button
                onClick={() => setMergeModalReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Merging duplicate report <strong className="text-slate-800">"{mergeModalReport.title}"</strong>. Associated images and claims will be re-linked to the primary report.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Target Primary Report
                </label>
                <select
                  value={primaryReportId}
                  onChange={(e) => setPrimaryReportId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800"
                >
                  <option value="">-- Choose Primary Report --</option>
                  {candidatePrimaryReports.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (ID: {c.id.slice(-6)}) - {c.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merge Rationale / Notes (optional)
                </label>
                <Textarea
                  value={mergeNotes}
                  onChange={(e) => setMergeNotes(e.target.value)}
                  placeholder="Reason for duplicate merge..."
                  className="text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMergeModalReport(null)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleMergeSubmit}
                disabled={busy || !primaryReportId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {busy ? 'Merging...' : 'Execute Merge'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}