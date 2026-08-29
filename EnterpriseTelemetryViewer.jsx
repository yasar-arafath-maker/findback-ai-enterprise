/**
 * ZEXO / FindBack AI — Read-Only Enterprise Telemetry & Database Viewer Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Safe, read-only UI component that fetches /api/enterprise-console and displays
 * live local_db.json collections (Users, Lost/Found Reports, Claims, AI Matches).
 * Purely additive — causes 0 side effects or modifications to application data.
 */

import React, { useEffect, useState } from 'react';
import { Database, ShieldCheck, RefreshCw, FileText, Users, Sparkles, CheckCircle2, Layers } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { getApiBaseUrl } from './networkClient.js';

export default function EnterpriseTelemetryViewer() {
  const [telemetry, setTelemetry] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
      const res = await fetch(`${baseUrl}/api/enterprise-console`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setTelemetry(data);
      } else {
        // Fallback read from localStorage entity proxies
        const rawUsers = JSON.parse(localStorage.getItem('b44_user') ? `[${localStorage.getItem('b44_user')}]` : '[]');
        const rawLost = JSON.parse(localStorage.getItem('entity_LostReports') || '[]');
        const rawFound = JSON.parse(localStorage.getItem('entity_FoundReports') || '[]');
        const rawMatches = JSON.parse(localStorage.getItem('entity_AIMatches') || '[]');
        setTelemetry({
          status: 'active_local_fallback',
          server: 'ZEXO Standalone Client Telemetry',
          timestamp: new Date().toISOString(),
          collections: {
            users: rawUsers,
            lost_reports: rawLost,
            found_reports: rawFound,
            ai_matches: rawMatches,
            claims: [],
            handovers: [],
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

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 animate-fade-in-up">
      <PageHeader
        eyebrow="Enterprise Inspection Console"
        title="Read-Only Local DB & Telemetry Viewer"
        description="Structured corporate viewer rendering local_db.json persistence collections without data mutation."
        action={
          <button
            onClick={fetchTelemetry}
            className="btn-interactive inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        }
      />

      {/* Corporate Metadata Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              {telemetry?.server || 'ZEXO Enterprise Engine'}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Target File: {telemetry?.database_file || 'local_db.json'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-700 font-bold">
            ● Read-Only Safe
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
          ['found_reports', 'Found Reports', FileText, collections.found_reports?.length || 0],
          ['ai_matches', 'AI Matches', Sparkles, collections.ai_matches?.length || 0],
          ['claims', 'Claims & Evidence', ShieldCheck, collections.claims?.length || 0],
          ['handovers', 'Handovers', CheckCircle2, collections.handovers?.length || 0],
        ].map(([key, label, Icon, count]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all btn-interactive ${
              activeTab === key
                ? 'bg-blue-600 text-white shadow-md'
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

      {/* Telemetry Data Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-white uppercase">{activeTab}</span>
            <span>({currentCollectionData.length} records)</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">JSON Viewer Mode</span>
        </div>

        <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[500px]">
          {currentCollectionData.length > 0 ? (
            <pre className="text-emerald-400 leading-relaxed">
              {JSON.stringify(currentCollectionData, null, 2)}
            </pre>
          ) : (
            <p className="text-slate-500 py-8 text-center italic">
              No telemetry records logged inside collection "{activeTab}".
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
