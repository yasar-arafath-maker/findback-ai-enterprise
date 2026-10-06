import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, EyeOff, Database, FileText, Mail, Server, Smartphone, Key, CheckCircle2, UserCheck } from 'lucide-react';
import Brand from './Brand';

export default function PrivacyPolicy() {
  const lastUpdated = "October 6, 2026";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <Brand className="h-8 w-auto" />
            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              FindBack AI
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Banner Section */}
        <div className="relative rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 p-8 border border-indigo-500/20 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Zero-Knowledge & Privacy-First Architecture</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Privacy Policy & Data Protection Statement
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              At FindBack AI Enterprise, we protect your personal identity, location data, and ownership proof with enterprise-grade encryption, zero-knowledge evidence isolation, and privacy-masked relay networks.
            </p>
            <div className="text-xs font-mono text-slate-400 pt-2 flex items-center gap-4">
              <span>Effective Date: <strong>{lastUpdated}</strong></span>
              <span>•</span>
              <span>Version: <strong>1.5.0</strong></span>
            </div>
          </div>
        </div>

        {/* Core Privacy Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-colors space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100">RLS Evidence Isolation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ownership proof, lockscreen photos, and invoices are strictly restricted via Row-Level Security (RLS) so finders can never view your private files.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition-colors space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100">Masked Relay Chat & Calls</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Finders and owners communicate through privacy-masked virtual phone trunks and encrypted messaging without revealing personal contact details.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-colors space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100">Cryptographic SHA-256 Logs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Item handovers are cryptographically signed and recorded with SHA-256 hashes to guarantee complete auditability and prevent fraud.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed border-t border-slate-800/80 pt-8">

          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
              <FileText className="w-5 h-5" />
              <h2>1. Information We Collect</h2>
            </div>
            <p className="text-slate-300">
              To operate the AI-driven lost and found matching service, we collect minimal data required to pair owners with their items accurately:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-400">
              <li><strong className="text-slate-200">Account Credentials:</strong> Email address, user name, hashed passwords, and a 6-character recovery security key created at registration.</li>
              <li><strong className="text-slate-200">Item Reports:</strong> Title, category, brand, color, serial numbers, photos, and item description.</li>
              <li><strong className="text-slate-200">Geospatial Data:</strong> Approximate or exact GPS coordinates where items were lost or found to calculate spatial proximity matching via the Haversine algorithm.</li>
              <li><strong className="text-slate-200">Verification Evidence:</strong> Uploaded proof of ownership (e.g., invoices, lockscreen wallpapers, purchase receipts) submitted strictly during claim processing.</li>
              <li><strong className="text-slate-200">Device & Telemetry Data:</strong> App version, operating system, network connectivity status, and native camera/geolocation permission flags.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
              <Server className="w-5 h-5" />
              <h2>2. How We Use Your Information</h2>
            </div>
            <p className="text-slate-300">
              Collected information is processed strictly for automated item recovery operations:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                <h4 className="font-semibold text-xs text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> SimHash Text Fingerprinting
                </h4>
                <p className="text-xs text-slate-400">
                  Generates 64-bit cryptographic text signatures of item descriptions to detect duplicate reports automatically.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                <h4 className="font-semibold text-xs text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Gemini AI Vision Processing
                </h4>
                <p className="text-xs text-slate-400">
                  Extracts feature vector embeddings from item photos to match lost and found items visually.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                <h4 className="font-semibold text-xs text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Spatial & Temporal Decay Scoring
                </h4>
                <p className="text-xs text-slate-400">
                  Combines distance calculation (GPS) and elapsed time decay to rank high-confidence potential matches.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                <h4 className="font-semibold text-xs text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Secure Handover Finality
                </h4>
                <p className="text-xs text-slate-400">
                  Issues 6-digit OTP verification codes and SHA-256 digital certificates upon physical item recovery.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
              <Lock className="w-5 h-5" />
              <h2>3. Zero-Knowledge Evidence & RLS Rules</h2>
            </div>
            <p className="text-slate-300">
              We enforce strict data isolation protocols:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-400">
              <li><strong>Row-Level Security (RLS):</strong> Ownership evidence uploaded by claimants is accessible ONLY by system administrators reviewing the claim. Finders cannot view claimant evidence.</li>
              <li><strong>Serial Number Redaction:</strong> Sensitive serial numbers on item cards are automatically blurred in public lists to prevent opportunistic false claims.</li>
              <li><strong>Encrypted Transport & Storage:</strong> Data in transit is secured via TLS 1.3 / HTTPS. Password verification keys are hashed using industry standard SHA-256 salted algorithms.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
              <Smartphone className="w-5 h-5" />
              <h2>4. Third-Party Integrations & Infrastructure</h2>
            </div>
            <p className="text-slate-300">
              FindBack AI Enterprise operates on secure cloud infrastructure partners:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-400">
              <li><strong>Database Hosting:</strong> Supabase PostgreSQL (Hosted in secure AWS AP-Northeast datacenter clusters).</li>
              <li><strong>AI Vision Model:</strong> Google Cloud Gemini API (Used solely for feature tagging and similarity matrix generation).</li>
              <li><strong>Transactional Mail:</strong> Brevo SMTP Services (For sending OTP verification codes and handover notifications).</li>
            </ul>
            <p className="text-xs text-slate-400 italic pt-1">
              * We never sell, rent, or trade personal information to advertisers or commercial third parties.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
              <UserCheck className="w-5 h-5" />
              <h2>5. Your Rights & Account Deletion</h2>
            </div>
            <p className="text-slate-300">
              You maintain full control over your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-400">
              <li><strong>Access & Modify:</strong> You can review, update, or edit your profile details at any time in the Profile section.</li>
              <li><strong>Report Deletion:</strong> You can mark reports as resolved or delete active item listings directly.</li>
              <li><strong>Account Purge:</strong> You may request complete deletion of your account and associated records by emailing support at <a href="mailto:yasararafath.tech@gmail.com" className="text-indigo-400 hover:underline">yasararafath.tech@gmail.com</a>.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
              <Mail className="w-5 h-5" />
              <h2>6. Contact & Support Information</h2>
            </div>
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <p className="text-slate-200 font-medium text-sm">
                FindBack AI Enterprise Team & Technical Contact:
              </p>
              <div className="text-xs text-slate-400 space-y-1">
                <p>• <strong>Primary Developer Email:</strong> <a href="mailto:yasararafath.tech@gmail.com" className="text-indigo-400 hover:underline">yasararafath.tech@gmail.com</a></p>
                <p>• <strong>Technical Support Contact:</strong> godfrey.cs23@krct.ac.in</p>
                <p>• <strong>Address:</strong> Tamil Nadu, India</p>
                <p>• <strong>Web Application:</strong> <a href="https://findbac.onrender.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">https://findbac.onrender.com</a></p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 pt-8 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 FindBack AI Enterprise. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
            <span>•</span>
            <Link to="/login" className="hover:text-slate-300 transition-colors">Login</Link>
            <span>•</span>
            <Link to="/register" className="hover:text-slate-300 transition-colors">Register</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
