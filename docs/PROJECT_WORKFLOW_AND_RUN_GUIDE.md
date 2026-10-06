# FINDBACK AI ENTERPRISE (ZEXO)
## Complete Project Workflow, Execution Procedures & Frontend-Backend Architecture Guide
### விரிவான செயல்பாட்டு வழிகாட்டி (Detailed Operating & Architecture Manual)

---

**Project Name:** FindBack AI Enterprise (ZEXO Architecture)  
**System Type:** Distributed Multi-Modal AI Lost & Found Recovery Platform  
**Target Environments:** Local Development (Vite + Node.js), Cloud Production (Render + Supabase PostgreSQL), Mobile Native (Capacitor Android APK)  
**Document Version:** 3.0 Enterprise Edition  

---

## TABLE OF CONTENTS
1. **End-to-End System Flow (முழுமையான செயல்பாட்டு சுழற்சி)**
   - 1.1 Complete Visual Architecture Flowchart
   - 1.2 Step-by-Step 10-Stage User & Recovery Journey
2. **Frontend Architecture & Internal Working (Front-End இயங்கும் விதம்)**
   - 2.1 File Map & Component Responsibilities
   - 2.2 Client-Side Authentication Flow (`AuthContext.jsx` & `base44Client.js`)
   - 2.3 Resilient API Networking & Cold-Start Retry Engine (`networkClient.js`)
   - 2.4 Server-Sent Events (SSE) Real-Time Listener
   - 2.5 Native Mobile Hardware Integration (Capacitor Camera & Geolocation)
3. **Backend Architecture & Internal Working (Back-End இயங்கும் விதம்)**
   - 3.1 HTTP Server Architecture & Universal Route Normalizer (`server.js`)
   - 3.2 PostgreSQL Connection Pool & Dual-Mode Fallback (`config/db.js`)
   - 3.3 Core Serverless Business Functions (Matching, Claims, Handover)
   - 3.4 Email OTP Dispatcher (`emailOtpService.js`)
   - 3.5 Cryptographic Audit Engine (`cryptoAudit.js`)
4. **Complete Local & Production Run Procedures (ப்ராஜெக்ட்டை இயக்கும் படிநிலைகள்)**
   - 4.1 Prerequisites & System Requirements
   - 4.2 Step 1: Dependency Installation
   - 4.3 Step 2: Environment Variables Configuration
   - 4.4 Step 3: Database Provisioning & Schema Initialization
   - 4.5 Step 4: Booting the Backend Server (Port 5000)
   - 4.6 Step 5: Booting the Frontend Vite Application (Port 5173)
   - 4.7 Step 6: Verifying Health & Telemetry via CLI / Browser
   - 4.8 Step 7: Running the Automated Test & Security Suites
   - 4.9 Step 8: Android Native Build Procedure (Capacitor)
   - 4.10 Step 9: Cloud Deployment Procedure (Render & Supabase)
5. **Troubleshooting & Common Error Fixes (பொதுவான பிழைகளும் தீர்வுகளும்)**

---

# 1. END-TO-END SYSTEM FLOW (முழுமையான செயல்பாட்டு சுழற்சி)

