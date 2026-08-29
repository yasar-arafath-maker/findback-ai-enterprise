# FindBack AI Enterprise — Cloud Backend Service (PostgreSQL & Render Deployment)

This folder (`backend/`) contains the production-grade backend engine for **FindBack AI Enterprise**, equipped with a **PostgreSQL (Supabase / Render Postgres / Neon) database layer** and automated CI/CD deployment to [Render](https://render.com).

---

## 🚀 Key Backend Features

- **PostgreSQL Database Engine:** Connection pooling via `pg`, prepared statements, and transactional safety (`config/db.js`).
- **Atomic Multi-Entity Transactions:** Handover completion (`/api/functions/completeHandover`) runs inside a transactional SQL `BEGIN; ... COMMIT;` block, atomically finalizing Handovers, Claims, LostReports, and FoundReports.
- **Auto Schema Provisioning:** Automatically provisions all 10 core tables and performance indexes from `schema.sql`.
- **Zero-Downtime Health Probes:** `/api/health`, `/healthz`, and `/` for Render load-balancer uptime checks.
- **Server-Sent Events (SSE) Stream (`/api/events`):** Real-time pub/sub stream with 20s keep-alive pings preventing cloud reverse-proxy connection drops.
- **Multi-Modal AI Matching (`/api/functions/runMatching`):** Combines 64-bit SimHash text fingerprints, Haversine geospatial proximity, category trees, and temporal decay scoring.
- **Cryptographic Handover Receipts:** SHA-256 tamper-evident handover audit logs with Merkle-chain verification.
- **REST Entity CRUD (`/api/entities/:entityName`):** Full SQL query support for `LostReports`, `FoundReports`, `AIMatches`, `Claims`, `OwnershipEvidence`, `Handovers`, `Notifications`, and `AdminActions`.
- **Authentication & Email OTP:** Token-based sessions with direct Node SMTP Nodemailer dispatcher (`/api/send-otp` & `/api/verify-otp`).
- **Resilient Fallback Mode:** Operates automatically in local JSON mode when `DATABASE_URL` is absent, allowing offline local development and test execution.

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

### 1. Obtain Your PostgreSQL Connection String
From **Supabase**, **Render PostgreSQL**, or **Neon**, copy your Connection URI:
```
postgresql://postgres.yourproject:yourpassword@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```

### 2. Configure in `.env` (Local) or Render Dashboard (Production)
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### 3. Schema Structure (`schema.sql`)
The database contains the following tables:
1. `users` — User profiles, roles, and status
2. `lost_reports` — Reported lost items with GPS coordinates and AI tags
3. `found_reports` — Reported found items with holder location
4. `ai_matches` — Calculated match scores and confidence tiers
5. `claims` — Ownership claims with status state machine
6. `ownership_evidence` — Private proof descriptions and URLs
7. `handovers` — Verification codes, certificates, and scheduled dates
8. `notifications` — Real-time user alert records
9. `admin_actions` — Immutable administrative audit logs
10. `sessions` — Authentication tokens

---

## 🛠️ Local Development & Testing

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Run backend integration tests (10 automated tests)
npm test

# 3. Start server
npm start
```

---

## ☁️ Deploying to Render.com

### Option 1: Render Web Service (Dashboard UI)
1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure service settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `findback-ai-backend` |
| **Root Directory** | `backend` ⚠️ *(Important)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |

4. Add Environment Variables:
   - `DATABASE_URL` = `your_postgresql_connection_string`
   - `NODE_ENV` = `production`
   - `SMTP_HOST` = `smtp.gmail.com` *(optional)*
   - `SMTP_PORT` = `587` *(optional)*
   - `SMTP_USER` = `your_email@gmail.com` *(optional)*
   - `SMTP_PASS` = `your_app_password` *(optional)*

---

## 🤖 Automated CI/CD (GitHub Actions)

A GitHub Actions workflow is located at `.github/workflows/deploy.yml`:
1. On each push to `main`, tests are executed in Node.js 18.
2. When all tests pass, it triggers your Render Deploy Hook URL.

To enable automated deployment:
1. Go to Render Dashboard → Your Web Service → **Settings** → **Deploy Hook**.
2. Copy the Deploy Hook URL (`https://api.render.com/deploy/srv-xxxx?key=yyyy`).
3. In your GitHub repository: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
4. Set Name: `RENDER_DEPLOY_HOOK` and Value: *(Your Render Deploy Hook URL)*.

---

## 🔗 Connecting the Frontend to the Backend

In your frontend (`.env.production` or Vercel / Netlify / Render Static Site environment variables):
```env
VITE_API_BASE_URL=https://findback-ai-backend.onrender.com/api
```
