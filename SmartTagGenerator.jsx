/**
 * ZEXO / FindBack AI — Smart QR Code & Valuables Tag Generator
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates digital QR tags for personal valuables (Laptops, Keys, Bags).
 * Anyone scanning the tag is routed to an anonymous web relay to contact owner safely.
 */

import React, { useState } from 'react';
import { QrCode, Shield, Download, Sparkles, Check, Send, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function SmartTagGenerator() {
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Electronics');
  const [ownerNote, setOwnerNote] = useState('If found, please scan this code or use ZEXO relay to return safely. Reward promised!');
  const [generatedTag, setGeneratedTag] = useState(null);
  const [relayMessage, setRelayMessage] = useState('');
  const [relaySent, setRelaySent] = useState(false);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!itemName) return;
    const tagId = `ZEXO-TAG-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedTag({
      tag_id: tagId,
      item_name: itemName,
      category: itemCategory,
      note: ownerNote,
      created_at: new Date().toISOString(),
      qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://zexo.app/tag/${tagId}`,
    });
  };

  const handleSimulateScanRelay = (e) => {
    e.preventDefault();
    if (!relayMessage) return;
    setRelaySent(true);
    setTimeout(() => {
      setRelaySent(false);
      setRelayMessage('');
    }, 4000);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8 animate-fade-in-up">
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
                placeholder="e.g. MacBook Pro 16'' / College Key Ring"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-interactive rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
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
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Anonymous Relay Active
              </span>
            </div>

            {generatedTag ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-white rounded-2xl shadow-md mb-3">
                    <img src={generatedTag.qr_url} alt="QR Code Tag" className="h-36 w-36 object-contain" />
                  </div>
                  <span className="font-mono text-sm font-black text-blue-600">{generatedTag.tag_id}</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{generatedTag.item_name}</h4>
                  <p className="text-xs text-slate-500 italic mt-2">"{generatedTag.note}"</p>
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
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-bold flex items-center gap-2">
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
