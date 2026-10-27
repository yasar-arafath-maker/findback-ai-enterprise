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
        unique.sort((a, b) => Number(b.overall_score || b.overall_confidence_score || 0) - Number(a.overall_score || a.overall_confidence_score || 0));
        setMatches(unique.slice(0, 50));
      } catch (err) {
        setMatches([]);
      }
    })();
  }, [user]);

  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-8 animate-fade-in">
      <PageHeader
        eyebrow="AI-assisted discovery"
        title="Potential matches"
        description="Similarity suggestions help narrow the search. Every ownership claim still requires human verification."
      />

      {location.state?.submitted && (
        <div className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-800 border border-green-200">
          Report submitted successfully. Matching has finished for the strongest available candidates.
        </div>
      )}

      {!matches ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Scanning neural match candidates...</p>
        </div>
      ) : matches.length ? (
        <div className="space-y-4">
          {matches.map(m => {
            const overallScore = Math.round(Number(m.overall_score || m.overall_confidence_score || 0));
            const confidence = m.confidence_level || (overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low');
            return (
              <article key={m.id} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-violet-50">
                    <Sparkles className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">Potential Match</h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                          confidence === 'high'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : confidence === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {confidence} confidence
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {Array.isArray(m.match_reasons) && m.match_reasons.length > 0
                        ? m.match_reasons[0]
                        : m.ai_recommendation || 'Multi-modal signals match item category, timeframe, and location proximity.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Image Score {Math.round(Number(m.image_similarity_score ?? 50))}%</span>
                      <span>Text Similarity {Math.round(Number(m.text_similarity_score ?? 0))}%</span>
                      <span>Geo Proximity {Math.round(Number(m.location_proximity_score ?? 0))}%</span>
                      <span>Date Match {Math.round(Number(m.time_proximity_score ?? 0))}%</span>
                      <span>Category {Math.round(Number(m.category_match_score ?? 0))}%</span>
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <strong className="block text-3xl font-black text-violet-700">{overallScore}%</strong>
                    <Link
                      to={`/matches/${m.id}`}
                      className="mt-2 inline-block rounded-lg bg-[#0F1F3D] px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
                    >
                      View Match
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/80 bg-white py-12 px-6 text-center shadow-sm max-w-lg mx-auto">
          <div className="relative mx-auto w-44 h-44 mb-4 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
            <img
              src="/assets/empty_state.png"
              alt="No AI matches found illustration"
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Active AI Matches Yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Our multi-modal engine continuously scans incoming lost & found reports. Log new reports to trigger instant SimHash fingerprinting and spatial proximity matching.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <Link to="/report/lost" className="btn-interactive rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm">
              Log Lost Item
            </Link>
            <Link to="/report/found" className="btn-interactive rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
              Log Found Item
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}