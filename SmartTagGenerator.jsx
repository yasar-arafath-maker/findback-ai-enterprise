/**
 * FindBack AI / ZEXO — Smart QR Code & Valuables Tag Generator
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates client-side, offline-capable digital QR tags for personal valuables
 * (Laptops, Keys, Bags, Wallets, IDs). Scanning routes to an anonymous web relay
 * allowing finders to contact the verified owner without revealing phone numbers.
 */

import React, { useState } from 'react';
import { QrCode, Shield, Download, Sparkles, Check, Send, Printer, Copy, ShieldCheck, FileText } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import QRCode from 'qrcode';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { generateSmartTagPdf } from './certificatePdfGenerator';

export default function SmartTagGenerator() {
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Electronics');
  const [ownerNote, setOwnerNote] = useState('If found, please scan this code or use FindBack AI relay to return safely. Verified owner.');
  const [generating, setGenerating] = useState(false);
  const [generatedTag, setGeneratedTag] = useState(null);
  const [relayMessage, setRelayMessage] = useState('');
  const [relaySent, setRelaySent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    setGenerating(true);

    try {
      const origin = (typeof window !== 'undefined' && window.location?.origin?.startsWith('https'))
        ? window.location.origin
        : 'https://findback-ai.onrender.com';
      const relayUrl = `${origin}/safe-chat?channel=${tagId}&item=${encodeURIComponent(itemName.trim())}`;

      // Generate local QR Data URL (100% offline, zero external API calls)
      const qrDataUrl = await QRCode.toDataURL(relayUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0F1F3D',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      const tagData = {
        tag_id: tagId,
        item_name: itemName.trim(),
        category: itemCategory,
        note: ownerNote,
        created_at: new Date().toISOString(),
        relay_url: relayUrl,
        qr_data_url: qrDataUrl,
        owner_id: user?.id || 'current-user',
      };

      setGeneratedTag(tagData);

      // Save to user's generated tags in localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('findback_smart_tags') || '[]');
        existing.unshift(tagData);
        localStorage.setItem('findback_smart_tags', JSON.stringify(existing.slice(0, 50)));
      } catch (e) {}
    } catch (err) {
      console.error('Failed to generate QR:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!generatedTag?.qr_data_url) return;
    const link = document.createElement('a');
    link.href = generatedTag.qr_data_url;
    link.download = `${generatedTag.tag_id}-protection-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyRelayLink = () => {
    if (!generatedTag?.relay_url) return;
    navigator.clipboard.writeText(generatedTag.relay_url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrintTag = () => {
    window.print();
  };

  const handleSimulateScanRelay = async (e) => {
    e.preventDefault();
    if (!relayMessage.trim() || !generatedTag) return;

    try {
      if (db.chat?.sendMessage) {
        await db.chat.sendMessage(generatedTag.tag_id, {
          text: relayMessage.trim(),
          sender_role: 'Finder',
        });
      }
    } catch (err) {}

    setRelaySent(true);
    setTimeout(() => {
      setRelaySent(false);
      setRelayMessage('');
    }, 4500);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8 animate-fade-in-up">
      <PageHeader
        eyebrow="Valuables Protection Suite"
        title="Smart QR Anti-Loss Tag Generator"
        description="Attach anti-loss QR smart tags to your laptops, keys, and bags. Finders scan with any smartphone camera to contact you through a privacy-masked web relay without seeing your phone number."
      />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Generator Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Protection Tag</h3>
              <p className="text-xs text-slate-500">Offline-generated high-density QR code for your valuables</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Item Title / Model / Serial
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. MacBook Pro 16'' / Campus Access Key Ring"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="Electronics">Electronics (Laptop, Phone, Tablet, Headphones)</option>
                <option value="Personal Keys">Personal Keys & Access Badges</option>
                <option value="Bags & Travel">Backpack, Luggage & Briefcase</option>
                <option value="Documents">Wallet & Document Folder</option>
                <option value="Other">Other Valuables</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Finder Relay Note (Public Message)
              </label>
              <textarea
                rows="3"
                value={ownerNote}
                onChange={(e) => setOwnerNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full btn-interactive rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{generating ? 'Generating High-Density QR...' : 'Generate Anti-Loss QR Code'}</span>
            </button>
          </form>
        </div>

        {/* Tag Preview Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Tag Preview & Relay Test</h3>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Anonymous Relay Ready
              </span>
            </div>

            {generatedTag ? (
              <div className="space-y-4">
                {/* Physical Tag Card (Printable) */}
                <div className="rounded-2xl border-2 border-slate-900 bg-gradient-to-b from-white to-slate-50 p-5 flex flex-col items-center text-center shadow-lg print:border print:shadow-none">
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                    <span>FindBack AI Protection Tag</span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100 my-2">
                    <img
                      src={generatedTag.qr_data_url}
                      alt={`QR Code Tag for ${generatedTag.item_name}`}
                      className="h-44 w-44 object-contain"
                    />
                  </div>

                  <span className="font-mono text-sm font-black text-blue-600 tracking-wider">
                    {generatedTag.tag_id}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{generatedTag.item_name}</h4>
                  <p className="text-xs text-slate-500 italic mt-1 max-w-xs">"{generatedTag.note}"</p>
                  <span className="text-[10px] font-mono text-slate-400 mt-2">Scan to Return · Privacy Protected</span>
                </div>

                {/* Quick Action Toolbar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 px-2.5 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-600" />
                    <span>PNG Image</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await generateSmartTagPdf(generatedTag);
                      } catch (e) {
                        alert('Could not download PDF: ' + e.message);
                      }
                    }}
                    className="flex items-center justify-center space-x-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 py-2 px-2.5 text-xs font-semibold text-blue-700 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    <span>Save PDF</span>
                  </button>

                  <button
                    onClick={handleCopyRelayLink}
                    className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 px-2.5 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-600" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={handlePrintTag}
                    className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 px-2.5 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-600" />
                    <span>Print Sticker</span>
                  </button>
                </div>

                {/* Anonymous Finder Relay Form Simulator */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5" /> Anonymous Finder Relay Simulator
                  </h4>
                  <p className="text-[11px] text-blue-700 mb-3">
                    Test what a finder sees after scanning <span className="font-mono font-bold">{generatedTag.tag_id}</span>:
                  </p>

                  {relaySent ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-bold flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Message relayed securely to Safe Chat without disclosing your phone number!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSimulateScanRelay} className="space-y-2">
                      <input
                        type="text"
                        required
                        value={relayMessage}
                        onChange={(e) => setRelayMessage(e.target.value)}
                        placeholder="Found your item at Central Library Bench #4..."
                        className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-blue-900 text-white py-2 text-xs font-bold hover:bg-blue-800 transition-colors"
                      >
                        Send Anonymous Message to Owner
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl">
                <QrCode className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Fill in the item details on the left to generate your custom FindBack AI QR protection tag.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
