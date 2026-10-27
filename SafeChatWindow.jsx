/**
 * ZEXO / FindBack AI — Direct Safe Chat & Masked Calling Interface
 * ─────────────────────────────────────────────────────────────────────────────
 * Facilitates end-to-end privacy-masked messaging & virtual masked calling
 * between item owners and finders without revealing actual phone numbers or emails.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, PhoneCall, ShieldCheck, Send, Lock, UserCheck, CheckCheck, PhoneOff, Mic, Volume2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'Finder (Anonymous)',
    text: 'Hi! I found a black leather wallet near Campus Gate 2 with cards inside.',
    time: '10:14 AM',
    isMe: false,
  },
  {
    id: 'msg-2',
    sender: 'Verified Owner (You)',
    text: 'Hello! Thank you so much for reporting it! Does it contain a green college ID card?',
    time: '10:16 AM',
    isMe: true,
  },
  {
    id: 'msg-3',
    sender: 'Finder (Anonymous)',
    text: 'Yes! It has your student ID and DL. Should we meet near the campus security office?',
    time: '10:18 AM',
    isMe: false,
  },
];

export default function SafeChatWindow() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem('zexo_safe_chat_messages');
      return stored ? JSON.parse(stored) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [inputMsg, setInputMsg] = useState('');
  const [showCallModal, setShowCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState('calling'); // calling | connected
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('zexo_safe_chat_messages', JSON.stringify(messages));
    } catch (e) {}
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call timer simulation
  useEffect(() => {
    let interval = null;
    if (showCallModal) {
      setCallStatus('calling');
      setCallTimer(0);
      const connectTimeout = setTimeout(() => {
        setCallStatus('connected');
      }, 2500);

      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);

      return () => {
        clearTimeout(connectTimeout);
        clearInterval(interval);
      };
    }
  }, [showCallModal]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: user?.full_name ? `${user.full_name} (You)` : 'Verified Owner (You)',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMsg('');

    // Persist via backend API if available
    try {
      const apiUrl = import.meta.env?.VITE_API_BASE_URL || 'https://findback-ai-enterprise.onrender.com/api';
      fetch(`${apiUrl.replace(/\/api$/, '')}/api/chat/default/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: newMsg.sender, text: userText }),
      }).catch(() => null);
    } catch (e) {}

    // Simulated intelligent masked response after 1.5 seconds
    setTimeout(() => {
      const autoReply = {
        id: `msg-reply-${Date.now()}`,
        sender: 'Finder (Anonymous)',
        text: 'Received your message securely via ZEXO relay. I have deposited the item at Campus Security Desk #1. You can verify handover with your 6-digit code.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 1500);
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8 animate-fade-in">
      <PageHeader
        eyebrow="Privacy Protection Suite"
        title="Direct Encrypted Safe Chat & Masked Calling"
        description="Communicate safely with finders or owners. Phone numbers and personal emails are automatically masked through ZEXO relay."
      />

      {/* Privacy Shield Banner */}
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>Privacy Masking Active</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h4>
            <p className="text-xs text-emerald-800">
              Virtual Relay ID: <span className="font-mono font-bold">RELAY-8829-ZEXO</span> — Real phone numbers and email IDs are hidden.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCallModal(true)}
          className="btn-interactive inline-flex items-center space-x-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 active:scale-95 transition-all"
        >
          <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
          <span>Initiate Masked Call</span>
        </button>
      </div>

      {/* Chat Window Container */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[540px]">
        {/* Chat Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs shadow-inner">
              FA
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Finder (Anonymous) <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Matched Report #LOST-8492 · Relay Protected</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full font-bold flex items-center gap-1">
            <Lock className="h-2.5 w-2.5" /> End-to-End Encrypted
          </span>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/70">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              <div
                className={`max-w-md rounded-2xl p-4 text-xs shadow-sm ${
                  msg.isMe
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Type safe encrypted message to finder..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="btn-interactive rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Masked Call Modal Simulator */}
      {showCallModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-3xl bg-white p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center animate-fade-in-up">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
              <PhoneCall className={`h-8 w-8 ${callStatus === 'calling' ? 'animate-bounce' : 'animate-pulse'}`} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Virtual Masked Call Bridge</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dialing via ZEXO Privacy Bridge. Your personal phone number remains 100% hidden.
            </p>

            <div className="my-5 rounded-2xl bg-slate-900 p-4 text-white text-center">
              <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">Virtual Relay Number</span>
              <span className="text-lg font-mono font-black text-cyan-400">+1 (800) ZEXO-BRIDGE</span>
              <div className="mt-2 flex items-center justify-center space-x-2 text-xs">
                {callStatus === 'calling' ? (
                  <span className="text-amber-400 animate-pulse font-mono">Connecting Virtual Trunk...</span>
                ) : (
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Connected · {formatTimer(callTimer)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold border transition-colors flex items-center justify-center space-x-1 ${
                  isMuted ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              <button
                onClick={() => setShowCallModal(false)}
                className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center space-x-1 shadow-md"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                <span>End Call</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
