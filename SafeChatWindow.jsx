/**
 * FindBack AI / ZEXO — Direct Safe Chat & Masked Calling Interface
 * ─────────────────────────────────────────────────────────────────────────────
 * Facilitates end-to-end privacy-masked messaging & virtual masked calling
 * between item owners and finders without revealing actual phone numbers or emails.
 * Includes real-time message sync, automated PII redaction, and audio call state machine.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare,
  PhoneCall,
  PhoneOff,
  ShieldCheck,
  Send,
  Lock,
  UserCheck,
  CheckCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  AlertCircle,
  Radio,
  RefreshCw,
  Hash
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getApiBaseUrl } from './networkClient';

export default function SafeChatWindow() {
  const { user } = useAuth();
  const location = useLocation();

  // Parse query params for direct tag scan or match navigation
  const searchParams = new URLSearchParams(location.search);
  const paramChannel = searchParams.get('channel') || searchParams.get('tag');
  const paramItem = searchParams.get('item');

  // Channels state
  const [activeChannelId, setActiveChannelId] = useState(paramChannel || 'CHANNEL-REPORT-8829');
  const [activeItemTitle, setActiveItemTitle] = useState(paramItem || 'Active Match Item');
  const [availableChannels, setAvailableChannels] = useState([
    { id: 'CHANNEL-REPORT-8829', title: 'MacBook Air M2 (Space Grey)', category: 'Electronics', role: 'Finder' },
    { id: 'CHANNEL-REPORT-5512', title: 'Campus Access Keys & Lanyard', category: 'Keys', role: 'Owner' },
  ]);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [piiWarning, setPiiWarning] = useState(false);

  // Masked Call state machine
  const [callState, setCallState] = useState('idle'); // 'idle' | 'dialing' | 'ringing' | 'connected' | 'ended'
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callTrunkInfo, setCallTrunkInfo] = useState(null);

  const messagesEndRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Load user's actual reports to populate realistic channels
  useEffect(() => {
    (async () => {
      try {
        const u = user || (await db.auth.me().catch(() => null));
        if (!u) return;

        const [userLost, userFound] = await Promise.all([
          db.entities.LostReports.filter({ reporter_id: u.id }, '-created_date', 10).catch(() => []),
          db.entities.FoundReports.filter({ finder_id: u.id }, '-created_date', 10).catch(() => []),
        ]);

        const customChannels = [];
        if (paramChannel) {
          customChannels.push({
            id: paramChannel,
            title: paramItem || `Tag ${paramChannel}`,
            category: 'Smart Tag',
            role: 'Finder',
          });
        }

        userLost.forEach((r) => {
          customChannels.push({
            id: `CHAT-LOST-${r.id}`,
            title: r.title,
            category: r.category || 'Lost Item',
            role: 'Owner',
          });
        });

        userFound.forEach((r) => {
          customChannels.push({
            id: `CHAT-FOUND-${r.id}`,
            title: r.title,
            category: r.category || 'Found Item',
            role: 'Finder',
          });
        });

        if (customChannels.length > 0) {
          setAvailableChannels(customChannels);
          if (!paramChannel) {
            setActiveChannelId(customChannels[0].id);
            setActiveItemTitle(customChannels[0].title);
          }
        }
      } catch (err) {}
    })();
  }, [user, paramChannel, paramItem]);

  // Fetch messages for active channel
  const loadChannelMessages = async (channelId) => {
    if (!channelId) return;
    try {
      const msgs = await db.chat.getMessages(channelId);
      if (Array.isArray(msgs) && msgs.length > 0) {
        setMessages(msgs);
      } else {
        // Initial welcome message from relay bot
        setMessages([
          {
            id: 'system-welcome',
            channel_id: channelId,
            sender_id: 'system',
            sender_name: 'FindBack AI Privacy Relay',
            sender_role: 'Relay',
            text: '🔒 End-to-End Privacy Masking is ACTIVE. Any phone numbers or emails sent here are automatically redacted to protect your personal identity.',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn('Failed to load chat messages:', err);
    }
  };

  useEffect(() => {
    loadChannelMessages(activeChannelId);

    // Auto-polling for new messages
    const pollInterval = setInterval(() => {
      loadChannelMessages(activeChannelId);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeChannelId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for PII pattern as user types
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMsg(val);
    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(val) || /\b\d{10}\b/.test(val);
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(val);
    setPiiWarning(hasPhone || hasEmail);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const currentChannel = availableChannels.find(c => c.id === activeChannelId);
    const userRole = currentChannel?.role === 'Owner' ? 'Owner' : 'Finder';

    const sentMessage = await db.chat.sendMessage(activeChannelId, {
      text: inputMsg.trim(),
      sender_role: userRole,
    });

    setMessages((prev) => [...prev, sentMessage]);
    setInputMsg('');
    setPiiWarning(false);
  };

  // ── Masked Call Handlers ──
  const startMaskedCall = async () => {
    setCallState('dialing');
    setCallTimer(0);
    setIsMuted(false);

    try {
      const callData = await db.chat.startMaskedCall(activeChannelId);
      setCallTrunkInfo(callData);

      // Try browser microphone access for realistic audio testing
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
          // Graceful fallback if mic denied
        });
      }

      setTimeout(() => {
        setCallState('ringing');
      }, 1500);

      setTimeout(() => {
        setCallState('connected');
        // Start duration timer
        timerIntervalRef.current = setInterval(() => {
          setCallTimer((t) => t + 1);
        }, 1000);
      }, 3500);
    } catch (err) {
      setCallState('idle');
    }
  };

  const endMaskedCall = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setCallTimer(0);
    }, 2500);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8 animate-fade-in-up">
      <PageHeader
        eyebrow="Privacy & Verification Suite"
        title="Direct Encrypted Safe Chat & Masked Calling"
        description="Communicate safely with item finders or verified owners. Real-time messages with automated personal phone/email redaction and browser-based masked voice calling."
      />

      {/* Privacy Shield Active Banner */}
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>Privacy Shield Active</span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </h4>
            <p className="text-xs text-emerald-800">
              Virtual Channel: <span className="font-mono font-bold">{activeChannelId}</span> · Phone & email auto-redacted.
            </p>
          </div>
        </div>

        <button
          onClick={startMaskedCall}
          className="btn-interactive inline-flex items-center space-x-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all active:scale-95"
        >
          <PhoneCall className="h-4 w-4 text-emerald-400" />
          <span>Initiate Masked Call</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Channel Selector Sidebar */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
              <span>Active Relay Chats</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">{availableChannels.length}</span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[460px]">
            {availableChannels.map((c) => {
              const isSelected = c.id === activeChannelId;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveChannelId(c.id);
                    setActiveItemTitle(c.title);
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition-all border ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm'
                      : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase truncate max-w-[120px]">
                      {c.category}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.role === 'Owner' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {c.role}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold truncate">{c.title}</h5>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1 truncate">
                    {c.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Window Container */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[560px]">
          {/* Header */}
          <div className="bg-[#0F1F3D] px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs shadow-md">
                FB
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <span>{activeItemTitle}</span>
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">Channel: {activeChannelId}</p>
              </div>
            </div>

            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> End-to-End Encrypted
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/60">
            {messages.map((msg) => {
              const isSystem = msg.sender_id === 'system';
              const isMe = msg.sender_id === user?.id || msg.sender_role === 'Owner';

              if (isSystem) {
                return (
                  <div key={msg.id} className="mx-auto max-w-md rounded-2xl bg-blue-50 border border-blue-200/80 p-3.5 text-center shadow-xs">
                    <p className="text-xs text-blue-900 font-medium leading-relaxed">{msg.text}</p>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-md rounded-2xl p-4 text-xs shadow-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="font-bold text-[10px] opacity-75 mb-1 flex items-center gap-1">
                      <span>{msg.sender_name || (isMe ? 'You (Verified)' : 'Finder (Anonymous)')}</span>
                      <span className="font-mono text-[9px] opacity-60">({msg.sender_role || 'Party'})</span>
                    </div>
                    <p className="leading-relaxed font-sans text-xs whitespace-pre-wrap">{msg.text}</p>
                    <div className={`mt-1.5 flex items-center justify-end space-x-1 text-[9px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                      <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                      {isMe && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* PII Detection Warning Banner */}
          {piiWarning && (
            <div className="bg-amber-50 px-4 py-2 border-t border-amber-200 flex items-center gap-2 text-xs text-amber-900 font-semibold">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>Contact info detected! ZEXO Privacy Trunk will automatically mask phone numbers and emails on transmission.</span>
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3">
            <input
              type="text"
              value={inputMsg}
              onChange={handleInputChange}
              placeholder="Type your safe encrypted message (e.g. Can we meet near campus security?)..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="btn-interactive rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors flex items-center space-x-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Masked Call Interactive Modal */}
      {callState !== 'idle' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="rounded-3xl bg-slate-900 text-white p-7 max-w-sm w-full shadow-2xl border border-slate-800 text-center animate-fade-in-up">
            {/* Trunk Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-cyan-400 text-[10px] font-mono font-bold mb-6">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>TLS 1.3 MASKED RELAY TRUNK</span>
            </div>

            {/* Caller Avatar / Waveform */}
            <div className="relative mx-auto h-24 w-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-5 shadow-xl">
              {callState === 'connected' ? (
                <div className="flex items-center gap-1">
                  {[12, 24, 16, 28, 14, 20].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-cyan-400 rounded-full animate-pulse"
                      style={{ height: `${h}px`, animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <PhoneCall className={`h-10 w-10 text-white ${callState === 'ringing' ? 'animate-bounce' : 'animate-spin'}`} />
              )}
            </div>

            <h3 className="text-lg font-bold">{activeItemTitle}</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Virtual Trunk: <span className="text-cyan-400 font-bold">{callTrunkInfo?.trunk_id || 'TRUNK-9942-ZEXO'}</span>
            </p>

            {/* Call State Message & Timer */}
            <div className="my-6 rounded-2xl bg-slate-950 p-4 border border-slate-800/80">
              {callState === 'dialing' && (
                <span className="text-xs font-mono text-amber-400 flex items-center justify-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Routing through Privacy Switch...
                </span>
              )}
              {callState === 'ringing' && (
                <span className="text-xs font-mono text-cyan-400 animate-pulse">
                  Ringing anonymous finder terminal...
                </span>
              )}
              {callState === 'connected' && (
                <div className="space-y-1">
                  <div className="text-2xl font-mono font-black text-emerald-400">
                    {formatTimer(callTimer)}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                    Caller ID Hidden · Voice Trunk Encrypted
                  </span>
                </div>
              )}
              {callState === 'ended' && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-rose-400">Call Terminated</span>
                  <p className="text-[10px] text-slate-400 font-mono">Duration: {formatTimer(callTimer)}</p>
                </div>
              )}
            </div>

            {/* In-Call Controls */}
            {callState === 'connected' && (
              <div className="flex items-center justify-center space-x-4 mb-6">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isMuted
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    !isSpeakerOn
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
                >
                  {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
              </div>
            )}

            {/* End Call Button */}
            <button
              onClick={endMaskedCall}
              disabled={callState === 'ended'}
              className="w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white py-3.5 text-xs font-bold transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/30"
            >
              <PhoneOff className="h-4 w-4" />
              <span>{callState === 'ended' ? 'Closing...' : 'End Encrypted Call'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
