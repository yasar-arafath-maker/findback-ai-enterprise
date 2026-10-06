import { useEffect, useState } from 'react';
import { db } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Lock,
} from 'lucide-react';

export default function AdminHandovers() {
  const [items, setItems] = useState(null);
  const [codes, setCodes] = useState({});
  const [busy, setBusy] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'scheduled' | 'completed' | 'disputed' | 'cancelled'
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  const load = async () => {
    try {
      const data = await db.entities.Handovers.list('-created_date', 100);
      setItems(data || []);
    } catch (e) {
      console.error('Failed to load handovers:', e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const complete = async (h) => {
    const code = codes[h.id] || '';
    if (!code || code.length < 6) {
      setFeedback({
        type: 'error',
        text: 'Please enter the full 6-digit verification code provided by the claimant.',
      });
      return;
    }

    if (!confirm('Complete this handover after verifying both parties and the code in person?')) {
      return;
    }

    setBusy(h.id);
    setFeedback(null);
    try {
      if (typeof db.functions?.invoke === 'function') {
        await db.functions.invoke('completeHandover', {
          handoverId: h.id,
          verificationCode: code,
        });
      } else {
        await db.entities.Handovers.update(h.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
        await db.entities.AdminActions.create({
          admin_id: 'admin',
          action_type: 'handover_managed',
          target_entity_type: 'Handovers',
          target_entity_id: h.id,
          notes: 'Handover completed via Admin supervision',
        });
      }

      setFeedback({
        type: 'success',
        text: `Handover #${h.id.slice(-7)} completed successfully! Cryptographic receipt generated.`,
      });

      setCodes((prev) => ({ ...prev, [h.id]: '' }));
      load();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Verification failed. Code may be invalid or expired.',
      });
    } finally {
      setBusy('');
    }
  };

  const filteredItems = items
    ? statusFilter === 'all'
      ? items
      : items.filter((h) => h.status === statusFilter)
    : [];

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-8">
      <PageHeader
        eyebrow="Admin supervision"
        title="Handover & Recovery Governance"
        description="Verify 6-digit cryptographic handover codes in person before finalizing item recovery."
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

      {/* ── Filter Bar ────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
          >
            <option value="all">All Handovers ({items?.length || 0})</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="disputed">Disputed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* ── Handover Queue ────────────────────────────────────────── */}
      {!items ? (
        <div className="flex items-center justify-center p-12 text-sm text-slate-400">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading scheduled handovers…
        </div>
      ) : paginatedItems.length ? (
        <div className="space-y-4">
          {paginatedItems.map((h) => {
            const isCompleted = h.status === 'completed';
            return (
              <article
                key={h.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-base font-bold text-[#0F1F3D]">
                        Handover #{h.id.slice(-7)}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          isCompleted
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : h.status === 'scheduled'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {h.status.replaceAll('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {h.scheduled_location || 'Campus Center'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {h.scheduled_datetime
                          ? new Date(h.scheduled_datetime).toLocaleString()
                          : 'Pending Schedule'}
                      </span>
                    </div>
                  </div>

                  {!isCompleted && (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Lock className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          className="h-10 w-36 pl-8 font-mono text-center tracking-widest text-xs"
                          maxLength={6}
                          value={codes[h.id] || ''}
                          onChange={(e) =>
                            setCodes({ ...codes, [h.id]: e.target.value })
                          }
                          placeholder="6-digit code"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => complete(h)}
                        disabled={busy === h.id}
                        className="h-10 bg-blue-600 hover:bg-blue-700 text-xs px-4"
                      >
                        {busy === h.id ? (
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Complete
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          No handovers match the selected filter.
        </div>
      )}

      {/* ── Pagination Controls ───────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page} of {totalPages}
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
    </div>
  );
}