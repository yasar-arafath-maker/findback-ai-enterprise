import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import PageHeader from '@/components/PageHeader';

import { toast } from '@/components/ui/use-toast';
import { Database, Clock, ShieldCheck, CheckCircle, XCircle, CalendarPlus } from 'lucide-react';

export default function MatchDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const match = await db.entities.AIMatches.get(id);
        const [lost, found] = await Promise.all([
          db.entities.LostReports.get(match.lost_report_id).catch(() => null),
          db.entities.FoundReports.get(match.found_report_id).catch(() => null),
        ]);

        // Verify involvement: the current user must be either the lost
        // reporter or the found reporter, or an admin.
        const isOwner = lost?.reporter_id === user.id;
        const isFinder = found?.finder_id === user.id;
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isFinder && !isAdmin) {
          setAccessDenied(true);
          return;
        }

        setData({ match, lost, found, isOwner, isFinder, isAdmin });
      } catch {
        setAccessDenied(true);
      }
    })();
  }, [id, user]);

  const handleOwnerResponse = async (actionType) => {
    setActionLoading(true);
    try {
      const res = await db.functions.invoke('respondToMatch', {
        matchId: id,
        action: actionType,
        claimantId: user?.id,
      });

      if (actionType === 'confirm_claim') {
        toast({
          title: 'Ownership Claim Initiated',
          description: 'Your report is confirmed and stored in the database. Redirecting to ownership verification...'
        });
        navigate(`/claim/${id}`);
      } else if (actionType === 'reject_match') {
        toast({
          title: 'Match Dismissed',
          description: 'Your lost report remains safely stored in the database searching for next matches until you respond.'
        });
        // Refresh page state
        setData(prev => prev ? ({ ...prev, match: { ...prev.match, status: 'rejected_by_owner' } }) : prev);
      } else if (actionType === 'request_extension') {
        toast({
          title: 'Storage Extension Granted',
          description: 'Database retention period extended by 14 days for owner response.'
        });
        // Refresh page state
        setData(prev => prev ? ({ ...prev, lost: { ...prev.lost, owner_response_status: 'retention_extended' } }) : prev);
      }
    } catch (e) {
      toast({
        title: 'Response Error',
        description: e.message || 'Failed to update owner response state.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <div className="rounded-2xl border bg-white py-16 px-6">
          <p className="text-sm font-semibold text-slate-700">Access denied</p>
          <p className="mt-2 text-sm text-slate-500">
            You can only view matches that involve your own reports.
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="mt-6 rounded-lg bg-[#0F1F3D] px-5 py-2 text-sm font-semibold text-white"
          >
            Back to My Matches
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-sm text-slate-500">Loading comparison…</div>;
  }

  const { match, lost, found, isOwner } = data;
  const storageLoc = found?.storage_location || lost?.storage_location || 'Central DB Vault - Locker A-102';
  const ownerStatus = lost?.owner_response_status || 'awaiting_response';

  return (
    <div className="mx-auto max-w-6xl p-5 sm:p-8">
      <PageHeader
        eyebrow="Potential match"
        title={`${match.overall_score}% AI confidence`}
        description="AI-generated potential match. Items are securely stored in database until owner responds."
      />

      {/* Database Retention & Vault Location Banner */}
      <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-blue-900 tracking-wide uppercase">Database Item Retention Active</span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                  {storageLoc}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                This item report is stored safely in database tables until owner responds or retrieves it.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-center">
            <Clock className="h-4 w-4 text-indigo-600" />
            <span>Owner Response Status: <strong className="text-indigo-900 capitalize">{ownerStatus.replace('_', ' ')}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
        <Item report={lost} label="LOST ITEM" />
        <div className="grid place-items-center font-bold text-violet-600">VS</div>
        <Item report={found} label="FOUND ITEM" />
      </div>

      <section className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/50 p-6">
        <h2 className="font-bold text-violet-900">Why this may be a match</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {match.match_reasons?.map(r => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
          {[
            ['Image Score', match.image_similarity_score],
            ['Text Similarity', match.text_similarity_score],
            ['Category', match.category_match_score],
            ['Geo Proximity', match.location_proximity_score],
            ['Date Match', match.time_proximity_score],
          ].map(([x, v]) => (
            <div key={x} className="rounded-xl bg-white p-3">
              <span className="text-slate-500">{x}</span>
              <strong className="mt-1 block text-lg text-violet-700">{v}%</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Owner Response Section */}
      {isOwner && match.status !== 'rejected_by_owner' && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Respond as Owner to this Database Stored Match</span>
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Please confirm if this is your lost item. If not, your lost report remains active and stored in the database to continue searching for other matches.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => handleOwnerResponse('confirm_claim')}
              disabled={actionLoading}
              className="btn-interactive inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Yes, This Is My Item (Claim Now)</span>
            </button>

            <button
              onClick={() => handleOwnerResponse('reject_match')}
              disabled={actionLoading}
              className="btn-interactive inline-flex items-center space-x-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <XCircle className="h-4 w-4 text-slate-400" />
              <span>No, Not My Item (Dismiss & Keep Report Active in DB)</span>
            </button>

            <button
              onClick={() => handleOwnerResponse('request_extension')}
              disabled={actionLoading}
              className="btn-interactive inline-flex items-center space-x-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
            >
              <CalendarPlus className="h-4 w-4 text-indigo-600" />
              <span>Request +14 Days Storage Extension</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Item({ report, label }) {
  const [modalOpen, setModalOpen] = useState(false);
  if (!report) {
    return (
      <article className="overflow-hidden rounded-2xl border bg-white">
        <div className="grid h-52 place-items-center bg-slate-100 text-sm text-slate-400">
          Report not available
        </div>
      </article>
    );
  }

  const imageUrl = report.primary_image_url || report.image_url;

  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm flex flex-col justify-between">
      <div>
        <div className="h-52 bg-slate-100 relative overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={report.title}
                className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => setModalOpen(true)}
              />
              <button
                onClick={() => setModalOpen(true)}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white text-[11px] font-semibold backdrop-blur-xs flex items-center gap-1"
              >
                🔍 Click to Enlarge
              </button>
            </>
          ) : (
            <div className="grid h-full place-items-center text-xs text-slate-400 font-mono">
              No image attached to this report
            </div>
          )}
        </div>
        <div className="p-5">
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">{label}</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">{report.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{report.description}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            {[
              ['Category', report.category],
              ['Brand', report.brand],
              ['Color', report.color],
              ['Location', report.location_text],
              ['Date', report.lost_date || report.found_date],
            ].map(([a, b]) => (
              <div key={a}>
                <dt className="text-slate-400 font-medium">{a}</dt>
                <dd className="mt-1 font-semibold text-slate-800">{b || 'Not provided'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {modalOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] p-2 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            <img src={imageUrl} alt={report.title} className="max-h-[80vh] w-auto object-contain mx-auto rounded-xl" />
            <div className="p-3 text-center">
              <h4 className="text-sm font-bold text-white">{report.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{label} · {report.category} · {report.location_text}</p>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white font-bold text-sm flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </article>
  );
}