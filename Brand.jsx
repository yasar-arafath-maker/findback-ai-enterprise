import React from 'react';

export default function Brand({ light = false, subtitle = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 font-bold tracking-tight select-none ${className}`}>
      {/* High-Tech Recovery Emblem */}
      <div className="relative group flex items-center justify-center">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 opacity-70 blur-[4px] group-hover:opacity-100 transition duration-300"></div>
        <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-[#0F1F3D] via-[#152B52] to-[#1E3A8A] border border-cyan-400/40 p-1.5 shadow-inner flex items-center justify-center text-white">
          <svg viewBox="0 0 128 128" fill="none" className="w-full h-full drop-shadow-md">
            <circle cx="64" cy="64" r="48" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="3" strokeDasharray="6 6" />
            <circle cx="64" cy="64" r="32" stroke="rgba(56, 189, 248, 0.55)" strokeWidth="3" />
            <path
              d="M64 26 C79 26 90 37 90 52 C90 70 64 98 64 98 C64 98 38 70 38 52 C38 37 49 26 64 26 Z"
              fill="url(#brandGrad)"
            />
            <circle cx="64" cy="52" r="8" fill="#FFFFFF" />
            <path d="M64 42 L66 49 L73 51 L66 53 L64 60 L62 53 L55 51 L62 49 Z" fill="#0284C7" />
            <defs>
              <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Text Monogram */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`text-lg font-black tracking-tight ${light ? 'text-white' : 'text-[#0F1F3D]'}`}>
            FindBack
          </span>
          <span className="rounded-md bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white shadow-sm tracking-wider">
            AI
          </span>
        </div>
        {subtitle && (
          <span className={`text-[9px] font-bold tracking-[0.2em] uppercase mt-1 ${light ? 'text-slate-400' : 'text-slate-500'}`}>
            Enterprise Recovery
          </span>
        )}
      </div>
    </div>
  );
}