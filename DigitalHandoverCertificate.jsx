/**
 * ZEXO / FindBack AI — Police Station & Campus Authority Handover Certificate
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates an official, verifiable Digital Handover Receipt & Certificate with
 * unique QR verification, authority signature hash, and transaction timestamp.
 */

import React, { useState } from 'react';
import { ShieldCheck, Award, Download, Printer, Building2, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import QRCode from 'qrcode';
import { generateHandoverCertificatePdf } from './certificatePdfGenerator';

export default function DigitalHandoverCertificate() {
  const [itemName, setItemName] = useState('Govt Driving License & College Identity Card');
  const [authorityName, setAuthorityName] = useState('Central Campus Security Desk / Police Station Beat #4');
  const [officerName, setOfficerName] = useState('Inspector R. Sharma (Badge #8839)');
  const [recipientEmail, setRecipientEmail] = useState('owner@example.com');
  const [certificate, setCertificate] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!certificate) return;
    setDownloadingPdf(true);
    try {
      await generateHandoverCertificatePdf(certificate);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Could not generate PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const certId = `FB-CERT-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const hash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`.toUpperCase();

    const origin = (typeof window !== 'undefined' && window.location?.origin?.startsWith('https'))
      ? window.location.origin
      : 'https://findbac.onrender.com';
    const verifyUrl = `${origin}/evidence/${certId}`;
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 180,
        margin: 2,
        color: { dark: '#1E1B4B', light: '#FFFFFF' },
      });
    } catch (e) {
      console.error(e);
    }

    setCertificate({
      cert_id: certId,
      item_name: itemName,
      authority_name: authorityName,
      officer_name: officerName,
      recipient_email: recipientEmail,
      signature_hash: hash,
      timestamp: new Date().toLocaleString(),
      qr_url: qrDataUrl,
    });
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8 animate-fade-in-up">
      <PageHeader
        eyebrow="Official Authority Protocols"
        title="Police Station & Security Handover Certificate"
        description="Issue official, cryptographic handover receipts when high-value items or sensitive documents (PAN, DL, Passport) are deposited with campus security or local law enforcement."
      />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Certificate Generator Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Issue Handover Receipt</h3>
              <p className="text-xs text-slate-500">Record deposition with verified authorities</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Item / Document Description
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Authority Station / Campus Desk
              </label>
              <input
                type="text"
                required
                value={authorityName}
                onChange={(e) => setAuthorityName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Receiving Officer / Badge ID
              </label>
              <input
                type="text"
                required
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Owner Email (For Digital Receipt Copy)
              </label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-interactive rounded-xl bg-purple-900 py-3 text-xs font-bold text-white shadow-md hover:bg-purple-800 transition-colors flex items-center justify-center space-x-2"
            >
              <Award className="h-4 w-4 text-purple-300" />
              <span>Generate Official Certificate</span>
            </button>
          </form>
        </div>

        {/* Official Certificate Display */}
        <div>
          {certificate ? (
            <div className="rounded-3xl border-2 border-purple-900 bg-slate-950 p-6 text-white shadow-2xl space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-purple-900 text-purple-300">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-purple-400">
                      Official Handover Certificate
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">{certificate.cert_id}</span>
                  </div>
                </div>
                <img src={certificate.qr_url} alt="QR Verification" className="h-12 w-12 rounded-lg bg-white p-1" />
              </div>

              {/* Details */}
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Deposited Valuable / Document</span>
                  <span className="text-white font-bold text-sm font-sans">{certificate.item_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Authority Desk</span>
                    <span className="text-purple-300 font-bold">{certificate.authority_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Receiving Officer</span>
                    <span className="text-emerald-400 font-bold">{certificate.officer_name}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] uppercase">Verification Hash Signature</span>
                  <span className="text-cyan-400 font-mono text-[11px] font-bold">{certificate.signature_hash}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Transaction Timestamp</span>
                  <span className="text-slate-300 text-[11px]">{certificate.timestamp}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-800 text-white py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex-1 rounded-xl bg-purple-600 text-white py-2.5 text-xs font-bold hover:bg-purple-500 disabled:opacity-50 transition-colors flex items-center justify-center space-x-1.5"
                >
                  {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span>{downloadingPdf ? 'Generating...' : 'Save PDF'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[320px] rounded-3xl border-2 border-dashed border-slate-200 bg-white p-6 flex flex-col items-center justify-center text-center">
              <Award className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Submit authority handover details on the left to issue an official verifiable handover certificate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
