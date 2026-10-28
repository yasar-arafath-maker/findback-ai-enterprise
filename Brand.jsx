import React from 'react';

export default function Brand({ light = false, subtitle = true, className = '', imageOnly = false }) {
  return (
    <div className={`flex items-center gap-3 font-bold tracking-tight select-none ${className}`}>
      {/* User's Custom Cyber Lock & Beacon Emblem */}
      <div className="relative group flex items-center justify-center">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 opacity-60 blur-[4px] group-hover:opacity-100 transition duration-300"></div>
        <img
          src="/logo.jpg"
          alt="FindBack AI Logo"
          className="relative h-10 w-10 rounded-2xl object-cover shadow-md border border-cyan-400/50 transition-transform group-hover:scale-105"
        />
      </div>

      {/* Brand Text Monogram */}
      {!imageOnly && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`text-lg font-black tracking-tight ${light ? 'text-white' : 'text-[#0F1F3D]'}`}>
              FindBack
            </span>
            <span className="rounded-md bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white shadow-sm tracking-wider">
              AI
            </span>
          </div>
          {subtitle && (
            <span className={`text-[9px] font-bold tracking-[0.2em] uppercase mt-1 ${light ? 'text-slate-400' : 'text-slate-500'}`}>
              Enterprise Recovery
            </span>
          )}
        </div>
      )}
    </div>
  );
}