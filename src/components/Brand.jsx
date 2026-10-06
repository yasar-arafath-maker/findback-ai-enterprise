import React from 'react';
export default function Brand({ light = false }) {
  return (
    <div className="flex items-center gap-2 font-bold tracking-tight">
      <img
        src="/favicon.png"
        alt="FindBack AI Logo"
        className="h-9 w-9 rounded-xl object-cover shadow-sm border border-blue-500/20"
      />
      <span className={light ? 'text-white' : 'text-[#0F1F3D]'}>
        FindBack <span className="text-blue-600">AI</span>
      </span>
    </div>
  );
}