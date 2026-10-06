# 🚀 FINDBACK AI ENTERPRISE (ZEXO)
## Step-by-Step Complete Application Run & Deployment Guide

---

> **Purpose of this Document:**  
> This guide provides a crystal-clear, step-by-step procedure for setting up, running, testing, multi-lingual usage, and building native Android APKs for the FindBack AI Enterprise platform without any setup or runtime errors.

---

## 📋 Quick Index
1. **Prerequisites Checklist**
2. **Step 1: Provision & Initialize Supabase Database (`backend/init_db.js`)**
3. **Step 2: Start Backend Server (`backend/server.js` - Port 5000)**
4. **Step 3: Start Frontend Vite Application (`npm run dev` - Port 5173)**
5. **Step 4: Live Browser Testing & Multi-Lingual Feature Verification**
6. **Step 5: Run Automated Security & Integration Test Suite (`npm test`)**
7. **Step 6: Build Native Android APK (`Capacitor Android Build`)**
8. **⚠️ Troubleshooting & Common Fixes**

---

# 1. Prerequisites Checklist

Before executing the setup commands, verify that your machine has the following tools installed:
* **Node.js:** v18.0.0 or v20+ recommended (`node -v`).
* **Git:** Installed and configured (`git --version`).
* **Terminal / IDE:** VS Code, Cursor, or dual terminal windows/tabs.

---

# 2. Step 1: Provision & Initialize Supabase Database

This command connects to the live Supabase PostgreSQL cluster, executes the database schema ([`schema.sql`](file:///o:/New%20folder/findback-ai-enterprise/backend/schema.sql)), creates all **10 production tables & indexes**, and seeds initial sample dataset (Users, Lost Reports, Found Reports, AI Matches, Claims, and Handovers).

### 💻 Command to Run:
Open a terminal in the project root directory:

```bash
node backend/init_db.js
```

### ✅ Expected Output:
```text
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

# 3. Step 2: Start Backend Microservice (Port 5000)

The Node.js Express backend handles REST API requests, AI matching, email OTP verification, Server-Sent Events (SSE), and cryptographic handover receipts.

### 💻 Command to Run:
In **Terminal 1**, execute:

```bash
node backend/server.js
```

### ✅ Expected Output:
```text
[PostgreSQL] Configured connection pool for DATABASE_URL
================================================================
🚀 FindBack AI Backend Server Active on Port: 5000
📡 Health Check URL: http://0.0.0.0:5000/api/health
⚡ Real-Time SSE Stream: http://0.0.0.0:5000/api/events
🐘 Database Mode: PostgreSQL Pool Active
================================================================
✅ [PostgreSQL] Database schema verified/initialized from schema.sql
```

### 🌐 Live Health Check Endpoint:
You can verify backend operation by visiting:
👉 **[https://findbac-backend.onrender.com/api/health](https://findbac-backend.onrender.com/api/health)**

---

# 4. Step 3: Start Frontend Vite Application (Port 5173)

### 💻 Command to Run:
Open a **new terminal tab (Terminal 2)** in the root directory and execute:

```bash
npm run dev
```

The Vite dev server will start at `http://localhost:5173/`.

---

# 5. Step 4: Live Browser Testing & Multi-Lingual Feature Verification

Open your browser (Chrome, Edge, or Firefox) and navigate to the application:

### 🔗 1. Main User Application:
👉 **[https://findbac.onrender.com](https://findbac.onrender.com)** (or `http://localhost:5173`)

* **🌐 Multi-Lingual Support (5 Languages):**  
  Click the **Language Selector (🌐)** dropdown in the top navbar or sidebar to dynamically switch the entire interface between:
  1. 🇺🇸 **English (`en`)**
  2. 🇪🇸 **Spanish (`es`)**
  3. 🇮🇳 **Hindi (`hi`)**
  4. 🇫🇷 **French (`fr`)**
  5. 🇩🇪 **German (`de`)**
* **🖼️ App Icon & Favicon:**  
  The browser tab displays the official `public/favicon.png` icon.
* **Dashboard:** View active lost and found reports, metrics, and recent activity.
* **Report Wizard:** Click **"Report Lost Item"** or **"Report Found Item"** to attach hardware camera photos and GPS location markers.
* **AI Matches:** View candidate item matches with confidence percentages (e.g., 85% Match).
* **Claim Item:** Submit private ownership evidence (invoices, serial numbers, unique marks).

### 🔗 2. Enterprise Admin Command Center:
👉 **[https://findbac.onrender.com/admin](https://findbac.onrender.com/admin)**
* **Admin Review:** Security officers review pending claims and approve or reject them.
* **Handover Verification Code:** Upon approval, a 6-digit high-entropy code is generated.
* **SHA-256 Recovery Certificate:** Entering the code generates an immutable SHA-256 digital recovery certificate on screen.

---

# 6. Step 5: Run Automated Security & Integration Test Suite (`npm test`)

Validate RLS policies, access control gates, AI formulas, and cryptographic state transitions using the automated test suite.

### 💻 Command to Run:
```bash
npm test
```

### ✅ Expected Output:
```text
══════════════════════════════════════════════════════════════
  EXECUTIVE SUMMARY
══════════════════════════════════════════════════════════════
  Total  : 32
  PASSED : 32
  FAILED : 0
  RATE   : 100%
══════════════════════════════════════════════════════════════

  ALL 32 TEST CASES PASSED! FindBack AI is production-ready.
```

---

# 7. Step 6: Build Native Android APK (Capacitor Native Build)

To build a native Android APK (`.apk`):

### 💻 Sequential Commands:

#### 1. Build Production Frontend Bundle:
```bash
npm run build
```
*(Compiles React components into `./dist`)*

#### 2. Sync Web Assets & Native Plugins:
```bash
npx cap sync android
```

#### 3. Open Android Studio:
```bash
npx cap open android
```

#### 4. Generate APK in Android Studio:
1. Allow Gradle sync to complete in Android Studio.
2. In the top menu, select **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)**.
3. Once completed, click **locate** to access your compiled `app-debug.apk` file.

---

# 8. ⚠️ Troubleshooting & Common Fixes

### Issue 1: `Port 5000 is already in use`
* **Cause:** An existing background Node.js process is bound to port 5000.
* **Fix (PowerShell):**
  ```powershell
  Get-Process node | Stop-Process -Force
  ```
  Then re-run `node backend/server.js`.

### Issue 2: Browser returns `404 Endpoint not found`
* **Fix:** Ensure backend service is active by testing `https://findbac-backend.onrender.com/api/health`.

---

### 🌟 Command Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Initialize Database** | `node backend/init_db.js` |
| **Start Backend API** | `node backend/server.js` |
| **Start Frontend App** | `npm run dev` |
| **Run Test Suite** | `npm test` |
| **Build Android APK** | `npm run build && npx cap sync android && npx cap open android` |
