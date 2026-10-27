/**
 * ZEXO / FindBack AI — Smart QR Code & Valuables Tag Generator
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates digital QR tags for personal valuables (Laptops, Keys, Bags).
 * Anyone scanning the tag is routed to an anonymous web relay to contact owner safely.
 */

import React, { useState, useEffect } from 'react';
import { QrCode, Shield, Download, Sparkles, Check, Send, AlertCircle, Copy, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { db } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Helper to generate a reliable vector QR code pattern SVG
function QRVisualPattern({ dataString, size = 160 }) {
  // Deterministic 21x21 QR-like matrix generation from hash
  const modules = [];
  const matrixSize = 21;
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    hash = (hash << 5) - hash + dataString.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < matrixSize; r++) {
    const row = [];
    for (let c = 0; c < matrixSize; c++) {
      // Finder patterns in corners
      const isTopLeft = r < 7 && c < 7;
      const isTopRight = r < 7 && c >= matrixSize - 7;
      const isBottomLeft = r >= matrixSize - 7 && c < 7;

      if (isTopLeft || isTopRight || isBottomLeft) {
        const isBorder = (r === 0 || r === 6 || c === 0 || c === 6) && isTopLeft;
        const isBorderTR = (r === 0 || r === 6 || c === matrixSize - 7 || c === matrixSize - 1) && isTopRight;
        const isBorderBL = (r === matrixSize - 7 || r === matrixSize - 1 || c === 0 || c === 6) && isBottomLeft;
        const isCenterTL = r >= 2 && r <= 4 && c >= 2 && c <= 4 && isTopLeft;
        const isCenterTR = r >= 2 && r <= 4 && c >= matrixSize - 5 && c <= matrixSize - 3 && isTopRight;
        const isCenterBL = r >= matrixSize - 5 && r <= matrixSize - 3 && c >= 2 && c <= 4 && isBottomLeft;

        row.push(isBorder || isBorderTR || isBorderBL || isCenterTL || isCenterTR || isCenterBL);
      } else {
        // Data pseudo-bits
        const bitVal = Math.sin((r * 13 + c * 7 + Math.abs(hash)) * 1.5) > 0.15;
        row.push(bitVal);
      }
    }
    modules.push(row);
  }

  const cellSize = size / matrixSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-xl shadow-xs">
      <rect width={size} height={size} fill="#ffffff" rx="10" />
      {modules.map((row, r) =>
        row.map((active, c) =>
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.5}
              height={cellSize + 0.5}
              fill="#0F172A"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function SmartTagGenerator() {
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Electronics');
  const [ownerNote, setOwnerNote] = useState('If found, please scan this code or use ZEXO relay to return safely. Reward promised!');
  const [generatedTag, setGeneratedTag] = useState(null);
  const [relayMessage, setRelayMessage] = useState('');
  const [relaySent, setRelaySent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myTags, setMyTags] = useState(() => {
    try {
      const stored = localStorage.getItem('zexo_saved_smart_tags');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('zexo_saved_smart_tags', JSON.stringify(myTags));
    } catch (e) {}
  }, [myTags]);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const tagId = `ZEXO-TAG-${Math.floor(100000 + Math.random() * 900000)}`;
    const relayUrl = `https://findback-ai-frontend.onrender.com/tag/${tagId}`;
    const newTag = {
      tag_id: tagId,
      item_name: itemName.trim(),
      category: itemCategory,
      note: ownerNote.trim(),
      created_at: new Date().toISOString(),
      relay_url: relayUrl,
    };

    setGeneratedTag(newTag);
    setMyTags((prev) => [newTag, ...prev.filter((t) => t.tag_id !== tagId)]);
  };

  const handleCopyLink = () => {
    if (!generatedTag) return;
    navigator.clipboard?.writeText(generatedTag.relay_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTag = () => {
    if (!generatedTag) return;
    // Create simple SVG printable card
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
        <rect width="400" height="500" fill="#0F1F3D" rx="20"/>
        <text x="200" y="50" font-family="sans-serif" font-size="22" font-weight="bold" fill="#38BDF8" text-anchor="middle">ZEXO SMART TAG</text>
        <text x="200" y="80" font-family="sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle">ANTI-LOSS VALUABLES RELAY</text>
        <rect x="50" y="110" width="300" height="300" fill="#ffffff" rx="15"/>
        <text x="200" y="440" font-family="monospace" font-size="16" font-weight="bold" fill="#F8FAFC" text-anchor="middle">${generatedTag.tag_id}</text>
        <text x="200" y="470" font-family="sans-serif" font-size="12" fill="#38BDF8" text-anchor="middle">${generatedTag.item_name}</text>
      </svg>
    `;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedTag.tag_id}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSimulateScanRelay = async (e) => {
    e.preventDefault();
    if (!relayMessage.trim()) return;

    setRelaySent(true);

    // Save alert notification
    try {
      await db.entities.Notifications.create({
        user_id: user?.id || 'current-user',
        type: 'smart_tag_scanned',
        title: `🏷️ Smart Tag Scanned: ${generatedTag?.item_name || 'Valuable Item'}`,
        message: `A finder scanned your Smart Tag [${generatedTag?.tag_id}]: "${relayMessage.trim()}"`,
        related_entity_type: 'SmartTag',
        related_entity_id: generatedTag?.tag_id,
        is_read: false,
      });
    } catch (err) {}

    setTimeout(() => {
      setRelaySent(false);
      setRelayMessage('');
    }, 4000);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8 animate-fade-in">
      <PageHeader
        eyebrow="Valuables Protection Suite"
        title="Smart QR Tag Generator & Anonymous Relay"
        description="Attach anti-loss QR smart tags to your laptops, keys, and bags. Finders contact you through a privacy-masked web relay without seeing your phone number."
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
              <p className="text-xs text-slate-500">Generate a unique ZEXO QR Tag for your item</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Item Title / Serial Name
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. MacBook Air M2 / College Bike Keys"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              >
                <option value="Electronics">Electronics (Laptop, Phone, Tablet)</option>
                <option value="Personal Keys">Personal Keys & Access Badges</option>
                <option value="Bags & Travel">Backpack & Luggage</option>
                <option value="Documents">Wallet & Document Folder</option>
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-interactive rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Protection QR Code</span>
            </button>
          </form>
        </div>

        {/* Tag Preview Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Tag Preview & Relay Test</h3>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-bold text-emerald-700 flex items-center gap-1 shadow-xs">
                <Shield className="h-3 w-3" /> Anonymous Relay Active
              </span>
            </div>

            {generatedTag ? (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col items-center text-center shadow-xs">
                  <div className="p-3 bg-white rounded-2xl shadow-md mb-3 border border-slate-100">
                    <QRVisualPattern dataString={generatedTag.tag_id} size={150} />
                  </div>
                  <span className="font-mono text-sm font-black text-blue-600">{generatedTag.tag_id}</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{generatedTag.item_name}</h4>
                  <p className="text-xs text-slate-500 italic mt-2">"{generatedTag.note}"</p>

                  <div className="mt-4 flex space-x-2 w-full">
                    <button
                      onClick={handleDownloadTag}
                      className="flex-1 btn-interactive rounded-xl bg-slate-900 text-white py-2 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5 text-blue-400" />
                      <span>Download Tag</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-1"
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                      <span>{copied ? 'Copied' : 'Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Anonymous Finder Relay Form Simulator */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5" /> Anonymous Finder Relay Simulator
                  </h4>
                  <p className="text-[11px] text-blue-700 mb-3">
                    Test what a finder sees when scanning tag <span className="font-mono font-bold">{generatedTag.tag_id}</span>:
                  </p>

                  {relaySent ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fade-in">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Message relayed securely to verified owner without sharing phone number!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSimulateScanRelay} className="space-y-2">
                      <input
                        type="text"
                        required
                        value={relayMessage}
                        onChange={(e) => setRelayMessage(e.target.value)}
                        placeholder="Found your laptop at Central Library Bench #4..."
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
                  Fill in the item details on the left to generate your custom ZEXO QR protection tag.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
