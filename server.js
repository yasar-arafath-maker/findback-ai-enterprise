/**
 * FindBack AI Enterprise (ZEXO) — Unified Root Server Entry Point
 * ──────────────────────────────────────────────────────────────
 * Forwards execution directly to the canonical backend server implementation
 * in ./backend/server.js. This guarantees a single source of truth for:
 *   - Database connection & schema initialization
 *   - Unified fallback database (backend/local_db.json)
 *   - Universal REST, SSE broadcast, & AI function endpoints
 */

import './backend/server.js';
