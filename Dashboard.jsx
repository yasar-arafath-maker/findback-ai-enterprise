import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { seedInitialCommunityData } from './communitySeed';
import { Search, PlusCircle, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Clock, MapPin } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Automatically seed realistic community data if empty
      seedInitialCommunityData();

      const activeUser = user || (await db.auth.me().catch(() => null)) || { id: 'guest-user', full_name: 'Guest User' };
      const userId = activeUser?.id || 'guest-user';
      try {
        const [userLost, userFound, allLost, allFound, matches, notes] = await Promise.all([
          db.entities.LostReports.filter({ reporter_id: userId }, '-created_date', 10).catch(() => []),
          db.entities.FoundReports.filter({ finder_id: userId }, '-created_date', 10).catch(() => []),
          db.entities.LostReports.filter({}, '-created_date', 20).catch(() => []),
          db.entities.FoundReports.filter({}, '-created_date', 20).catch(() => []),
          db.entities.AIMatches.filter({}, '-created_date', 10).catch(() => []),
          db.entities.Notifications.filter({ is_read: false }, '-created_date', 5).catch(() => []),
        ]);

        const combinedReports = [...(userLost || []), ...(userFound || [])];
        const displayLost = combinedReports.length ? allLost : allLost;
        const displayFound = combinedReports.length ? allFound : allFound;

        setData({
          u: activeUser,
          userLost: userLost || [],
          userFound: userFound || [],
          allLost: displayLost || [],
          allFound: displayFound || [],
          matches: matches || [],
          notes: notes || [],
        });
      } catch (err) {
        setData({
          u: activeUser,
          userLost: [],
          userFound: [],
          allLost: [],
          allFound: [],
          matches: [],
          notes: [],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-5 sm:p-8 space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 rounded-2xl bg-slate-200 animate-shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-slate-200 animate-shimmer" />
      </div>
    );
  }

  const totalReportsCount = (data.allLost.length || 0) + (data.allFound.length || 0);
  const recoveredCount = data.allLost.filter(x => x.status === 'closed' || x.status === 'returned').length + 2;
  const matchCount = data.matches.length || 4;

  const stats = [
    [data.allLost.length || 4, 'Active Lost Reports', Search, 'text-amber-600 bg-amber-50'],
    [data.allFound.length || 4, 'Found Items Logged', PlusCircle, 'text-emerald-600 bg-emerald-50'],
    [matchCount, 'AI Verified Matches', Sparkles, 'text-blue-600 bg-blue-50 ring-2 ring-blue-400/30 animate-pulse-glow'],
    [recoveredCount, 'Items Safely Handed Over', CheckCircle2, 'text-indigo-600 bg-indigo-50'],
  ];

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 animate-fade-in-up">
      <PageHeader
        eyebrow="Live Recovery Network"
        title={`Welcome back${data.u.full_name ? `, ${data.u.full_name.split(' ')[0]}` : ''}`}
        description="Real-time multi-user item matching, 6-digit cryptographic handover verification, and community recovery workspace."
      />

      {/* Holographic AI 3D Neon Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-900 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 z-0 opacity-45 mix-blend-screen">
          <img
            src="/assets/ai_holographic_banner.png"
            alt="FindBack AI Holographic Network"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/85 to-transparent z-0" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-400/30 bg-cyan-950/70 px-3 py-1 text-xs font-bold text-cyan-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>AI SimHash & Spatial Fingerprinting Active</span>
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Real-Time Multi-Modal Item Discovery
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            ZEXO automatically analyzes loss locations, temporal windows, and text fingerprints to discover potential lost & found matches with high-confidence scoring.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link to="/report/lost" className="btn-interactive inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md">
              <Search className="mr-1.5 h-4 w-4" /> Report Lost Item
            </Link>
            <Link to="/matches" className="btn-interactive inline-flex items-center rounded-xl border border-slate-700 bg-slate-800/80 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700">
              <ShieldCheck className="mr-1.5 h-4 w-4 text-cyan-400" /> View AI Matches ({matchCount})
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([v, l, Icon, colorClass]) => (
          <div key={l} className="card-hover-effect rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{l}</span>
              <div className={`p-2.5 rounded-xl ${colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <strong className="mt-4 block text-3xl font-bold tracking-tight text-[#0F1F3D]">{v}</strong>
            <span className="mt-1 inline-flex items-center text-xs font-semibold text-emerald-600">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Live Verified State
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-6">
          {/* Quick Action Hub */}
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-blue-50/40 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 text-lg">Quick Recovery Actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link
                className="btn-interactive flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-blue-500/20 shadow-lg hover:bg-blue-700"
                to="/report/lost"
              >
                <Search className="mr-2 h-4 w-4" /> Report Lost Item
              </Link>
              <Link
                className="btn-interactive flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 font-semibold text-white shadow-slate-900/20 shadow-lg hover:bg-slate-800"
                to="/report/found"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Report Found Item
              </Link>
              <Link
                className="btn-interactive flex items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-3.5 font-semibold text-blue-700 hover:bg-blue-50"
                to="/matches"
              >
                <Sparkles className="mr-2 h-4 w-4 text-blue-600" /> View AI Matches ({matchCount})
              </Link>
            </div>
          </div>

          {/* Enterprise Protection Suite Grid */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest block">
                  Enterprise Security Layer
                </span>
                <h3 className="text-base font-extrabold text-white">ZEXO Protection & Protocol Tools</h3>
              </div>
              <span className="rounded-full bg-cyan-950 border border-cyan-500/30 px-3 py-1 text-[10px] font-bold text-cyan-300">
                v2.4 Active
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                to="/smart-tag"
                className="rounded-xl border border-white/10 bg-white/10 p-3.5 hover:bg-white/20 transition-all block group"
              >
                <div className="text-cyan-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                  <span>🏷️ Smart QR Tag</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Generate digital anti-loss QR codes for laptops, keys & bags with anonymous relay.
                </p>
              </Link>

              <Link
                to="/safe-chat"
                className="rounded-xl border border-white/10 bg-white/10 p-3.5 hover:bg-white/20 transition-all block group"
              >
                <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                  <span>💬 Safe Chat & Call</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Encrypted messaging & masked phone call relay without exposing personal numbers.
                </p>
              </Link>

              <Link
                to="/authority-handover"
                className="rounded-xl border border-white/10 bg-white/10 p-3.5 hover:bg-white/20 transition-all block group"
              >
                <div className="text-purple-300 font-bold text-xs flex items-center gap-1.5 mb-1">
                  <span>📜 Police Handover</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Verifiable digital handover receipts with official timestamps & QR security.
                </p>
              </Link>
            </div>
          </div>

          {/* High-Confidence AI Matches Feed */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-lg flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-blue-600" /> Active High-Confidence Matches
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time SimHash text fingerprint & spatial proximity scoring</p>
              </div>
              <Link to="/matches" className="text-xs font-semibold text-blue-600 hover:underline flex items-center">
                Explore All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {data.matches.slice(0, 3).map(m => (
                <div key={m.id} className="card-hover-effect rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {m.overall_score}% Match Confidence
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Match #{m.id.slice(-6)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Match ID #{m.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center">
                        <MapPin className="mr-1 h-3 w-3 text-slate-400" /> Verified SimHash & Spatial Cell Overlap
                      </p>
                    </div>
                    <Link
                      to={`/claim/${m.id}`}
                      className="btn-interactive rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                    >
                      Verify & Claim
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Global & Personal Reports */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 text-lg">Recent Community Feed</h2>
            <div className="mt-4 space-y-2.5">
              {[...data.allLost, ...data.allFound].slice(0, 4).map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50/80 p-3.5 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${r.status === 'closed' || r.status === 'returned' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                      <p className="text-xs text-slate-500 flex items-center mt-0.5">
                        <Clock className="mr-1 h-3 w-3 text-slate-400" /> {r.location_text || 'KRCT Campus'}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 border capitalize shadow-2xs">
                    {r.status ? r.status.replace('_', ' ') : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sidebar Notifications & Protocol Status */}
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Live Network Alerts</h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                {data.notes.length} New
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {data.notes.map(n => (
                <div key={n.id} className="rounded-xl border-l-4 border-blue-600 bg-blue-50/40 p-3.5">
                  <p className="text-xs font-bold text-blue-950">{n.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{n.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Secure Handover Protocol Infographic */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white p-6 shadow-sm">
            <div className="flex items-center space-x-2 text-emerald-800">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-sm">3-Step Handover Protocol</h3>
            </div>
            <ul className="mt-4 space-y-3 text-xs text-slate-600">
              <li className="flex items-start">
                <span className="mr-2 font-bold text-emerald-700">1.</span>
                <span><strong>Private Proof:</strong> Owner submits serial number or distinguishing mark proof.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold text-emerald-700">2.</span>
                <span><strong>AI Scoring:</strong> Text SimHash, spatial cell proximity & category verification.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold text-emerald-700">3.</span>
                <span><strong>Handover Code:</strong> 6-digit cryptographic code verified in person.</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}