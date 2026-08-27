import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState(null);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const activeUser = user || (await db.auth.me().catch(() => null)) || { id: 'guest-user' };
      const userId = activeUser?.id || 'guest-user';
      try {
        const [myLost, myFound] = await Promise.all([
          db.entities.LostReports.filter({ reporter_id: userId }, '-created_date', 100).catch(() => []),
          db.entities.FoundReports.filter({ finder_id: userId }, '-created_date', 100).catch(() => []),
        ]);
        const myLostIds = new Set((myLost || []).map(r => r.id));
        const myFoundIds = new Set((myFound || []).map(r => r.id));

        const lostMatchPromises = Array.from(myLostIds).slice(0, 10).map(reportId =>
          db.entities.AIMatches.filter({ lost_report_id: reportId }, '-overall_score', 20).catch(() => [])
        );
        const foundMatchPromises = Array.from(myFoundIds).slice(0, 10).map(reportId =>
          db.entities.AIMatches.filter({ found_report_id: reportId }, '-overall_score', 20).catch(() => [])
        );
        const matchResults = await Promise.all([...lostMatchPromises, ...foundMatchPromises]);
        let allMatches = matchResults.flat();

        // If user has no specific matches yet, load all top AI matches as fallback
        if (!allMatches.length) {
          const fallbackMatches = await db.entities.AIMatches.filter({}, '-overall_score', 20).catch(() => []);
          allMatches = fallbackMatches || [];
        }

        const seen = new Set();
        const unique = allMatches.filter(m => {
          if (!m?.id || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        unique.sort((a, b) => b.overall_score - a.overall_score);
        setMatches(unique.slice(0, 50));
      } catch (err) {
        setMatches([]);
      }
    })();
  }, [user]);

  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-8">
      <PageHeader
        eyebrow="AI-assisted discovery"
        title="Potential matches"
        description="Similarity suggestions help narrow the search. Every ownership claim still requires human verification."
      />

      {location.state?.submitted && (
        <div className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
          Report submitted successfully. Matching has finished for the strongest available candidates.
        </div>
      )}

      {!matches ? (
        <div className="text-sm text-slate-500">Loading potential matches…</div>
      ) : matches.length ? (
        <div className="space-y-4">
          {matches.map(m => (
            <article key={m.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-violet-50">
                  <Sparkles className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">Potential Match</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        m.confidence_level === 'high'
                          ? 'bg-green-50 text-green-700'
                          : m.confidence_level === 'medium'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {m.confidence_level} confidence
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {m.match_reasons?.[0] || 'Several item signals appear similar.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Image Score {m.image_similarity_score}%</span>
                    <span>Text Similarity {m.text_similarity_score}%</span>
                    <span>Geo Proximity {m.location_proximity_score}%</span>
                    <span>Date Match {m.time_proximity_score}%</span>
                    <span>Category {m.category_match_score}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <strong className="block text-3xl text-violet-700">{m.overall_score}%</strong>
                  <Link
                    to={`/matches/${m.id}`}
                    className="mt-2 inline-block rounded-lg bg-[#0F1F3D] px-4 py-2 text-xs font-semibold text-white"
                  >
                    View Match
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-white py-20 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-violet-400" />
          <p className="mt-4 text-sm text-slate-500">
            AI hasn't found a strong potential match yet.
          </p>
        </div>
      )}
    </div>
  );
}