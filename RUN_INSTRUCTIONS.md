# 🚀 FINDBACK AI ENTERPRISE (ZEXO)
## எளிய முறையில் ப்ராஜெக்ட்டை இயக்கும் முழுமையான வழிகாட்டி (Step-by-Step Run Guide)

---

> **இந்தக் கோப்பின் நோக்கம்:**  
> FindBack AI ப்ராஜெக்ட்டை உங்கள் கம்ப்யூட்டரில் ஆரம்பம் முதல் இறுதி வரை எந்தப் பிழையும் (Error) இல்லாமல் எளிதாக ரன் செய்வதற்கும், பிரவுசரில் டெஸ்ட் செய்வதற்கும், மற்றும் Android APK உருவாக்குவதற்குமான மிக மிகத் தெளிவான (Crystal-Clear) தமிழ் & ஆங்கில வழிகாட்டி.

---

## 📋 உள்ளடக்க அட்டவணை (Quick Index)
1. **முன் தேவைகள் (Prerequisites Checklist)**
2. **படி 1: லைவ் Supabase டேட்டாபேஸை தயார் செய்தல் (`init_db.js`)**
3. **படி 2: Backend சர்வரை துவக்குதல் (`server.js` - Port 5000)**
4. **படி 3: Frontend Vite ஆப்பை துவக்குதல் (`npm run dev` - Port 5173)**
5. **படி 4: பிரவுசரில் நேரடி டெஸ்டிங் செய்தல் (Live Testing Guide)**
6. **படி 5: அனைத்து செக்யூரிட்டி & யூனிட் டெஸ்ட்களை சரிபார்த்தல் (`npm test`)**
7. **படி 6: Android Mobile APK உருவாக்குதல் (Capacitor Build)**
8. **⚠️ அடிக்கடி வரும் சந்தேகங்களும் உடனடி தீர்வுகளும் (Troubleshooting)**

---

# 1. முன் தேவைகள் (Prerequisites Checklist)

கட்டளைகளை இயக்குவதற்கு முன், உங்கள் கணினியில் இவை உள்ளதா என்பதை உறுதிப்படுத்திக் கொள்ளுங்கள்:
* **Node.js:** v18 அல்லது v20+ நிறுவப்பட்டிருக்க வேண்டும் (`node -v` என்று அடித்துப் பார்க்கலாம்).
* **Git:** நிறுவப்பட்டிருக்க வேண்டும் (`git -v`).
* **VS Code / Cursor / Terminal:** இரண்டு டெர்மினல் விண்டோக்கள் (Terminal Tabs) தேவைப்படும்.

---

# 2. படி 1: லைவ் Supabase டேட்டாபேஸை தயார் செய்தல் (Init Supabase DB)

இந்த கமாண்ட், கிளவுடில் உள்ள Supabase PostgreSQL டேட்டாபேஸுடன் இணைந்து, தேவைப்படும் **10 முக்கிய அட்டவணைகளையும் (Tables & Indexes)** தானாக உருவாக்கி, டெமோவிற்கான மாதிரித் தரவுகளையும் (Sample Users & Reports) உள்ளீடு செய்யும்.

### 💻 நீங்கள் இயக்க வேண்டிய கமாண்ட்:
VS Code-ல் டெர்மினலைத் திறந்து (மெயின் போல்டர் `D:\findit`-ல் இருக்க வேண்டும்):

```bash
node backend/init_db.js
```

### ✅ வெற்றிகரமாக முடிந்தால் டெர்மினலில் வரும் வெளியீடு (Expected Output):
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

> 💡 **குறிப்பு:** இந்த கமாண்டை நீங்கள் முதல் முறை ப்ராஜெக்ட் அமைக்கும் போது அல்லது டேட்டாபேஸை ரீசெட் செய்ய நினைக்கும் போது ஒருமுறை இயக்கினால் போதுமானது!

---

# 3. படி 2: Backend சர்வரை துவக்குதல் (Port 5000)

இது Node.js REST API சர்வர் ஆகும். இதுவே AI மேட்சிங், OTP சரிபார்ப்பு, மற்றும் கிரிப்டோகிராஃபிக் ஹேண்டோவர் (SHA-256) பரிவர்த்தனைகளை கையாளுகிறது.

### 💻 நீங்கள் இயக்க வேண்டிய கமாண்ட்:
முதல் டெர்மினலில் (Terminal 1) பின்வரும் கமாண்டுகளை இயக்கவும்:

```bash
cd d:\findit\backend
node server.js
```
*(அல்லது மெயின் ரூட் போல்டரில் இருந்து: `node backend/server.js`)*

### ✅ வெற்றிகரமாக இயங்கினால் வரும் வெளியீடு:
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

