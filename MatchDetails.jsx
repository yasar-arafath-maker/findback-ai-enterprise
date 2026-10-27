import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import PageHeader from '@/components/PageHeader';

export default function MatchDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const activeUser = user || (await db.auth.me().catch(() => null)) || { id: 'guest-user', role: 'user' };
        const match = await db.entities.AIMatches.get(id);
        if (!match) {
          setAccessDenied(true);
          return;
        }

        const [lost, found] = await Promise.all([
          db.entities.LostReports.get(match.lost_report_id).catch(() => null),
          db.entities.FoundReports.get(match.found_report_id).catch(() => null),
        ]);

        const isOwner = lost?.reporter_id === activeUser?.id;
        const isFinder = found?.finder_id === activeUser?.id;
        const isAdmin = activeUser?.role === 'admin';

        setData({ match, lost, found, isOwner, isFinder, isAdmin, activeUser });
      } catch {
        setAccessDenied(true);
      }
    })();
  }, [id, user]);

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <div className="rounded-2xl border bg-white py-16 px-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Match Record Not Found</p>
          <p className="mt-2 text-sm text-slate-500">
            The requested match record could not be located or may have been archived.
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="mt-6 rounded-lg bg-[#0F1F3D] px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Back to Potential Matches
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-sm text-slate-500">Loading comparison…</div>;
  }

  const { match, lost, found, isOwner } = data;

  return (
    <div className="mx-auto max-w-6xl p-5 sm:p-8">
      <PageHeader
        eyebrow="Potential match"
        title={`${match.overall_score}% AI confidence`}
        description="AI-generated potential match. Ownership requires verification."
      />

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

      {/* Action / Ownership Status Banner */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div>
          {isOwner ? (
            <p className="text-xs text-slate-700 font-medium">
              ✅ You are the verified reporter of this lost item. You can initiate an ownership claim.
            </p>
          ) : isFinder ? (
            <p className="text-xs text-slate-700 font-medium">
              🔍 You reported this found item. Awaiting claimant verification from item owner.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              ℹ️ Public Preview Mode: You are viewing this AI match in read-only mode. Only the original lost item reporter can initiate an ownership claim.
            </p>
          )}
        </div>
        {isOwner && !['rejected', 'expired', 'confirmed'].includes(match.status) && (
          <Link
            to={`/claim/${id}`}
            className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors shrink-0 text-sm"
          >
            Claim This Item
          </Link>
        )}
      </div>
    </div>
  );
}

function Item({ report, label }) {
  if (!report) {
    return (
      <article className="overflow-hidden rounded-2xl border bg-white">
        <div className="grid h-52 place-items-center bg-slate-100 text-sm text-slate-400">
          Report not available
        </div>
      </article>
    );
  }
  return (
    <article className="overflow-hidden rounded-2xl border bg-white">
      <div className="h-52 bg-slate-100">
        {report.primary_image_url ? (
          <Image src={report.primary_image_url} alt={report.title} className="h-full w-full" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-400">
            No image available
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-bold tracking-widest text-blue-600">{label}</p>
        <h2 className="mt-2 text-xl font-bold">{report.title}</h2>
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
              <dt className="text-slate-400">{a}</dt>
              <dd className="mt-1 font-medium">{b || 'Not provided'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}