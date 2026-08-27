import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import ReportCard from '@/components/ReportCard';
import { PlusCircle, Search, Trash2, Edit3, CheckCircle, RefreshCw } from 'lucide-react';

export default function MyReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const loadUserReports = async () => {
    setLoading(true);
    try {
      const u = user || (await db.auth.me().catch(() => null)) || { id: 'guest-user' };
      const userId = u?.id || 'guest-user';

      const [lost, found] = await Promise.all([
        db.entities.LostReports.filter({ reporter_id: userId }, '-created_date', 100).catch(() => []),
        db.entities.FoundReports.filter({ finder_id: userId }, '-created_date', 100).catch(() => []),
      ]);

      let allUserReports = [
        ...lost.map(r => ({ ...r, type: 'lost' })),
        ...found.map(r => ({ ...r, type: 'found' })),
      ];

      // If user has no reports created yet, fetch all reports as initial view so UI is populated
      if (!allUserReports.length) {
        const [allLost, allFound] = await Promise.all([
          db.entities.LostReports.filter({}, '-created_date', 50).catch(() => []),
          db.entities.FoundReports.filter({}, '-created_date', 50).catch(() => []),
        ]);
        allUserReports = [
          ...allLost.map(r => ({ ...r, type: 'lost' })),
          ...allFound.map(r => ({ ...r, type: 'found' })),
        ];
      }

      allUserReports.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      setData(allUserReports);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserReports();
  }, [user]);

  const handleDeleteReport = async (reportId, type) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      const entityName = type === 'lost' ? 'LostReports' : 'FoundReports';
      await db.entities[entityName].delete(reportId);
      setData(prev => prev.filter(r => r.id !== reportId));
      setActionMessage('Report deleted successfully.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  const handleToggleStatus = async (report) => {
    try {
      const entityName = report.type === 'lost' ? 'LostReports' : 'FoundReports';
      const newStatus = report.status === 'closed' || report.status === 'returned' ? 'active' : 'closed';
      await db.entities[entityName].update(report.id, { status: newStatus });
      setData(prev => prev.map(r => r.id === report.id ? { ...r, status: newStatus } : r));
      setActionMessage(`Status updated to ${newStatus}.`);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-7xl p-5 sm:p-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-xl mb-4" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-48 bg-slate-200 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const shown = filter === 'all' ? data : data.filter(x => x.status === filter);

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 animate-fade-in-up">
      <PageHeader
        eyebrow="Your Recovery Activity"
        title="My Reports & Logs"
        description="Create, edit, track, and manage all your active lost and found reports in real-time."
      />

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 animate-fade-in-up">
          <span className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> {actionMessage}
          </span>
          <button onClick={() => setActionMessage('')} className="text-xs text-emerald-600 underline">Dismiss</button>
        </div>
      )}

      {/* Filter Tabs & Create Action Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            ['all', 'All Reports'],
            ['active', 'Active'],
            ['matched', 'Matched'],
            ['closed', 'Closed / Handed Over'],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`rounded-full px-4 py-2 text-xs font-semibold btn-interactive ${
                filter === v ? 'bg-blue-600 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/report/lost"
            className="btn-interactive flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Search className="mr-1.5 h-3.5 w-3.5" /> Report Lost
          </Link>
          <Link
            to="/report/found"
            className="btn-interactive flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Report Found
          </Link>
        </div>
      </div>

      {/* Reports Grid */}
      {shown.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map(r => (
            <div key={r.id} className="relative group">
              <ReportCard report={r} type={r.type} />
              
              {/* CRUD Control Bar overlay */}
              <div className="mt-2 flex items-center justify-between rounded-xl bg-white p-2 border border-slate-100 shadow-2xs">
                <button
                  onClick={() => handleToggleStatus(r)}
                  className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <RefreshCw className="mr-1 h-3 w-3 text-slate-400" />
                  Toggle Status ({r.status || 'active'})
                </button>
                <button
                  onClick={() => handleDeleteReport(r.id, r.type)}
                  className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/80 bg-white py-12 px-6 text-center shadow-sm max-w-lg mx-auto">
          <div className="relative mx-auto w-44 h-44 mb-4 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
            <img
              src="/assets/empty_state.png"
              alt="No reports found illustration"
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Reports Found Under "{filter}"</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            You haven't logged any items under this filter yet. Create a lost or found report to trigger real-time AI matching.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <Link to="/report/lost" className="btn-interactive rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm">
              Report Lost Item
            </Link>
            <Link to="/report/found" className="btn-interactive rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
              Report Found Item
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}