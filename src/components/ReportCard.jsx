import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Eye, Image as ImageIcon } from 'lucide-react';

export default function ReportCard({ report, type }) {
  const [modalOpen, setModalOpen] = useState(false);
  const date = report?.lost_date || report?.found_date || report?.created_date?.split('T')[0];
  const imageUrl = report?.primary_image_url || report?.image_url;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md group">
      {/* Image Preview Container */}
      <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={report.title || 'Item image'}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (e.target.parentNode) {
                  e.target.parentNode.classList.add('bg-slate-200');
                  e.target.parentNode.innerHTML = '<span class="text-xs font-mono text-slate-500">Image Preview Unavailable</span>';
                }
              }}
            />
            <button
              onClick={() => setModalOpen(true)}
              className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-semibold backdrop-blur-xs"
              title="Click for full-screen image preview"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4">
            <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
            <span className="text-xs font-mono">No Image Attached</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{report.title}</h3>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 border border-blue-100/60 flex-shrink-0">
            {(report.status || 'active').replace('_', ' ')}
          </span>
        </div>
        <p className="mt-1 text-xs text-violet-600 font-semibold">
          {type === 'lost' ? 'Lost Report' : 'Found Report'} · {report.category}
        </p>
        <div className="mt-3 space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <span className="truncate">{report.location_text || 'Location not specified'}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span>{date || 'Date unknown'}</span>
          </p>
          <p className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
            <span>Stored in DB Vault: {report.storage_location || 'Central DB Vault'}</span>
          </p>
        </div>
        <Link to="/matches" className="mt-3 block text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
          Check Potential Matches & Owner Status →
        </Link>
      </div>

      {/* Full-Screen Image Preview Modal */}
      {modalOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-slate-900 p-2 border border-slate-700 shadow-2xl">
            <img src={imageUrl} alt={report.title} className="max-h-[75vh] w-auto object-contain rounded-xl mx-auto" />
            <div className="p-3 text-center">
              <h4 className="text-sm font-bold text-white">{report.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{report.category} · {report.location_text}</p>
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