### 1.1 Complete Visual Architecture Flowchart

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                1. USER AUTHENTICATION                                 │
│  User registers / logs in ──> OTP sent to Email ──> Token verified ──> Session saved  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           2. REPORT CREATION (Lost vs. Found)                         │
│  • User A: Reports LOST item (Title, Brand, GPS Coordinates, Photos, Description)      │
│  • User B: Reports FOUND item (Turned into Security Desk / Custody Location recorded)  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        3. MULTI-MODAL AI MATCHING ENGINE                               │
│  • 64-bit SimHash Text Fingerprint + Hamming Distance ($30\%$)                         │
│  • Gemini Vision AI Multi-Modal Image Vector ($30\%$)                                 │
│  • Haversine Geospatial Distance + Exponential Decay $100 \cdot e^{-d/20}$ ($15\%$)    │
│  • Category Tree Ontological Match ($15\%$)                                           │
│  • Temporal Proximity Decay $100 \cdot e^{-\Delta t/7}$ ($10\%$)                       │
│                                                                                        │
│  Overall Score $\ge 75\%$: High Match  |  $50\%-74\%$: Medium  |  $<30\%$: Discarded  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     4. REAL-TIME EVENT STREAM & DASHBOARD UPDATE                      │
│  Backend broadcasts MATCHES_GENERATED via Server-Sent Events (SSE) ──> UI updates live │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     5. ZERO-KNOWLEDGE EVIDENCE & CLAIM SUBMISSION                      │
│  Claimant submits secret proof (Invoice, Serial Number, Private Marks)                 │
│  * Finder CANNOT see this proof (Protected by Row-Level Security)                     │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          6. ADMINISTRATIVE DECISION & REVIEW                           │
│  Admin/Security Desk reviews evidence in Enterprise Console ──> Approves / Rejects     │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        7. CRYPTOGRAPHIC HANDOVER CODE ISSUANCE                         │
│  System generates 6-digit high-entropy OTP ──> Sent strictly to Claimant's App/Email   │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   8. PHYSICAL EXCHANGE AT SECURITY DESK (ATOMIC TX)                    │
│  Claimant tells 6-digit OTP to Officer ──> Officer inputs code into system             │
│  ──> SQL BEGIN; ... COMMIT; transaction atomically marks:                             │
│      1. Handovers ──> 'completed'                                                      │
│      2. Claims ──> 'completed'                                                         │
│      3. LostReports ──> 'closed'                                                       │
│      4. FoundReports ──> 'returned'                                                    │
│      5. AdminActions ──> 'handover_completed' audit logged                             │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       9. SHA-256 DIGITAL RECOVERY CERTIFICATE                          │
│  SHA-256 receipt generated: SHA256(HandoverId||ClaimantId||FinderId||AdminId||Code||TS)│
│  Digital certificate rendered on screen for permanent proof of recovery.               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. FRONTEND ARCHITECTURE & INTERNAL WORKING (Front-End இயங்கும் விதம்)

### 2.1 File Map & Component Responsibilities

| File Path | Core Role |
| :--- | :--- |
| `src/main.jsx` | React root mounting point, initial client bridge import. |
| `src/App.jsx` | Application router, layout wrapper, and route protection gates. |
| `src/context/LanguageContext.jsx` | Multi-lingual i18n context (English, Spanish, Hindi, French, German). |
| `src/components/LanguageSelector.jsx` | Dropdown UI component for switching languages dynamically. |
| `src/context/AuthContext.jsx` | React Context managing user profile, bearer tokens, and session state. |
| `src/api/base44Client.js` | Universal client bridge exposing `db.auth`, `db.entities.*`, and `db.functions.*`. |
| `src/api/networkClient.js` | Resilient fetch layer with cold-start exponential backoff and SSE streaming. |
| `src/pages/Dashboard.jsx` | Main user dashboard showing active lost/found items, quick actions, and stats. |
| `src/pages/ReportWizard.jsx` | Lost & Found reporting form with hardware camera and geolocation trigger. |
| `src/pages/Matches.jsx` | AI matches viewer with confidence meters and instant "Claim" triggers. |
| `src/pages/ClaimItem.jsx` | Zero-knowledge evidence submission form (invoices, serial numbers, photos). |
| `src/pages/AdminDashboard.jsx` | Administrative control center for reviewing claims and viewing telemetry. |
| `src/components/DigitalHandoverCertificate.jsx` | Handover tracking screen with 6-digit code reveal and SHA-256 receipt certificate. |

### 2.2 Client-Side Authentication Flow (`AuthContext.jsx` & `base44Client.js`)
1. When the app boots, `AuthContext.jsx` calls `db.auth.me()`.
2. `base44Client.js` checks `localStorage` for `b44_token` or `b44_user`.
3. If found, it dispatches an authenticated `GET /api/auth/me` with header `Authorization: Bearer <token>`.
4. If valid, the user state is set to `authenticated`, and the user is redirected to `/dashboard`.
5. If unauthenticated, `ProtectedRoute.jsx` intercepts private routes and redirects to `/login`.

