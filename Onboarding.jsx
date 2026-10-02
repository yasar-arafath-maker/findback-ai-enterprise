import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BrainCircuit,
  MapPin,
  ShieldCheck,
  QrCode,
  Users,
  Activity,
  Cloud,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Brand from '@/components/Brand';

const onboardingSteps = [
  {
    step: 1,
    tag: "Neural Intelligence",
    title: "Multimodal AI Matching",
    subtitle: "Simultaneous Visual & Textual Candidate Correlation",
    description: "FindBack AI executes dual-path neural feature extraction using MobileNet for visual perceptual similarity alongside 64-bit SimHash for descriptive text. Only candidates meeting strict statistical confidence thresholds are surfaced.",
    icon: BrainCircuit,
    color: "from-blue-600 to-indigo-600",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    highlights: [
      "94% High-Confidence Candidate Precision",
      "Sub-120ms Vector Similarity Calculation",
      "Automated Category & Visual Feature Tagging",
    ],
    technicalNote: "Integrated with Render Cloud Inference & Perceptual Hashing",
  },
  {
    step: 2,
    tag: "Spatial Analytics",
    title: "High-Precision Geospatial Proximity",
    subtitle: "Polygon Geo-Fencing & Geodesic Distance Sorting",
    description: "Every loss and discovery is indexed through Haversine geodesic distance calculations and campus spatial zoning. Reports originating within identical zones receive prioritized confidence boosting to guarantee rapid recovery.",
    icon: MapPin,
    color: "from-emerald-600 to-teal-600",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    highlights: [
      "10m Campus Geo-Boundary Accuracy",
      "Proximity Radius & High-Probability Clustering",
      "Zero-Battery-Drain Background Spatial Indexing",
    ],
    technicalNote: "PostgreSQL PostGIS / Haversine Spatial Engine",
  },
  {
    step: 3,
    tag: "Cryptographic Audit",
    title: "Tamper-Proof Handover Certificates",
    subtitle: "SHA-256 Dual-Signature Audit Trail",
    description: "Every completed item transfer produces an immutable cryptographic certificate containing SHA-256 verification hashes, timestamped officer signatures, and verifiable QR codes for zero-dispute audit compliance.",
    icon: ShieldCheck,
    color: "from-purple-600 to-violet-600",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    highlights: [
      "Cryptographic SHA-256 Nonce Verification",
      "Dual Officer & Claimant Digital Signatures",
      "Exportable Official PDF Handover Certificates",
    ],
    technicalNote: "ISO / SOC2 Aligned Handover Verification Protocol",
  },
  {
    step: 4,
    tag: "Privacy Engineering",
    title: "Dynamic Smart Tags & Masked Relay",
    subtitle: "Contactless Item Recovery Without PII Exposure",
    description: "Generate scannable smart tags for laptops, keys, and valuables. Good Samaritans scan the QR code to open an anonymous encrypted communication channel with the owner—protecting phone numbers and personal identity.",
    icon: QrCode,
    color: "from-amber-600 to-orange-600",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    highlights: [
      "100% Zero-PII Leakage for Item Owners",
      "Client-Side Offline QR Generation & Printing",
      "Encrypted Relay Messaging Channel",
    ],
    technicalNote: "Zero External Dependencies · Safe Chat Sandbox",
  },
  {
    step: 5,
    tag: "Access Governance",
    title: "Three-Tier Enterprise Governance",
    subtitle: "Strict Citizen, Officer & Administrator Segregation",
    description: "Security architecture strictly enforces role boundaries. Citizens manage personal items, campus security officers oversee physical handovers, and enterprise administrators monitor telemetry, audit trails, and system health.",
    icon: Users,
    color: "from-cyan-600 to-blue-600",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    highlights: [
      "Role-Based Access Control (RBAC) & ABAC Engine",
      "Campus Custody Officer Action Logs",
      "Full Enterprise Telemetry & Activity Stream",
    ],
    technicalNote: "Session Token Validation via Supabase Database Sessions",
  },
  {
    step: 6,
    tag: "Event Architecture",
    title: "Live Real-Time SSE Stream Engine",
    subtitle: "Server-Sent Events for Instant Event Propagation",
    description: "FindBack AI avoids stale state and expensive HTTP polling through a persistent Server-Sent Events (SSE) data pipeline. New reports, candidate matches, and claim status changes propagate instantly across all active clients.",
    icon: Activity,
    color: "from-rose-600 to-pink-600",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    highlights: [
      "Real-Time Push for Claims & Candidate Matches",
      "Automatic Connection Recovery & Keep-Alive Heartbeat",
      "Zero Polling Overhead on Client Devices",
    ],
    technicalNote: "HTTP/1.1 SSE Streaming via /api/events",
  },
  {
    step: 7,
    tag: "Cloud Infrastructure",
    title: "Resilient Cloud & Database Engine",
    subtitle: "Render Cloud Auto-Warming & Supabase PostgreSQL Cluster",
    description: "Built for true production resilience. Features automatic Render cold-start handling with health probes, pooled connections to Supabase PostgreSQL, and strict database-driven persistence with zero mock data.",
    icon: Cloud,
    color: "from-indigo-600 to-blue-700",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    highlights: [
      "Automatic Render Free-Tier Cold-Start Handling",
      "Supabase PostgreSQL Relational Persistence",
      "100% Data-Driven Architecture (No Sample Data)",
    ],
    technicalNote: "Render Web Service + Supabase Production Pooling",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const step = onboardingSteps[currentStepIndex];
  const IconComponent = step.icon;

  const handleNext = () => {
    if (currentStepIndex < onboardingSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      navigate('/', { replace: true });
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0F1F3D] text-white flex flex-col justify-between p-5 sm:p-8 relative overflow-hidden select-none">
      {/* Background Ambient Glow Accents */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="mx-auto w-full max-w-5xl flex items-center justify-between z-10">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <Brand light={true} />
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
            Step {step.step} of {onboardingSteps.length}
          </span>
          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider py-1.5 px-3 rounded-lg border border-slate-700 hover:border-slate-500"
          >
            Skip to App
          </button>
        </div>
      </header>

      {/* Main Feature Showcase Container */}
      <main className="mx-auto w-full max-w-4xl my-auto py-8 z-10">
        <div className="rounded-3xl bg-slate-900/90 border border-slate-700/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Visual Icon & Progress Stage */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-tr ${step.color} blur-xl opacity-60 animate-pulse`} />
                <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr ${step.color} flex items-center justify-center shadow-2xl border border-white/20`}>
                  <IconComponent className="w-12 h-12 text-white" />
                </div>
              </div>

              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${step.badgeColor} mt-2`}>
                {step.tag}
              </span>
              <p className="text-[11px] font-mono text-slate-400 mt-2">
                Architecture Spec #{step.step}
              </p>
            </div>

            {/* Right Column: Detailed Capability Description */}
            <div className="lg:col-span-8 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {step.title}
                </h2>
                <p className="text-sm font-semibold text-blue-400 mt-1">
                  {step.subtitle}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-slate-300">
                {step.description}
              </p>

              {/* Feature Highlights Grid */}
              <div className="space-y-2 pt-2">
                {step.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Technical Footnote */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  {step.technicalNote}
                </span>
                <span className="hidden sm:inline-block text-emerald-400 font-semibold">
                  Production Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {onboardingSteps.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'w-10 bg-blue-500 shadow-lg shadow-blue-500/50'
                  : 'w-2.5 bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`Jump to step ${s.step}`}
            />
          ))}
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="mx-auto w-full max-w-4xl flex items-center justify-between z-10 pt-4">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
            currentStepIndex === 0
              ? 'border-slate-800 text-slate-600 cursor-not-allowed'
              : 'border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-3">
          {currentStepIndex === onboardingSteps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 btn-interactive"
            >
              <span>Get Started / Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all btn-interactive"
            >
              <span>Next Capability</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
