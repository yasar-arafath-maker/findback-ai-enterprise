import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ── Dev-only mock ───────────────────────────────────────────────────────
// The unconditional admin fallback has been removed.  A mock is now only
// installed when the developer explicitly sets VITE_DEV_BYPASS_AUTH=true.
// In *all* other cases the real Base44 SDK client (injected by the
// platform into globalThis.__B44_DB__) is the sole auth provider.
//
// The canonical fallback logic lives in base44Client.js – we import it
// here only to ensure the module is evaluated before React renders.
import '@/api/base44Client'  // side-effect: sets up db singleton

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