### 2.3 Resilient API Networking & Cold-Start Retry Engine (`networkClient.js`)
Free cloud platforms (like Render) spin down web services during periods of inactivity, causing initial requests to experience HTTP 502/503/504 errors or 20-30s latencies.
In `networkClient.js`:
```javascript
export const resilientFetch = async (endpoint, options = {}, maxRetries = 2) => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      // If cloud cold start error (500, 502, 503, 504), retry with backoff
      if ([500, 502, 503, 504].includes(res.status) && attempt < maxRetries) {
        attempt++;
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(r => setTimeout(r, backoffMs));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      attempt++;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
};
```

### 2.4 Server-Sent Events (SSE) Real-Time Listener
Instead of repetitive polling, `networkClient.js` exports `createLiveEventStream(onEvent, onError)`:
- Opens an `EventSource` connection to `${baseUrl}/api/events`.
- Listens for server broadcast events (`ENTITY_CREATED`, `MATCHES_GENERATED`, `HANDOVER_COMPLETED`).
- Automatically triggers React state refreshes so the user sees incoming matches in real time without refreshing the browser.

### 2.5 Native Mobile Hardware Integration (Capacitor Camera & Geolocation)
- When a user clicks **"Take Photo"**:
  - Capacitor checks `Capacitor.isNativePlatform()`.
  - On Android/iOS: Launches the native device camera (`Camera.getPhoto()`), compresses image to WebP, and returns Base64/DataURL.
  - On Desktop Chrome: Opens the standard HTML5 `<input type="file" accept="image/*" capture>` file picker.
- When a user clicks **"Use Current Location"**:
  - On Mobile: Queries native GPS via `@capacitor/geolocation` (`Geolocation.getCurrentPosition()`).
  - On Desktop: Calls browser `navigator.geolocation.getCurrentPosition()`.

---

# 3. BACKEND ARCHITECTURE & INTERNAL WORKING (Back-End இயங்கும் விதம்)

### 3.1 HTTP Server Architecture & Universal Route Normalizer (`backend/server.js`)
The backend is a high-performance native Node.js HTTP server. To eliminate 404 errors caused by varying client URL conventions, it includes an automatic route normalizer at the top of the request lifecycle:

```javascript
// Universal Route Normalization
let pathname = reqUrl.pathname.replace(/\/+/g, '/');
while (pathname.startsWith('/api/api/')) {
  pathname = pathname.replace('/api/api/', '/api/');
}
```
This guarantees that whether a client calls:
- `https://findback-ai-backend.onrender.com/api/reports`
- `https://findback-ai-backend.onrender.com/reports`
- `https://findback-ai-backend.onrender.com/api/api/reports`
The request is routed to the same handler without returning 404.

### 3.2 PostgreSQL Connection Pool & Dual-Mode Fallback (`config/db.js`)
The database module handles two runtime environments automatically:
1. **Cloud Production Mode (`DATABASE_URL` is set):**
   - Configures a `pg.Pool` connection pool with SSL (`rejectUnauthorized: false`).
   - Connects to Supabase on port `6543` (transaction pooler mode).
   - Executes real SQL queries with prepared statements (`query('SELECT * FROM users WHERE id = $1', [id])`).
2. **Local / Offline Fallback Mode (`DATABASE_URL` is absent):**
   - Automatically falls back to reading and writing JSON records in `local_db.json`.
   - Allows frontend developers to develop and run the application offline without needing a PostgreSQL server installed locally.

### 3.3 Core Serverless Business Functions
The backend exposes 4 critical serverless business endpoints:

1. **`POST /api/functions/runMatching`:**
   - Evaluates a newly submitted Lost or Found report against existing active records.
   - Calculates the 5 weighted mathematical signals (SimHash text Hamming distance, Haversine geospatial decay, category tree match, temporal decay, and vision score).
   - Records matches scoring $\ge 40\%$ in `ai_matches` table.
2. **`POST /api/functions/submitClaim`:**
   - Verifies claimant identity.
   - Blocks finders from claiming items they found.
   - Stores encrypted ownership evidence records in `ownership_evidence`.
   - Transitions claim status to `submitted`.
3. **`POST /api/functions/decideClaim`:**
   - Guarded by Admin role check.
   - Blocks self-approval (admins cannot approve their own claims).
   - If approved: generates high-entropy 6-digit OTP code, creates a `handovers` record, and sends notification to claimant.
