/**
 * FindBack AI Enterprise — Interactive Telemetry & Database Inspection Console
 * ─────────────────────────────────────────────────────────────────────────────
 * Executive-grade administrative inspection layer providing real-time visual
 * tables, KPI metrics, record inspection cards, and live audit telemetry.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Database,
  ShieldCheck,
  RefreshCw,
  FileText,
  Users,
  Sparkles,
  CheckCircle2,
  Layers,
  Search,
  Download,
  Copy,
  Check,
  Eye,
  Activity,
  Shield,
  Clock,
  MapPin,
  Tag,
  Code2,
  Table as TableIcon
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { getApiBaseUrl } from './networkClient.js';
import { db } from '@/api/base44Client.js';

export default function EnterpriseTelemetryViewer() {
  const [telemetry, setTelemetry] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('visual'); // 'visual' or 'json'
  const [copied, setCopied] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
      const res = await fetch(`${baseUrl}/api/enterprise-console`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setTelemetry(data);
      } else {
        // Fallback: Read directly from local entity store
        const [users, lost, found, matches, claims, handovers] = await Promise.all([
          db.entities.User.filter({}, '-created_date', 100).catch(() => []),
          db.entities.LostReports.filter({}, '-created_date', 100).catch(() => []),
          db.entities.FoundReports.filter({}, '-created_date', 100).catch(() => []),
          db.entities.AIMatches.filter({}, '-created_date', 100).catch(() => []),
          db.entities.Claims.filter({}, '-created_date', 100).catch(() => []),
          db.entities.Handovers.filter({}, '-created_date', 100).catch(() => []),
        ]);

        setTelemetry({
          status: 'online',
          server: 'FindBack AI Local Telemetry Engine',
          timestamp: new Date().toISOString(),
          uptime_seconds: 1420,
          collections: {
            users: users.length ? users : JSON.parse(localStorage.getItem('b44_user') ? `[${localStorage.getItem('b44_user')}]` : '[]'),
            lost_reports: lost,
            found_reports: found,
            ai_matches: matches,
            claims: claims,
            handovers: handovers,
          },
        });
      }
    } catch (err) {
      console.warn('[Enterprise Telemetry] Fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const collections = telemetry?.collections || {};
  const currentCollectionData = collections[activeTab] || [];

  // Filter records based on search query
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return currentCollectionData;
    const q = searchTerm.toLowerCase();
    return currentCollectionData.filter((item) => {
      return Object.values(item).some((val) =>
        String(val || '').toLowerCase().includes(q)
      );
    });
  }, [currentCollectionData, searchTerm]);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(currentCollectionData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(collections, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `findback_telemetry_dump_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (['active', 'approved', 'completed', 'online'].includes(s)) {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">{status}</span>;
    }
    if (['pending_review', 'submitted', 'under_review'].includes(s)) {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">{status}</span>;
    }
    if (['rejected', 'suspended', 'cancelled'].includes(s)) {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">{status}</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">{status || 'NORMAL'}</span>;
  };

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 animate-fade-in-up">
      <PageHeader
        eyebrow="System Governance & Health"
        title="Enterprise Live Telemetry & Database Console"
        description="Real-time multi-collection database inspector and system telemetry viewer. Monitor users, active lost/found items, AI matches, and verified handovers with cryptographic proof."
        action={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'visual' ? 'json' : 'visual')}
              className="btn-interactive inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              {viewMode === 'visual' ? (
                <>
                  <Code2 className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                  <span>Inspect JSON</span>
                </>
              ) : (
                <>
                  <TableIcon className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                  <span>Visual Cards</span>
                </>
              )}
            </button>

            <button
              onClick={fetchTelemetry}
              className="btn-interactive inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        {[
          { label: 'Registered Users', val: collections.users?.length || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Lost Reports', val: collections.lost_reports?.length || 0, icon: FileText, color: 'text-amber-600 bg-amber-50' },
          { label: 'Found Reports', val: collections.found_reports?.length || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'AI Matches', val: collections.ai_matches?.length || 0, icon: Sparkles, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Active Claims', val: collections.claims?.length || 0, icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
          { label: 'Handovers Done', val: collections.handovers?.length || 0, icon: Shield, color: 'text-rose-600 bg-rose-50' },
        ].map((kpi, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{kpi.label}</span>
              <div className={`p-2 rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{kpi.val}</p>
          </div>
        ))}
      </div>

      {/* Service Health & Control Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-cyan-400">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {telemetry?.server || 'FindBack AI Primary Storage'}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Database: <span className="font-bold text-slate-700">local_db.json</span> · Mode: File-Backed Persistent
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-700 font-bold flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-600 animate-pulse" /> Live Healthy
          </span>
          <span className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1 text-slate-600 font-medium">
            Updated: {telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : 'Recent'}
          </span>
        </div>
      </div>

      {/* Collection Tab Selector */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-3">
        {[
          ['users', 'Users', Users, collections.users?.length || 0],
          ['lost_reports', 'Lost Reports', FileText, collections.lost_reports?.length || 0],
          ['found_reports', 'Found Reports', CheckCircle2, collections.found_reports?.length || 0],
          ['ai_matches', 'AI Matches', Sparkles, collections.ai_matches?.length || 0],
          ['claims', 'Claims & Evidence', ShieldCheck, collections.claims?.length || 0],
          ['handovers', 'Handovers', Shield, collections.handovers?.length || 0],
        ].map(([key, label, Icon, count]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setSearchTerm('');
            }}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all btn-interactive ${
              activeTab === key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${activeTab === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab.replace('_', ' ')}...`}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopyJSON}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-300" />
            <span>Export Snapshot</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Visual or Raw JSON */}
      {viewMode === 'visual' ? (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Layers className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No records found</h4>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm ? `No records in "${activeTab}" match query "${searchTerm}".` : `Collection "${activeTab}" has 0 records.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Tab-Specific Visual Data Views */}
              {activeTab === 'users' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Phone / Contact</th>
                      <th className="py-3.5 px-4">User ID</th>
                      <th className="py-3.5 px-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.map((u, i) => (
                      <tr key={u.id || i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                              {(u.full_name || u.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{u.full_name || 'Anonymous User'}</div>
                              <div className="text-[11px] text-slate-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}`}>
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{renderBadge(u.account_status || 'active')}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.phone || '—'}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{u.id}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{u.created_date ? new Date(u.created_date).toLocaleDateString() : 'Recent'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {(activeTab === 'lost_reports' || activeTab === 'found_reports') && (
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredData.map((item, i) => (
                    <div key={item.id || i} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-lg bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                          <Tag className="h-3 w-3" /> {item.category || 'General'}
                        </span>
                        {renderBadge(item.status || 'active')}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">{item.description || 'No detailed description provided.'}</p>

                      <div className="space-y-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 font-mono">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span className="truncate">{item.location_text || 'Campus / City Area'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{item.lost_date || item.found_date || item.created_date || 'Recent'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">ID: {item.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'ai_matches' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Match ID</th>
                      <th className="py-3.5 px-4">Match Confidence</th>
                      <th className="py-3.5 px-4">Lost Report Link</th>
                      <th className="py-3.5 px-4">Found Report Link</th>
                      <th className="py-3.5 px-4">Feature Scores</th>
                      <th className="py-3.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.map((m, i) => (
                      <tr key={m.id || i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-blue-600">{m.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${m.overall_score >= 75 ? 'bg-emerald-500' : m.overall_score >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, m.overall_score || 0)}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-900 font-mono text-xs">{m.overall_score}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{m.lost_report_id}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{m.found_report_id}</td>
                        <td className="py-3 px-4 text-[10px] text-slate-500 font-mono">
                          Text: {m.text_similarity_score || 0}% | Geo: {m.location_proximity_score || 0}%
                        </td>
                        <td className="py-3 px-4">{renderBadge(m.status || 'pending_review')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'claims' && (
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredData.map((c, i) => (
                    <div key={c.id || i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-purple-700">{c.id}</span>
                        {renderBadge(c.status || 'submitted')}
                      </div>
                      <p className="text-xs text-slate-700 mb-3 italic">"{c.claimant_notes || 'Ownership claim filed with private evidence.'}"</p>
                      <div className="text-[11px] text-slate-500 font-mono space-y-1 border-t border-slate-100 pt-2">
                        <div>Claimant: <span className="font-bold text-slate-700">{c.claimant_id}</span></div>
                        <div>Match: <span className="text-slate-600">{c.match_id}</span></div>
                        <div>Filed: <span>{c.created_date ? new Date(c.created_date).toLocaleDateString() : 'Recent'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'handovers' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Handover ID</th>
                      <th className="py-3.5 px-4">Claim ID</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Verification Code</th>
                      <th className="py-3.5 px-4">SHA-256 Receipt Seal</th>
                      <th className="py-3.5 px-4">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.map((h, i) => (
                      <tr key={h.id || i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{h.id}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{h.claim_id}</td>
                        <td className="py-3 px-4">{renderBadge(h.status || 'scheduled')}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">{h.verification_code || '••••••'}</td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500 max-w-[140px] truncate" title={h.receipt_hash}>
                          {h.receipt_hash || 'Pending Code Match'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {h.completed_at ? new Date(h.completed_at).toLocaleTimeString() : 'In Progress'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Formatted Raw JSON Explorer Mode (with Copy & Syntax theme) */
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span>JSON Inspector · {activeTab} ({filteredData.length} items)</span>
            <span>UTF-8 Document</span>
          </div>
          <pre className="text-emerald-400 font-mono text-xs overflow-auto max-h-[550px] leading-relaxed">
            {JSON.stringify(filteredData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
