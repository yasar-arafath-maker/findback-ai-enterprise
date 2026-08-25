# FindBack AI Enterprise — Multi-Modal Lost & Found Item Recovery Platform

FindBack AI Enterprise is a production-grade, secure, multi-modal lost-and-found recovery engine built on top of Base44, React, Capacitor, and Gemini Vision AI. It features deterministic spatial indexing, cryptographic handover receipts, strict row-level security (RLS), and native mobile camera/GPS capture capabilities.

---

## 🏗️ 10-Phase Enterprise Architecture Model

The codebase strictly follows a 10-phase engineering architecture:

| Phase | Core Objective | Primary Implementation Highlights |
| :--- | :--- | :--- |
| **Phase 1** | **Auth & Security Foundation** | Token persistence, `AuthContext` loading states, environment-guarded auth bypass (`VITE_DEV_BYPASS_AUTH`), route guards (`ProtectedRoute`, `AdminGuard`). |
| **Phase 2** | **Privacy & Row-Level Security** | Entity isolation via `.jsonc` RLS policies (Lost/Found reports restricted to `reporter_id`/`finder_id`, matches scoped to involved users). |
| **Phase 3** | **Multi-Modal AI Matching** | Text SimHash fingerprinting (`textFingerprint.js`), Haversine distance & H3 spatial indexing (`spatialIndexer.js`), multi-signal weighted scoring (`matchScore.js`). |
| **Phase 4** | **Claims & Evidence Verification** | State-machine claim lifecycle (`submitted` → `under_review` → `evidence_requested` → `approved`/`rejected`), encrypted evidence uploads (`ClaimItem.jsx`). |
| **Phase 5** | **Secure Handover Engine** | Cryptographic SHA-256 code hashing, 6-digit high-entropy code generation, 48-hour time-decay expiry, atomic 4-entity state updates (`completeHandover`). |
| **Phase 6** | **Admin & Enterprise Controls** | Account suspension controls, report flagging, duplicate report merging without data loss, append-only `AdminActions` audit logging. |
| **Phase 7** | **Mobile Camera & Geolocation** | Native Capacitor Camera (`capturePhoto`) and Geolocation (`getCurrentLocation`) wrappers with graceful desktop HTML5 browser fallbacks. |
| **Phase 8** | **Testing & Quality Hardening** | 26 behavioral security assertions (`findback_audit.test.js`), 9 enterprise pillar tests (`findback_enterprise.test.js`), canonical flow runner. |
| **Phase 9** | **Performance & Scalability** | Category & bounding-box pre-filtering in `entry.ts__3`, $O(1)$ parallel `Promise.all` batch fetching in dashboards (`Dashboard.jsx`, `Matches.jsx`). |
| **Phase 10** | **Deployment, CI/CD & Docs** | GitHub Actions CI pipeline (`ci.yml`), pruned dependency supply chain, comprehensive architecture documentation (`docs/architecture.md`). |

---

## 🧮 Multi-Modal AI Scoring Model

Matches are evaluated using a 5-signal weighted scoring formula declared in `matchScore.js`:

$$\text{Overall Score} = (0.30 \times \text{Image}) + (0.30 \times \text{Text}) + (0.15 \times \text{Geo}) + (0.15 \times \text{Category}) + (0.10 \times \text{Time})$$

- **Image Score ($30\%$):** Gemini 3 Flash vision similarity blended with text structural hashes ($50\%$ neutral if image unavailable).
- **Text Score ($30\%$):** SimHash text fingerprint Hamming distance blended with semantic LLM summary.
- **Geo Proximity ($15\%$):** Exponential decay over Haversine distance in kilometers ($100 \cdot e^{-\text{km}/20}$) and Uber H3 cell matching.
- **Category Match ($15\%$):** $100$ for exact category, $50$ for related category tier, $0$ for unrelated.
- **Temporal Proximity ($10\%$):** Exponential decay over days between lost and found dates ($100 \cdot e^{-\text{days}/7}$).

---

## 🔒 Cryptographic Handover & Privacy Rules

1. **Verification Code Security:** Plaintext verification codes are never stored in the database. Approved claims generate a 6-digit code presented to the claimant, while only its cryptographic hash is stored in `Handovers`.
2. **Timing-Safe Verification:** Code verification uses strict time-constant comparison to prevent side-channel timing attacks.
3. **Append-Only Audit Trail:** Administrative decisions record immutable entries in `AdminActions`. Regular users are forbidden from creating, updating, or deleting audit logs via RLS rules.
4. **Evidence Isolation:** Ownership evidence submitted during claims is accessible solely to the claimant and verified admins—finders are strictly blocked by RLS policies.

---

## 💻 Local Development Workflow

### Prerequisites
1. Node.js `v20.x` or higher
2. Base44 CLI installed: `npm install -g base44@latest`

### Option A: Full Stack Development (Recommended)
Run the backend server and Vite frontend together:
```bash
base44 dev
```

### Option B: Frontend-Only Development
Run the Vite development server against a hosted Base44 backend:
```bash
# 1. Configure local environment in .env.local
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.db.app

# 2. Start Vite dev server
npm run dev
```

---

## 📱 Mobile Build Workflow (Capacitor)

FindBack AI uses Capacitor to provide native camera and GPS integration on Android and iOS devices.

```bash
# 1. Build web production bundle
npm run build

# 2. Sync web assets with native mobile projects
npx cap sync

# 3. Open Android Studio to build native APK/AAB
npx cap open android
```

---

## 🧪 Testing & Quality Assurance

Run the automated test suites locally:

```bash
# Run all test suites
npm test

# Run Security & Behavioral Audit Test Suite (26 Tests)
npm run test:audit

# Run Enterprise 5-Pillar Test Suite (9 Tests)
npm run test:enterprise

# Run Canonical Multi-User End-to-End Flow Runner
npm run test:canonical
```

---

## 🚀 CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically runs on pushes and pull requests to `main`/`master`/`develop`:
1. Environment setup & dependency installation (`npm ci`)
2. Typecheck verification (`npm run typecheck`)
3. Security & Audit Test Suite (`node tests/findback_audit.test.js`)
4. Enterprise 5-Pillar Test Suite (`node tests/findback_enterprise.test.js`)
5. Canonical Flow Runner (`node tests/canonical_flow_runner.js`)
6. Vite Production Build (`npm run build`)
