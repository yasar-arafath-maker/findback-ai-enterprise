/**
 * ZEXO / FindBack AI — Native Node Backend Server & File Database Persistence Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero-dependency native Node.js HTTP server running on port 5000 backed by a local JSON file DB (`local_db.json`).
 * Features Server-Sent Events (SSE) live broadcast (/api/events) for instant cross-device sync between laptop & mobile.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'local_db.json');
const PORT = process.env.PORT || 5000;
const startTime = Date.now();

// Server-Sent Events (SSE) subscribers client set
const sseClients = new Set();

const broadcastEvent = (eventType, payload = {}) => {
  const data = JSON.stringify({ type: eventType, timestamp: new Date().toISOString(), ...payload });
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
};

// Initialize Database Storage File
const defaultDb = {
  User: [
    {
      id: 'user-default-1',
      email: 'user@example.com',
      full_name: 'Demo User',
      role: 'user',
      account_status: 'active',
      created_date: new Date().toISOString(),
    },
    {
      id: 'admin-default-1',
      email: 'admin@findback.app',
      full_name: 'Admin Supervisor',
      role: 'admin',
      account_status: 'active',
      created_date: new Date().toISOString(),
    },
  ],
  LostReports: [],
  FoundReports: [],
  AIMatches: [],
  Claims: [],
  OwnershipEvidence: [],
  Handovers: [],
  Notifications: [],
  Sessions: {},
};

const sampleLostReports = [
  { id: "lost-seed-101", title: "MacBook Air M2 (Space Grey) in Leather Sleeve", category: "Electronics", description: "Space Grey 13-inch MacBook Air M2 in dark brown leather sleeve.", brand: "Apple", color: "Space Grey", location_text: "KRCT Central Library", location_lat: 10.8231, location_lng: 78.6942, reporter_id: "user-sarah-101", lost_date: "2026-08-26", lost_time: "14:30", status: "active", created_date: "2026-08-26T14:30:00.000Z" },
  { id: "lost-seed-102", title: "Apple iPhone 15 Pro Max (Natural Titanium)", category: "Electronics", description: "Natural Titanium iPhone 15 Pro Max with matte screen protector.", brand: "Apple", color: "Natural Titanium", location_text: "KRCT Campus Cafeteria", location_lat: 10.8238, location_lng: 78.6948, reporter_id: "user-anand-103", lost_date: "2026-08-25", lost_time: "12:45", status: "active", created_date: "2026-08-25T12:45:00.000Z" },
  { id: "lost-seed-103", title: "Wildcraft Black Leather Wallet with Student ID", category: "Bags", description: "Black bi-fold leather wallet containing student ID card.", brand: "Wildcraft", color: "Black", location_text: "KRCT Sports Complex", location_lat: 10.8242, location_lng: 78.6952, reporter_id: "user-karthik-105", lost_date: "2026-08-24", lost_time: "17:15", status: "active", created_date: "2026-08-24T17:15:00.000Z" }
];

const sampleFoundReports = [
  { id: "found-seed-201", title: "MacBook Air M2 (Space Grey) found near Library Lounge", category: "Electronics", description: "Found Space Grey MacBook Air inside brown leather case.", brand: "Apple", color: "Space Grey", location_text: "KRCT Central Library Study Lounge", location_lat: 10.8232, location_lng: 78.6943, finder_id: "user-priya-109", current_holder_location: "Central Library Security Desk", found_date: "2026-08-26", found_time: "15:00", status: "active", created_date: "2026-08-26T15:00:00.000Z" },
  { id: "found-seed-202", title: "iPhone 15 Pro Max found at Cafeteria Counter", category: "Electronics", description: "Found Natural Titanium iPhone 15 Pro with blue ring stand.", brand: "Apple", color: "Natural Titanium", location_text: "KRCT Campus Cafeteria", location_lat: 10.8239, location_lng: 78.6949, finder_id: "user-priya-109", current_holder_location: "Cafeteria Manager Office", found_date: "2026-08-25", found_time: "13:10", status: "active", created_date: "2026-08-25T13:10:00.000Z" }
];

const sampleAIMatches = [
  { id: "match-seed-301", lost_report_id: "lost-seed-101", found_report_id: "found-seed-201", overall_confidence_score: 96.5, text_similarity_score: 98.0, spatial_proximity_km: 0.015, temporal_proximity_hours: 0.5, status: "suggested", ai_recommendation: "HIGH CONFIDENCE MATCH: Match verified by SimHash text analysis and spatial proximity (15m).", created_date: "2026-08-26T15:05:00.000Z" },
  { id: "match-seed-302", lost_report_id: "lost-seed-102", found_report_id: "found-seed-202", overall_confidence_score: 94.2, text_similarity_score: 95.0, spatial_proximity_km: 0.02, temporal_proximity_hours: 0.4, status: "suggested", ai_recommendation: "HIGH CONFIDENCE MATCH: Titanium iPhone 15 Pro Max matched with ring stand.", created_date: "2026-08-25T13:15:00.000Z" }
];

const sampleClaims = [
  { id: "claim-seed-401", match_id: "match-seed-301", claimant_id: "user-sarah-101", claimant_notes: "This is my MacBook Air M2.", status: "approved", evidence_score: 98.0, verification_hash: "0x8F9C2B1D4E3A7F0B", created_date: "2026-08-26T16:00:00.000Z" }
];

const sampleHandovers = [
  { id: "handover-seed-501", claim_id: "claim-seed-401", cert_id: "ZEXO-CERT-88492015", item_name: "MacBook Air M2 (Space Grey)", authority_name: "KRCT Central Library Security Desk", officer_name: "Inspector R. Sharma (Badge #8839)", recipient_email: "sarah.m@gmail.com", signature_hash: "0x9E8D7C6B5A4F3E2D", timestamp: "2026-08-26 17:30:00", created_date: "2026-08-26T17:30:00.000Z" }
];

const loadDatabase = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const loaded = { ...defaultDb, ...JSON.parse(data) };
      
      // Auto-fill collections if empty
      let dirty = false;
      if (!loaded.LostReports || loaded.LostReports.length === 0) { loaded.LostReports = sampleLostReports; dirty = true; }
      if (!loaded.FoundReports || loaded.FoundReports.length === 0) { loaded.FoundReports = sampleFoundReports; dirty = true; }
      if (!loaded.AIMatches || loaded.AIMatches.length === 0) { loaded.AIMatches = sampleAIMatches; dirty = true; }
      if (!loaded.Claims || loaded.Claims.length === 0) { loaded.Claims = sampleClaims; dirty = true; }
      if (!loaded.Handovers || loaded.Handovers.length === 0) { loaded.Handovers = sampleHandovers; dirty = true; }

      if (dirty) {
        saveDatabase(loaded);
      }
      return loaded;
    }
  } catch (err) {
    console.error('[Server DB] Read error:', err.message);
  }
  saveDatabase(defaultDb);
  return defaultDb;
};

const saveDatabase = (dbData, updatedEntity = '') => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
    if (updatedEntity) {
      broadcastEvent('DB_UPDATED', { entity: updatedEntity });
    }
  } catch (err) {
    console.error('[Server DB] Write error:', err.message);
  }
};

let dbStore = loadDatabase();

const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma',
  });
  res.end(JSON.stringify(data));
};

const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma',
    });
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = reqUrl.pathname;

  // ── Health & Stats Endpoints ──
  if (pathname === '/api/health') {
    let dbSize = 0;
    try {
      if (fs.existsSync(DB_FILE)) dbSize = fs.statSync(DB_FILE).size;
    } catch {}

    return sendJSON(res, 200, {
      status: 'online',
      server: 'ZEXO Native SSE Node Server',
      database_file: DB_FILE,
      db_size_bytes: dbSize,
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
      active_connections: sseClients.size,
      timestamp: new Date().toISOString(),
    });
  }

  if (pathname === '/api/stats') {
    dbStore = loadDatabase();
    return sendJSON(res, 200, {
      users_count: dbStore.User?.length || 0,
      lost_reports_count: dbStore.LostReports?.length || 0,
      found_reports_count: dbStore.FoundReports?.length || 0,
      ai_matches_count: dbStore.AIMatches?.length || 0,
      handovers_count: dbStore.Handovers?.length || 0,
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    });
  }

  // ── Read-Only Enterprise Telemetry Viewer Endpoint ──
  if (pathname === '/api/enterprise-console' && req.method === 'GET') {
    dbStore = loadDatabase();
    return sendJSON(res, 200, {
      status: 'active',
      server: 'ZEXO Enterprise Telemetry Engine',
      database_file: DB_FILE,
      timestamp: new Date().toISOString(),
      collections: {
        users: dbStore.User || [],
        lost_reports: dbStore.LostReports || [],
        found_reports: dbStore.FoundReports || [],
        ai_matches: dbStore.AIMatches || [],
        claims: dbStore.Claims || [],
        handovers: dbStore.Handovers || [],
        notifications: dbStore.Notifications || [],
      },
    });
  }

  // ── Real-Time SSE Stream Endpoint ──
  if (pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // ── Auth Endpoints ──
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await parseBody(req);
    const { email, full_name, name, fullName, phone } = body;
    if (!email) return sendJSON(res, 400, { error: 'Email is required' });

    const nameVal = full_name || name || fullName || email.split('@')[0];

    dbStore = loadDatabase();
    let existing = dbStore.User.find((u) => u.email === email);
    if (!existing) {
      existing = {
        id: `user-${Date.now()}`,
        email,
        full_name: nameVal,
        phone: phone || '',
        role: 'user',
        account_status: 'active',
        created_date: new Date().toISOString(),
      };
      dbStore.User.push(existing);
    } else {
      if (nameVal && nameVal !== email.split('@')[0]) existing.full_name = nameVal;
      if (phone) existing.phone = phone;
    }

    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    dbStore.Sessions[token] = existing;
    saveDatabase(dbStore, 'User');

    return sendJSON(res, 200, { status: 'success', token, user: existing });
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const { email, full_name, name, fullName } = body;
    if (!email) return sendJSON(res, 400, { error: 'Email is required' });

    const nameVal = full_name || name || fullName || email.split('@')[0];

    dbStore = loadDatabase();
    let user = dbStore.User.find((u) => u.email === email);
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        email,
        full_name: nameVal,
        role: email.includes('admin') ? 'admin' : 'user',
        account_status: 'active',
        created_date: new Date().toISOString(),
      };
      dbStore.User.push(user);
    } else if (nameVal && nameVal !== email.split('@')[0]) {
      user.full_name = nameVal;
    }

    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    dbStore.Sessions[token] = user;
    saveDatabase(dbStore, 'User');

    return sendJSON(res, 200, { status: 'success', access_token: token, user });
  }

  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || reqUrl.searchParams.get('token');
    dbStore = loadDatabase();

    if (token && dbStore.Sessions[token]) {
      return sendJSON(res, 200, { user: dbStore.Sessions[token] });
    }

    if (dbStore.User.length > 0) {
      return sendJSON(res, 200, { user: dbStore.User[0] });
    }

    return sendJSON(res, 200, { user: null });
  }

  // ── Entity CRUD ──
  const entityMatch = pathname.match(/^\/api\/entities\/([^\/]+)(?:\/([^\/]+))?$/);
  if (entityMatch) {
    const entityName = entityMatch[1];
    const id = entityMatch[2];
    dbStore = loadDatabase();
    if (!dbStore[entityName]) dbStore[entityName] = [];

    if (req.method === 'GET') {
      if (id) {
        const item = dbStore[entityName].find((x) => x.id === id);
        return item ? sendJSON(res, 200, item) : sendJSON(res, 404, { error: 'Item not found' });
      }

      let list = dbStore[entityName];
      reqUrl.searchParams.forEach((val, key) => {
        if (key !== '_orderBy' && key !== '_limit') {
          list = list.filter((item) => String(item[key]) === String(val));
        }
      });
      return sendJSON(res, 200, list);
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const newItem = {
        id: `${entityName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        created_date: new Date().toISOString(),
        status: 'active',
        ...body,
      };
      dbStore[entityName].push(newItem);
      saveDatabase(dbStore, entityName);
      return sendJSON(res, 201, newItem);
    }

    if (req.method === 'PUT' && id) {
      const body = await parseBody(req);
      const idx = dbStore[entityName].findIndex((x) => x.id === id);
      if (idx >= 0) {
        dbStore[entityName][idx] = {
          ...dbStore[entityName][idx],
          ...body,
          updated_date: new Date().toISOString(),
        };
        saveDatabase(dbStore, entityName);
        return sendJSON(res, 200, dbStore[entityName][idx]);
      }
    }

    if (req.method === 'DELETE' && id) {
      dbStore[entityName] = dbStore[entityName].filter((x) => x.id !== id);
      saveDatabase(dbStore, entityName);
      return sendJSON(res, 200, { id, deleted: true });
    }
  }

  sendJSON(res, 404, { error: 'Endpoint not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  ZEXO Server Active on http://0.0.0.0:${PORT}`);
  console.log(`  Real-Time SSE Sync Stream: http://0.0.0.0:${PORT}/api/events`);
  console.log(`  Local Storage File: ${DB_FILE}`);
  console.log(`=======================================================`);
});