4. **`POST /api/functions/completeHandover`:**
   - Executes inside an atomic SQL `BEGIN; ... COMMIT;` transaction block.
   - Validates the 6-digit OTP code using timing-safe comparison.
   - Atomically updates 4 tables: `handovers` $\rightarrow$ `completed`, `claims` $\rightarrow$ `completed`, `lost_reports` $\rightarrow$ `closed`, `found_reports` $\rightarrow$ `returned`.
   - Computes SHA-256 seal and records permanent entry in append-only `admin_actions` table.

---

# 4. COMPLETE LOCAL & PRODUCTION RUN PROCEDURES (ப்ராஜெக்ட்டை இயக்கும் படிநிலைகள்)

### 4.1 Prerequisites & System Requirements
- **Node.js:** v18.0.0 or v20.x or higher (Check with `node -v`)
- **npm:** v9.x or higher (Check with `npm -v`)
- **Git:** Installed and available in terminal
- **Operating System:** Windows 10/11, macOS, or Linux

---

### 4.2 Step 1: Dependency Installation

Open terminal in the project root directory (`d:\findit`):

```bash
# 1. Install frontend & root project dependencies
npm install

# 2. Install backend standalone dependencies
cd backend
npm install
cd ..
```

---

### 4.3 Step 2: Environment Variables Configuration

The project uses dedicated environment files:

#### A. Frontend Development File: `d:\findit\.env.development`
```env
# Production Cloud: points to live Render web service
VITE_API_BASE_URL=https://findback-ai-backend.onrender.com/api
VITE_BACKEND_URL=https://findback-ai-backend.onrender.com
VITE_FRONTEND_URL=https://findback-ai.onrender.com
```

#### B. Frontend Production File: `d:\findit\.env.production`
```env
# Cloud Production: points to live Render web service
VITE_API_BASE_URL=https://findback-ai-backend.onrender.com/api
```

#### C. Backend Configuration File: `d:\findit\backend\.env`
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://postgres.yourproject:yourpassword@aws-0-region.pooler.supabase.com:6543/postgres
```

---

### 4.4 Step 3: Database Provisioning & Schema Initialization

To create all 10 tables and seed standard test users into the live Supabase PostgreSQL database:

```bash
# Run database initialization script
node backend/init_db.js
```

**Expected Console Output:**
```
╔══════════════════════════════════════════════════════════════╗
║       FindBack AI - Supabase PostgreSQL Database Setup       ║
╚══════════════════════════════════════════════════════════════╝
🔄 Connecting to Supabase PostgreSQL cluster...
✅ Connected successfully!
📜 Executing schema.sql to create production tables...
✅ All 10 tables and indexes successfully created in Supabase!
🌱 Seeding standard base users...
 ➔ Seeding 7 LostReports...
 ➔ Seeding 2 FoundReports...
 ➔ Seeding 10 AIMatches...
 ➔ Seeding 1 Claims...
 ➔ Seeding 5 Handovers...
📊 Live Supabase Database Metrics:
 • users          : 11 records
 • lost_reports  : 7 records
 • found_reports : 2 records
 • ai_matches    : 10 records
 • claims        : 1 records
 • handovers     : 5 records
🎉 Live Supabase Database is 100% Initialized and Ready for Production!
```

---

### 4.5 Step 4: Booting the Backend Server (Port 5000)

Open a terminal window and run:

```bash
cd d:\findit\backend
node server.js
```
*(Or from root: `node backend/server.js`)*

**Expected Terminal Output:**
```
================================================================
🚀 FindBack AI Backend Server Active on Port: 5000
📡 Health Check URL: http://0.0.0.0:5000/api/health
⚡ Real-Time SSE Stream: http://0.0.0.0:5000/api/events
🐘 Database Mode: PostgreSQL Pool Active
================================================================
✅ [PostgreSQL] Database schema verified/initialized from schema.sql
```

---

### 4.6 Step 5: Booting the Frontend Vite Application (Port 5173)

Open a **second terminal window** in the root directory (`d:\findit`) and run:

```bash
cd d:\findit
npm run dev
```

**Expected Terminal Output:**
```
  VITE v6.4.3  ready in 1800 ms

  ➜  Local:   https://findback-ai.onrender.com/
  ➜  Network: use --host to expose