### 🌐 Backend சரியாக வேலை செய்கிறதா என்று சோதிக்க:
உங்கள் பிரவுசரில் இந்த லிங்க்கை திறந்து பார்க்கவும்:
👉 **[http://localhost:5000/api/health](http://localhost:5000/api/health)**

**பிரவுசரில் வரும் பதில் (JSON Output):**
```json
{
  "status": "online",
  "service": "FindBack AI Enterprise Backend",
  "environment": "production",
  "database_engine": "postgresql_connected",
  "uptime_seconds": 12,
  "active_connections": 0
}
```
> ⚠️ **முக்கியம்:** இந்த டெர்மினலை மூடக்கூடாது (Do NOT close this terminal). பேக்கெண்ட் பின்னணியில் தொடர்ந்து ஓடிக்கொண்டிருக்க வேண்டும்!

---

# 4. படி 3: Frontend Vite ஆப்பை துவக்குதல் (Port 5173)

இப்போது Frontend UI ஆப்பை இயக்க வேண்டும்.

### 💻 நீங்கள் இயக்க வேண்டிய கமாண்ட்:
VS Code-ல் **புதிய டெர்மினல் டேப் (New Terminal - Terminal 2)** திறந்து, மெயின் போல்டரில் (`d:\findit`) பின்வருமாறு இயக்கவும்:

```bash
cd d:\findit
npm run dev
```

### ✅ வெற்றிகரமாக இயங்கினால் வரும் வெளியீடு:
```text
  VITE v6.4.3  ready in 1845 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

# 5. படி 4: பிரவுசரில் நேரடி டெஸ்டிங் செய்தல் (Live Testing Guide)

இப்போது உங்கள் Google Chrome அல்லது Edge பிரவுசரை திறந்து பின்வரும் பக்கங்களை பார்வையிடவும்:

### 🔗 1. பயனர் பக்கம் (User Main App):
👉 **[http://localhost:5173](http://localhost:5173)**
* **டாஷ்போர்டு:** தொலைந்த பொருட்கள் மற்றும் கண்டெடுக்கப்பட்ட பொருட்களின் விவரங்கள் அழகாக தோன்றும்.
* **பொருளை ரிப்போர்ட் செய்ய (Report Lost / Found):**
  * மேல் உள்ள "Report Lost" பட்டனை கிளிக் செய்து கேமரா படம் அல்லது லொகேஷன் கொடுத்து புதிய பொருளைப் பதிவு செய்யலாம்.
* **AI Matches பக்கம்:**
  * இடது மெனுவில் உள்ள **"AI Matches"**-ஐ கிளிக் செய்தால், செயற்கை நுண்ணறிவு கணக்கிட்ட Confidence சதவீதத்துடன் (எ.கா: 85% Match) பொருட்கள் மேட்ச் ஆகி காட்டும்!
* **Claim செய்தல்:**
  * மேட்ச் ஆன பொருளுக்கு நேராக உள்ள **"Claim Item"** கிளிக் செய்து உரிமையாளருக்கான ஆதாரத்தை (பில், ரசீது அல்லது குறிப்பு) பதிவேற்றலாம்.

### 🔗 2. நிர்வாகி பக்கம் (Enterprise Admin Console):
👉 **[http://localhost:5173/enterprise-admin](http://localhost:5173/enterprise-admin)**
* **செக்யூரிட்டி ஆபீசர் / அட்மின் டாஷ்போர்டு:**
  * பயனர்கள் கோரிய உரிமைகோரல்களை (Claims) சரிபார்த்து **"Approve"** அல்லது **"Reject"** செய்யலாம்.
  * அப்ரூவ் செய்தவுடன் சிஸ்டம் ஒரு **6-இலக்க ரகசிய OTP (Verification Code)**-ஐ உருவாக்கும்.
  * அந்த OTP-ஐ கொடுத்து ஹேண்டோவரை முடிக்கும் போது, ஒரு **டிஜிட்டல் SHA-256 கிரிப்டோகிராஃபிக் சான்றிதழ்** திரையில் உருவாகும்!

---

# 6. படி 5: அனைத்து செக்யூரிட்டி & யூனிட் டெஸ்ட்களை சரிபார்த்தல் (`npm test`)

ப்ராஜெக்ட்டில் உள்ள அனைத்து பாதுகாப்புக் கட்டுப்பாடுகள், RLS கொள்கைகள், மற்றும் AI சமன்பாடுகள் சரியாக உள்ளதா என்பதை தானியங்கி டெஸ்ட் மூலம் நிரூபிக்கலாம்.

### 💻 நீங்கள் இயக்க வேண்டிய கமாண்ட்:
மெயின் போல்டரில் (`d:\findit`) டெர்மினலில் இயக்கவும்:

```bash
npm test
```

### ✅ வெற்றிகரமாக முடிந்தால் வரும் வெளியீடு:
```text
══════════════════════════════════════════════════════════════
  EXECUTIVE SUMMARY
══════════════════════════════════════════════════════════════
  Total  : 26
  PASSED : 26
  FAILED : 0
  RATE   : 100%
══════════════════════════════════════════════════════════════

  ALL 26 TEST CASES PASSED! FindBack AI is production-ready.
```
> 🎯 **குறிப்பு:** இந்த 26 டெஸ்ட்களும் பாஸ் ஆவது உங்கள் ப்ராஜெக்ட்டின் தரத்திற்கு மிகப்பெரிய பலம்!

---

# 7. படி 6: Android Mobile APK உருவாக்குதல் (Capacitor Native Build)

இந்த வெப் அப்ளிகேஷனை ஒரு மொபைல் ஆண்ட்ராய்டு ஆப்பாக (`.apk`) மாற்றுவதற்கான எளிய படிகள்:

### 💻 நீங்கள் இயக்க வேண்டிய கமாண்டுகள் (வரிசையாக):

#### 1. பிரொடக்ஷன் பண்டிலை பில்ட் செய்தல்:
```bash
npm run build
```
*(இது உங்கள் React கோப்புகளை அதிவேக `dist/` ஃபோல்டராக மாற்றும்)*

#### 2. வெப் கோப்புகளை ஆண்ட்ராய்டுடன் இணைத்தல்:
```bash
npx cap sync android
```
*(இது Capacitor கேமரா மற்றும் GPS பிளக்கின்களை ஆண்ட்ராய்டுடன் ஒத்திசைக்கும்)*

#### 3. ஆண்ட்ராய்டு ஸ்டுடியோவில் திறத்தல்:
```bash
npx cap open android
```
*(உங்கள் கணினியில் Android Studio தானாகத் திறக்கும்)*

### 📱 Android Studio-வில் APK எடுக்கும் முறை:
1. Android Studio திறந்ததும், Gradle Sync முடியும் வரை 1 நிமிடம் காத்திருக்கவும்.
2. மேலே உள்ள மெனுவில் **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)** என்பதை கிளிக் செய்யவும்.
3. சில வினாடிகளில் வலது கீழ் மூலையில் **"locate"** என்ற லிங்க் வரும். அதை கிளிக் செய்தால் உங்கள் **`app-debug.apk`** கோப்பு கிடைக்கும்!
4. அதை உங்கள் ஆண்ட்ராய்டு போனில் இன்ஸ்டால் செய்து கேமரா மற்றும் GPS வசதியுடன் பயன்படுத்தலாம்.

---

# 8. ⚠️ அடிக்கடி வரும் சந்தேகங்களும் உடனடி தீர்வுகளும் (Troubleshooting)

### கேள்வி 1: `Port 5000 is already in use` என்று எரர் வந்தால் என்ன செய்வது?
* **காரணம்:** ஏற்கனவே பின்னணியில் ஒரு Node சர்வர் ஓடிக்கொண்டிருக்கிறது.
* **தீர்வு (PowerShell-ல் அடிக்கவும்):**
  ```powershell
  Get-Process node | Stop-Process -Force
  ```
  இதன் பின் மீண்டும் `node backend/server.js` இயக்கினால் சர்வர் சுத்தமாக துவங்கும்.

### கேள்வி 2: பிரவுசரில் `404 Endpoint not found` என்று வந்தால்?
* **தீர்வு:** நமது பேக்கெண்ட் சர்வரில் **Universal Route Normalizer** பொருத்தப்பட்டுள்ளது. எனவே Frontend-ல் இருந்து வரும் கோரிக்கைகள் தானாகவே சீரமைக்கப்படும். பேக்கெண்ட் சர்வர் போர்ட் 5000-ல் ஓடுகிறதா என்பதை `http://localhost:5000/api/health` திறந்து உறுதி செய்யவும்.

### கேள்வி 3: இன்டர்நெட் இல்லாத ஆஃப்லைன் சூழலில் இயக்க முடியுமா?
* **தீர்வு:** ஆம்! இன்டர்நெட் அல்லது Supabase இணைப்பு கிடைக்கவில்லை என்றால், சிஸ்டம் தானாகவே உள்நாட்டில் உள்ள **`local_db.json`** கோப்பிற்கு மாறி எந்தவித பாதிப்பும் இல்லாமல் வேலை செய்யும்.

---

### 🌟 சுருக்கமான கட்டளைகளின் பட்டியல் (Cheat Sheet):
| செயல்பாடு | கட்டளை |
| :--- | :--- |
| **டேட்டாபேஸ் Init** | `node backend/init_db.js` |
| **Backend ரன் செய்ய** | `cd backend && node server.js` |
| **Frontend ரன் செய்ய** | `npm run dev` |
| **ஆடிட் டெஸ்ட் ரன் செய்ய** | `npm test` |
| **Android APK பில்ட்** | `npm run build && npx cap sync android && npx cap open android` |
