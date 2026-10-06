# FindBack AI Enterprise — Architecture & Technical Reference

## System Architectural Overview

FindBack AI Enterprise is architected around a zero-trust, privacy-first item recovery framework. It decouples high-level user reporting from administrative claim verification, protecting user PII while using multi-modal AI and spatial indexing to discover item matches.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          User Device Layer                             │
│   React 18 SPA (src/) ── Capacitor (Camera & High-Accuracy GPS)        │
│   Multi-Lingual Engine (English, Spanish, Hindi, French, German)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS API / SSE Stream
┌───────────────────────────────────▼────────────────────────────────────┐
│                        Backend Engine (backend/)                       │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   Auth & Access Control │  │        Row-Level Security (RLS)     │  │
│  │   Token / Session Guard │  │   User / Admin / Finder Isolation   │  │
│  └────────────┬────────────┘  └──────────────────┬──────────────────┘  │
│               │                                  │                     │
│  ┌────────────▼──────────────────────────────────▼──────────────────┐  │
│  │                  Serverless & Express API Functions              │  │
│  │   runMatching  │  submitClaim  │  decideClaim  │ completeHandover│  │
│  └────────────┬──────────────────────────────────┬──────────────────┘  │
│               │                                  │                     │
│  ┌────────────▼────────────┐  ┌──────────────────▼──────────────────┐  │
│  │ Multi-Modal AI Engine   │  │    Cryptographic Handover Engine    │  │
│  │ SimHash + Uber H3 + LLM │  │  SHA-256 Code Hash + Audit Trail    │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Multi-Modal AI & Spatial Indexing Engine

The AI matching pipeline in `entities/entry.ts__3` leverages a multi-stage candidate discovery and ranking process:

### Stage 1: Cheap Pre-Filtering
To prevent redundant API consumption and eliminate unnecessary computation:
1. **Category Filter:** Discards candidate items whose category score is `0` (not identical or in the `RELATED_CATEGORIES` matrix).
2. **Spatial Bounding-Box Filter:** Performs a fast lat/lng delta check ($\Delta\text{lat} > 0.5^\circ$ or $\Delta\text{lng} > 0.5^\circ \approx 55\text{ km}$) to discard geographically distant reports immediately.
3. **Temporal Window:** Filters candidates with report dates differing by more than 14 days.

### Stage 2: Feature Extraction & Spatial Indexing
- **SimHash Text Fingerprinting (`src/lib/textFingerprint.js`):** Extracts 64-bit structural SimHash fingerprints from report title, color, and description. Computes Hamming distance similarity.
- **Uber H3 Spatial Cell Indexing (`src/lib/spatialIndexer.js`):** Maps latitude/longitude coordinates to resolution-8 H3 hexagonal spatial cells (~0.7 km² area) for fast spatial proximity indexing.
- **Haversine Distance Scoring (`src/lib/matchScore.js`):** Computes precise great-circle distance between coordinates and converts to a proximity score via exponential decay:
  $$\text{Geo Score} = 100 \cdot e^{-\text{distance\_km} / 20}$$

### Stage 3: LLM Vision & Semantic Synthesis
For top-ranked candidates, the system invokes `base44.asServiceRole.integrations.Core.InvokeLLM` with PII-redacted text prompts and primary image URLs (when available). The LLM yields 0–100 text similarity and image similarity scores along with key potential-match reasons.

---

## 2. Multi-Lingual Architecture (5 Languages)

FindBack AI Enterprise implements full multi-lingual support managed via `src/context/LanguageContext.jsx` and `src/components/LanguageSelector.jsx`:

- **Supported Languages:**
  - 🇺🇸 **English (`en`)** — Default
  - 🇪🇸 **Spanish (`es`)** — Español
  - 🇮🇳 **Hindi (`hi`)** — हिंदी
  - 🇫🇷 **French (`fr`)** — Français
  - 🇩🇪 **German (`de`)** — Deutsch
- **Persistence:** Selected language persists across browser sessions using `localStorage` (`findback_language`) and synchronizes with `document.documentElement.lang`.
- **Global Selector:** Integrated into `src/components/AppShell.jsx` (sidebar & mobile header) and `src/pages/Landing.jsx` (navbar).

---

## 3. Claim Lifecycle & Evidence Security

Claims follow a strict state machine to prevent unauthorized item takeovers:

```
 [Report Active] ──► [Claim Submitted] ──► [Under Review] ──► [Approved] ──► [Handover Complete]
                                                │
                                                ├──► [Evidence Requested]
                                                │
                                                └──► [Rejected]
```

- **Owner-Only Claims:** Only the reporter of a lost item can initiate a claim (`lost.reporter_id === user.id`). Finders are explicitly blocked from self-claiming items (`found.finder_id !== user.id`).
- **Encrypted Evidence Vault:** Ownership proof images and receipts are created via backend server functions with `asServiceRole`. RLS policies restrict read access exclusively to the claimant (`submitted_by === user.id`) and verified administrators (`role === 'admin'`).
- **Zero-Evidence Approval Block:** Administrators cannot approve claims without at least one verified piece of evidence.

---

## 4. Cryptographic Handover Protocol

Handovers ensure safe, in-person item return without exposing verification secrets:

1. **Code Generation:** Upon claim approval, `decideClaim` generates a 6-digit high-entropy code using `crypto.getRandomValues`.
2. **Cryptographic Hashing:** The code is presented to the claimant once, while only its SHA-256 hash (or secure hash digest) is stored in `Handovers`.
3. **48-Hour Expiry Window:** Verification codes carry a 48-hour time-to-live (`scheduled_datetime + 48h`). Expired codes return HTTP `410 Gone`.
4. **Atomic Entity Finalization:** When `completeHandover` verifies the code against the stored hash, all 4 entities update atomically inside `Promise.all`:
   - `Claims.status` $\rightarrow$ `'completed'`
   - `LostReports.status` $\rightarrow$ `'closed'`
   - `FoundReports.status` $\rightarrow$ `'returned'`
   - `Handovers.status` $\rightarrow$ `'completed'`

---

## 5. Administrative Controls & Application Assets

- **App Icon & Favicon:** Standardized on `public/favicon.png` across web application icons, PWA manifest (`public/manifest.json`), mobile splash screens, and navbar branding (`src/components/Brand.jsx`).
- **Privilege Escalation Prevention:** User table RLS policies disallow non-admins from modifying `role` or `account_status` fields.
- **Suspended Account Enforcement:** Suspended users (`account_status === 'suspended'`) are blocked with HTTP `403 Forbidden` across all server functions before processing logic.
- **Append-Only Audit Log:** Sensitive administrative actions generate immutable records in `AdminActions`. Direct user writes/updates/deletes on audit logs are blocked at the database level.