```

Now open Google Chrome and navigate to:
- **Main User Application:** [https://findback-ai.onrender.com](https://findback-ai.onrender.com)
- **Enterprise Admin Console:** [https://findback-ai.onrender.com/enterprise-admin](https://findback-ai.onrender.com/enterprise-admin)

---

### 4.7 Step 6: Verifying Health & Telemetry via CLI / Browser

To verify that the backend is responding and connected to PostgreSQL:

#### In Windows PowerShell:
```powershell
Invoke-RestMethod -Uri "https://findback-ai-backend.onrender.com/api/health" | Format-List
```

#### In Bash / Terminal (curl):
```bash
curl -X GET https://findback-ai-backend.onrender.com/api/health
```

**Expected JSON Response:**
```json
{
  "status": "online",
  "service": "FindBack AI Enterprise Backend",
  "environment": "production",
  "database_engine": "postgresql_connected",
  "uptime_seconds": 45,
  "active_connections": 1,
  "timestamp": "2026-09-10T10:30:00.000Z"
}
```

---

### 4.8 Step 7: Running the Automated Test & Security Suites

Execute the automated test suites to ensure 100% security and operational readiness:

```bash
# 1. Run Backend Smoke & Route Integration Tests (14 Tests)
npm --prefix backend test

# 2. Run Comprehensive Behavioral Security Audit (26 Tests)
node tests/findback_audit.test.js

# 3. Run Enterprise 5-Pillar Test Suite (9 Tests)
node tests/findback_enterprise.test.js

# 4. Run Canonical End-to-End Flow Runner
node tests/canonical_flow_runner.js

# 5. Run All Tests Combined
npm test
```

**Target Output:** `ALL 26 TEST CASES PASSED! FindBack AI is production-ready.`

---

### 4.9 Step 8: Android Native Build Procedure (Capacitor)

To compile the application as a native Android APK:

```bash
# 1. Build the production web bundle
npm run build

# 2. Copy web assets into Android project and update plugins
npx cap sync android

# 3. Open project in Android Studio to build APK or run on Emulator / Device
npx cap open android
```
*In Android Studio, click **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)** to generate the installable `.apk` file.*

---

### 4.10 Step 9: Cloud Deployment Procedure (Render & Supabase)

1. **GitHub Trigger:**
   ```bash
   git add .
   git commit -m "chore: production release"
   git push origin main
   ```
2. **Automated CI/CD Pipeline:**
   GitHub Actions will automatically run the 26 security tests and trigger the Render Deploy Hook.
3. **Render Web Service Configuration:**
   - Build Command: `cd backend && npm install`
   - Start Command: `node backend/server.js`
   - Environment Variable:
     `DATABASE_URL=postgresql://postgres.yourproject:yourpassword@aws-0-region.pooler.supabase.com:6543/postgres`
4. **Live URL:**
   - Backend API: `https://findback-ai-backend.onrender.com/api`
   - Health Probe: `https://findback-ai-backend.onrender.com/api/health`

---

# 5. TROUBLESHOOTING & COMMON ERROR FIXES (பொதுவான பிழைகளும் தீர்வுகளும்)

| Issue / Error | Root Cause | Exact Solution |
| :--- | :--- | :--- |
| `404 Endpoint not found` on `/api/reports` | Double prefix `/api/api/` or un-normalized path. | The universal route normalizer in `backend/server.js` automatically strips redundant `/api` prefixes. Ensure frontend requests point to `/api/...`. |
| `PostgreSQL Connection Terminated` | Exceeded pool limits or SSL handshake timeout. | In `backend/config/db.js`, ensure `ssl: { rejectUnauthorized: false }` is enabled and port `6543` pooler URL is used. |
| Render Web Service Cold-Start Delay | Render free-tier puts unused containers to sleep. | `networkClient.js` automatically performs exponential retries with a 20s timeout window. Wait 30s on first load. |
| Android Camera Permission Denied | Missing camera permissions in Android Manifest. | Ensure `AndroidManifest.xml` contains `<uses-permission android:name="android.permission.CAMERA" />`. |
| Port 5000 Already in Use | Another background Node process is running. | In PowerShell run: `Get-Process node \| Stop-Process -Force`, then restart `node backend/server.js`. |
