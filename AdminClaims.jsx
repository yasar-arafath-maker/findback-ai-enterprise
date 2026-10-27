import { useEffect, useState } from 'react';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/PageHeader';
import {
  CheckCircle2,
  XCircle,
  MessageSquarePlus,
  FileText,
  Loader2,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
} from 'lucide-react';

const STATUS_BADGE = {
  submitted:          'bg-blue-50 text-blue-700',
  under_review:       'bg-amber-50 text-amber-700',
  evidence_requested: 'bg-orange-50 text-orange-700',
  approved:           'bg-green-50 text-green-700',
  rejected:           'bg-red-50 text-red-700',
  handover_scheduled: 'bg-violet-50 text-violet-700',
  completed:          'bg-green-50 text-green-700',
};

export default function AdminClaims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'submitted' | 'evidence_requested' | 'approved' | 'rejected' | 'completed' | 'all'
  const [page, setPage] = useState(1);
  const CLAIMS_PER_PAGE = 7;

  const [selected, setSelected] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  const load = () =>
    db.entities.Claims.list('-created_date', 100).then(setClaims);

  useEffect(() => {
    load();
  }, []);

  const getFilteredClaims = () => {
    if (!claims) return [];
    if (filter === 'pending') {
      return claims.filter((c) => ['submitted', 'under_review', 'evidence_requested'].includes(c.status));
    }
    if (filter === 'all') return claims;
    return claims.filter((c) => c.status === filter);
  };

  const filteredClaims = getFilteredClaims();
  const totalPages = Math.ceil(filteredClaims.length / CLAIMS_PER_PAGE) || 1;
  const paginatedClaims = filteredClaims.slice(
    (page - 1) * CLAIMS_PER_PAGE,
    page * CLAIMS_PER_PAGE
  );

  const open = async (c) => {
    setSelected(c);
    setNotes('');
    setActionError('');
    setFeedback(null);
    try {
      let ev = await db.entities.OwnershipEvidence.filter({ claim_id: c.id });
      if (!ev || ev.length === 0) {
        // Fallback to local storage if remote filter had no items
        try {
          const raw = localStorage.getItem('entity_OwnershipEvidence');
          const list = raw ? JSON.parse(raw) : [];
          ev = list.filter(item => item.claim_id === c.id);
        } catch {}
      }
      setEvidence(ev || []);
    } catch (e) {
      console.error('Failed to load evidence:', e);
      setEvidence([]);
    }
  };

  const decide = async (decision) => {
    if (decision === 'request_evidence' && !notes.trim()) {
      setActionError('Notes are required when requesting additional evidence.');
      return;
    }

    const confirmMsg = {
      approve: 'Approve this claim? A supervised handover will be scheduled.',
      reject: 'Reject this claim? The reports will be released for re-matching.',
      request_evidence: 'Request additional evidence from the claimant?',
    };

    if (!confirm(confirmMsg[decision])) return;

    setBusy(true);
    setActionError('');
    setFeedback(null);
    try {
      const statusVal = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'evidence_requested';

      // 1. Invoke serverless function (which updates Supabase & generates OTP)
      await db.functions.invoke('decideClaim', {
        claimId: selected.id,
        decision,
        notes,
      });

      // 2. Explicitly update Claims entity for instant persistence
      await db.entities.Claims.update(selected.id, {
        status: statusVal,
        review_notes: notes || '',
      }).catch(() => {});

      // 3. Update localStorage cache so user view immediately reflects approval
      try {
        const raw = localStorage.getItem('entity_Claims');
        if (raw) {
          const list = JSON.parse(raw);
          const idx = list.findIndex(item => item.id === selected.id);
          if (idx >= 0) {
            list[idx].status = statusVal;
            list[idx].review_notes = notes || '';
            localStorage.setItem('entity_Claims', JSON.stringify(list));
          }
        }
      } catch (err) {}

      // 4. Create instant alert notification for claimant so they know immediately
      const claimantId = selected.claimant_id || 'user-sarah-101';
      const notifItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: claimantId,
        type: decision === 'approve' ? 'claim_approved' : decision === 'reject' ? 'claim_rejected' : 'evidence_requested',
        title: decision === 'approve'
          ? '🎉 Claim Approved! Handover Scheduled'
          : decision === 'reject'
          ? '❌ Claim Rejected by Security Admin'
          : '⚠️ Additional Evidence Requested by Admin',
        message: decision === 'approve'
          ? `Your claim #${selected.id.slice(-6)} has been verified and approved by the campus security desk! A supervised handover is scheduled at Central Campus Security Desk. Check your Handover status for the verification code.`
          : `Reviewer update on claim #${selected.id.slice(-6)}: ${notes || 'Status updated.'}`,
        related_entity_type: 'Claims',
        related_entity_id: selected.id,
        is_read: false,
        created_date: new Date().toISOString(),
      };

      await db.entities.Notifications.create(notifItem).catch(() => {});

      try {
        const rawN = localStorage.getItem('entity_Notifications');
        const nList = rawN ? JSON.parse(rawN) : [];
        nList.unshift(notifItem);
        localStorage.setItem('entity_Notifications', JSON.stringify(nList));
      } catch {}

      const successLabels = {
        approve: 'Claim approved! Supervised handover has been initiated.',
        reject: 'Claim rejected.',
        request_evidence: 'Evidence request sent to claimant.',
      };

      setFeedback({
        type: 'success',
        text: successLabels[decision] || 'Claim decision recorded.',
      });

      setSelected(null);
      setNotes('');
      load();
    } catch (e) {
      setActionError(e.response?.data?.error || e.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const pendingCount = claims
    ? claims.filter((c) => ['submitted', 'under_review', 'evidence_requested'].includes(c.status)).length
    : 0;

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader
        eyebrow="Human verification"
        title="Claim Review Queue"
        description="AI scores are context only. Review private evidence before making any ownership decision."
      />

      {/* Feedback Banner */}
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
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
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

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        {/* ── Claims List ──────────────────────────────────────── */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            {/* Filter tabs */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setFilter('pending');
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === 'pending'
                    ? 'bg-[#0F1F3D] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pending ({pendingCount})
              </button>

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                <Filter className="h-3 w-3 text-slate-400" />
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer text-xs"
                >
                  <option value="pending">Pending Queue</option>
                  <option value="all">All Claims</option>
                  <option value="submitted">Submitted</option>
                  <option value="evidence_requested">Evidence Requested</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Claims */}
            {!claims ? (
              <p className="py-12 text-center text-sm text-slate-500">Loading claims queue…</p>
            ) : paginatedClaims.length ? (
              <div className="space-y-2">
                {paginatedClaims.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => open(c)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition hover:bg-slate-50 ${
                      selected?.id === c.id ? 'border-blue-400 bg-blue-50/50 shadow-xs' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <b className="block text-xs font-bold text-slate-900">Claim #{c.id.slice(-7)}</b>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          STATUS_BADGE[c.status] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">Review →</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-slate-500">
                No claims found matching this filter.
              </p>
            )}
          </div>

          {/* Claims Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-slate-500">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Evidence Detail Panel ────────────────────────────── */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          {selected ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-base">Private Evidence Review</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">#{selected.id.slice(-7)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      STATUS_BADGE[selected.status] || 'bg-slate-100'
                    }`}
                  >
                    {selected.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Self-claim warning */}
              {user?.id === selected.claimant_id && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-blue-600" />
                  <span>Demo Mode: Single-machine presentation review enabled.</span>
                </div>
              )}

              {/* Previous review notes */}
              {selected.review_notes && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500">Previous reviewer notes:</p>
                  <p className="mt-1 text-xs whitespace-pre-wrap text-slate-700">{selected.review_notes}</p>
                </div>
              )}

              {/* Evidence items */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Submitted Evidence ({evidence.length})
                </h3>
                {evidence.map((e) => (
                  <div key={e.id} className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold capitalize flex items-center gap-1.5 text-slate-800">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {e.evidence_type.replace(/_/g, ' ')}
                      </p>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          e.verified ? 'text-green-700' : 'text-slate-400'
                        }`}
                      >
                        {e.verified ? '✓ Verified' : 'Unverified'}
                      </span>
                    </div>
                    {e.text_description && (
                      <p className="mt-2 whitespace-pre-wrap text-slate-600">
                        {e.text_description}
                      </p>
                    )}
                    {e.file_url && (
                      <a
                        href={e.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open evidence file
                      </a>
                    )}
                  </div>
                ))}
                {!evidence.length && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-4 text-xs text-amber-800 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    No evidence submitted yet — request more information before approving.
                  </div>
                )}
              </div>

              {/* Decision actions */}
              {['submitted', 'under_review', 'evidence_requested'].includes(selected.status) && (
                <div className="mt-6 border-t pt-5">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Review notes (required for evidence requests, optional for approve/reject)..."
                    className="mb-3 text-xs"
                  />
                  {actionError && (
                    <p className="mb-3 text-xs text-red-600 font-medium">{actionError}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => decide('approve')}
                      disabled={busy}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-xs font-bold text-white shadow-sm"
                    >
                      {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                      Approve Claim
                    </Button>
                    <Button
                      onClick={() => decide('request_evidence')}
                      disabled={busy || selected.status === 'evidence_requested'}
                      variant="outline"
                      size="sm"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 text-xs font-semibold"
                    >
                      <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
                      Request Evidence
                    </Button>
                    <Button
                      onClick={() => decide('reject')}
                      disabled={busy}
                      variant="destructive"
                      size="sm"
                      className="text-xs font-semibold"
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="py-24 text-center text-sm text-slate-500">
              Select a claim from the queue to inspect private evidence and record a decision.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}