/**
 * ZEXO / FindBack AI — Direct Safe Chat & Masked Calling Interface
 * ─────────────────────────────────────────────────────────────────────────────
 * Facilitates end-to-end privacy-masked messaging & virtual masked calling
 * between item owners and finders without revealing actual phone numbers or emails.
 */

import React, { useState } from 'react';
import { MessageSquare, PhoneCall, ShieldCheck, Send, Lock, UserCheck, CheckCheck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function SafeChatWindow() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Finder (Anonymous)',
      text: 'Hi! I found a black leather wallet near Campus Gate 2 with cards inside.',
      time: '10:14 AM',
      isMe: false,
    },
    {
      id: 2,
      sender: 'Verified Owner (You)',
      text: 'Hello! Thank you so much for reporting it! Does it contain a green college ID card?',
      time: '10:16 AM',
      isMe: true,
    },
    {
      id: 3,
      sender: 'Finder (Anonymous)',
      text: 'Yes! It has your student ID and DL. Should we meet near the campus security office?',
      time: '10:18 AM',
      isMe: false,
    },
  ]);

  const [inputMsg, setInputMsg] = useState('');
  const [showCallModal, setShowCallModal] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'Verified Owner (You)',
        text: inputMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      },
    ]);
    setInputMsg('');
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8 animate-fade-in-up">
      <PageHeader
        eyebrow="Privacy Protection Suite"
        title="Direct Encrypted Safe Chat & Masked Calling"
        description="Communicate safely with finders or owners. Phone numbers and personal emails are automatically masked through ZEXO relay."
      />

      {/* Privacy Shield Banner */}
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              Privacy Masking Active
            </h4>
            <p className="text-xs text-emerald-800">
              Virtual Relay ID: <span className="font-mono font-bold">RELAY-8829-ZEXO</span> — Real phone numbers are hidden.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCallModal(true)}
          className="btn-interactive inline-flex items-center space-x-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800"
        >
          <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
          <span>Initiate Masked Call</span>
        </button>
      </div>

      {/* Chat Window Container */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[520px]">
        {/* Chat Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
              FA
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Finder (Anonymous) <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Matched Report #LOST-8492</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded-full font-bold">
            ● End-to-End Encrypted
          </span>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-md rounded-2xl p-4 text-xs shadow-sm ${
                  msg.isMe
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                <div className="font-bold text-[10px] opacity-75 mb-1">{msg.sender}</div>
                <p className="leading-relaxed font-sans text-xs">{msg.text}</p>
                <div className={`mt-1.5 flex items-center justify-end space-x-1 text-[9px] ${msg.isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                  <span>{msg.time}</span>
                  {msg.isMe && <CheckCheck className="h-3 w-3" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Type safe encrypted message..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            className="btn-interactive rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors flex items-center space-x-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Masked Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-3xl bg-white p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center animate-fade-in-up">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <PhoneCall className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Virtual Masked Call Bridge</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dialing via ZEXO Privacy Bridge. Your personal phone number remains 100% hidden.
            </p>

            <div className="my-5 rounded-2xl bg-slate-900 p-4 text-white">
              <span className="text-[10px] text-slate-400 font-mono block uppercase">Virtual Relay Number</span>
              <span className="text-lg font-mono font-black text-cyan-400">+1 (800) ZEXO-BRIDGE</span>
              <span className="text-[10px] text-emerald-400 block mt-1">Status: Connecting Virtual Trunk...</span>
            </div>

            <button
              onClick={() => setShowCallModal(false)}
              className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              End Call Simulator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
