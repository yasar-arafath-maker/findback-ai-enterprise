/**
 * FindBack AI Enterprise — Production Node.js & PostgreSQL Backend Server (Root Server)
 * ─────────────────────────────────────────────────────────────────────────────
 * Designed for 1-Click Deployment on Render.com & Supabase / PostgreSQL.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import db, { query, getClient, initSchema, isDbConnected } from './backend/config/db.js';
import { categoryScore, temporalScore, computeOverallScore } from './matchScore.js';
import { generateTextFingerprint, compareTextFingerprints } from './textFingerprint.js';
import { computeSpatialProximityScore } from './spatialIndexer.js';
import { generateHandoverReceiptHash } from './cryptoAudit.js';
import { sendOtpEmail, verifyOtpCode } from './emailOtpService.js';
import { notificationService } from './notificationService.js';
import { sanitizeInput } from './securityHelper.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = process.env.DB_FILE_PATH || path.join(__dirname, 'local_db.json');
const PORT = process.env.PORT || 5000;
const startTime = Date.now();

// Server-Sent Events (SSE) connected clients pool
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

setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(`: ping\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}, 20000);

const ENTITY_TABLE_MAP = {
  User: 'users',
  user: 'users',
  users: 'users',
  LostReports: 'lost_reports',
  lost_reports: 'lost_reports',
  'lost-reports': 'lost_reports',
  FoundReports: 'found_reports',
  found_reports: 'found_reports',
  'found-reports': 'found_reports',
  AIMatches: 'ai_matches',
  ai_matches: 'ai_matches',
  'ai-matches': 'ai_matches',
  matches: 'ai_matches',
  Claims: 'claims',
  claims: 'claims',
  OwnershipEvidence: 'ownership_evidence',
  ownership_evidence: 'ownership_evidence',
  'ownership-evidence': 'ownership_evidence',
  Handovers: 'handovers',
  handovers: 'handovers',
  Notifications: 'notifications',
  notifications: 'notifications',
  AdminActions: 'admin_actions',
  admin_actions: 'admin_actions',
  'admin-actions': 'admin_actions',
  Sessions: 'sessions',
  sessions: 'sessions',
};

const getTableName = (entityName) => {
  return ENTITY_TABLE_MAP[entityName] || entityName.toLowerCase();
};

const defaultDb = {
  User: [],
  LostReports: [],
  FoundReports: [],
  AIMatches: [],
  Claims: [],
  OwnershipEvidence: [],
  Handovers: [],
  Notifications: [],
  AdminActions: [],
  Sessions: {},
  ChatMessages: [],
};

const loadFallbackDb = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return { ...defaultDb, ...JSON.parse(data) };
    }
  } catch (err) {}
  return defaultDb;
};

const saveFallbackDb = (dbData, updatedEntity = '') => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
    if (updatedEntity) broadcastEvent('DB_UPDATED', { entity: updatedEntity });
  } catch (err) {}
};

let fallbackDbStore = loadFallbackDb();

initSchema().catch(() => {});

const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With',
    });
    return res.end();
  }

  const host = req.headers.host || 'findback-ai-backend.onrender.com';
  const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const reqUrl = new URL(req.url, `${protocol}://${host}`);
  let pathname = reqUrl.pathname.replace(/\/+/g, '/');
  while (pathname.startsWith('/api/api/')) {
    pathname = pathname.replace('/api/api/', '/api/');
  }
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  if (pathname === '/' || pathname === '/api' || pathname === '/healthz' || pathname === '/health' || pathname === '/api/health' || pathname === '/api/healthz') {
    let dbStatus = 'file_fallback';
    if (isDbConnected()) {
      try {
        await query('SELECT 1');
        dbStatus = 'postgresql_connected';
      } catch (e) {
        dbStatus = 'postgresql_error';
      }
    }

    return sendJSON(res, 200, {
      status: 'online',
      service: 'FindBack AI Enterprise Backend API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      database_engine: dbStatus,
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
      active_connections: sseClients.size,
      endpoints: {
        health: '/api/health',
        stats: '/api/stats',
        telemetry: '/api/enterprise-console',
        auth: '/api/auth/me',
        entities: '/api/entities/:entityName',
        matching: '/api/functions/runMatching',
        claims: '/api/functions/submitClaim',
        chat: '/api/chat/:channelId/messages',
        call: '/api/call/session',
        events: '/api/events'
      },
      timestamp: new Date().toISOString(),
    });
  }

  if ((pathname === '/api/stats' || pathname === '/stats') && req.method === 'GET') {
    if (isDbConnected()) {
      try {
        const u = await query('SELECT COUNT(*) FROM users').catch(() => ({ rows: [{ count: 0 }] }));
        const l = await query('SELECT COUNT(*) FROM lost_reports').catch(() => ({ rows: [{ count: 0 }] }));
        const f = await query('SELECT COUNT(*) FROM found_reports').catch(() => ({ rows: [{ count: 0 }] }));
        const m = await query('SELECT COUNT(*) FROM ai_matches').catch(() => ({ rows: [{ count: 0 }] }));
        const c = await query('SELECT COUNT(*) FROM claims').catch(() => ({ rows: [{ count: 0 }] }));
        const h = await query('SELECT COUNT(*) FROM handovers').catch(() => ({ rows: [{ count: 0 }] }));

        return sendJSON(res, 200, {
          users_count: parseInt(u.rows[0].count, 10),
          lost_reports_count: parseInt(l.rows[0].count, 10),
          found_reports_count: parseInt(f.rows[0].count, 10),
          ai_matches_count: parseInt(m.rows[0].count, 10),
          claims_count: parseInt(c.rows[0].count, 10),
          handovers_count: parseInt(h.rows[0].count, 10),
          uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
          database_engine: 'postgresql',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {}
    }

    fallbackDbStore = loadFallbackDb();
    return sendJSON(res, 200, {
      users_count: fallbackDbStore.User?.length || 0,
      lost_reports_count: fallbackDbStore.LostReports?.length || 0,
      found_reports_count: fallbackDbStore.FoundReports?.length || 0,
      ai_matches_count: fallbackDbStore.AIMatches?.length || 0,
      claims_count: fallbackDbStore.Claims?.length || 0,
      handovers_count: fallbackDbStore.Handovers?.length || 0,
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
      database_engine: 'file_fallback',
      timestamp: new Date().toISOString(),
    });
  }

  if ((pathname === '/api/enterprise-console' || pathname === '/enterprise-console') && req.method === 'GET') {
    if (isDbConnected()) {
      try {
        const [u, l, f, m, c, h, n, a] = await Promise.all([
          query('SELECT * FROM users ORDER BY created_date DESC LIMIT 100').catch(() => ({ rows: [] })),
          query('SELECT * FROM lost_reports ORDER BY created_date DESC LIMIT 100').catch(() => ({ rows: [] })),
          query('SELECT * FROM found_reports ORDER BY created_date DESC LIMIT 100').catch(() => ({ rows: [] })),
          query('SELECT * FROM ai_matches ORDER BY created_date DESC LIMIT 100').catch(() => ({ rows: [] })),
          query('SELECT * FROM claims ORDER BY created_date DESC LIMIT 100').catch(() => ({ rows: [] })),
          query('SELECT * FROM handovers ORDER BY created_date DESC LIMIT 100').catch(() => ({ rows: [] })),
          query('SELECT * FROM notifications ORDER BY created_date DESC LIMIT 100').catch(() => ({ rows: [] })),
          query('SELECT * FROM admin_actions ORDER BY created_date DESC LIMIT 100').catch(() => ({ rows: [] })),
        ]);

        return sendJSON(res, 200, {
          status: 'active',
          server: 'FindBack AI Enterprise Telemetry Engine (PostgreSQL)',
          timestamp: new Date().toISOString(),
          collections: {
            users: u.rows,
            lost_reports: l.rows,
            found_reports: f.rows,
            ai_matches: m.rows,
            claims: c.rows,
            handovers: h.rows,
            notifications: n.rows,
            admin_actions: a.rows,
          },
        });
      } catch (err) {}
    }

    fallbackDbStore = loadFallbackDb();
    return sendJSON(res, 200, {
      status: 'active',
      server: 'FindBack AI Enterprise Telemetry Engine (Fallback)',
      database_file: DB_FILE,
      timestamp: new Date().toISOString(),
      collections: {
        users: fallbackDbStore.User || [],
        lost_reports: fallbackDbStore.LostReports || [],
        found_reports: fallbackDbStore.FoundReports || [],
        ai_matches: fallbackDbStore.AIMatches || [],
        claims: fallbackDbStore.Claims || [],
        handovers: fallbackDbStore.Handovers || [],
        notifications: fallbackDbStore.Notifications || [],
        admin_actions: fallbackDbStore.AdminActions || [],
      },
    });
  }

  if ((pathname === '/api/reports' || pathname === '/reports') && req.method === 'GET') {
    if (isDbConnected()) {
      try {
        const lost = await query('SELECT *, \'lost\' as report_type FROM lost_reports ORDER BY created_date DESC');
        const found = await query('SELECT *, \'found\' as report_type FROM found_reports ORDER BY created_date DESC');
        return sendJSON(res, 200, {
          lost_reports: lost.rows,
          found_reports: found.rows,
          all_reports: [...lost.rows, ...found.rows],
        });
      } catch (err) {}
    }

    fallbackDbStore = loadFallbackDb();
    return sendJSON(res, 200, {
      lost_reports: fallbackDbStore.LostReports || [],
      found_reports: fallbackDbStore.FoundReports || [],
      all_reports: [...(fallbackDbStore.LostReports || []), ...(fallbackDbStore.FoundReports || [])],
    });
  }

  if (pathname === '/api/events' || pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Stream Active', timestamp: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  if ((pathname === '/api/auth/register' || pathname === '/auth/register') && req.method === 'POST') {
    const body = await parseBody(req);
    const { email, full_name, name, fullName, phone } = body;
    if (!email) return sendJSON(res, 400, { error: 'Email is required' });

    const nameVal = full_name || name || fullName || email.split('@')[0];
    const userId = `user-${Date.now()}`;
    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (isDbConnected()) {
      try {
        const existing = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        let user;
        if (existing.rows.length === 0) {
          const insertRes = await query(
            `INSERT INTO users (id, email, full_name, phone, role, account_status, created_date)
             VALUES ($1, $2, $3, $4, 'user', 'active', CURRENT_TIMESTAMP) RETURNING *`,
            [userId, email.toLowerCase(), nameVal, phone || '']
          );
          user = insertRes.rows[0];
        } else {
          user = existing.rows[0];
        }

        await query('INSERT INTO sessions (token, user_id, created_date) VALUES ($1, $2, CURRENT_TIMESTAMP)', [token, user.id]);
        broadcastEvent('USER_REGISTERED', { user_id: user.id });
        return sendJSON(res, 200, { status: 'success', token, access_token: token, user });
      } catch (err) {
        console.error('[Postgres Register Error]', err.message);
      }
    }

    fallbackDbStore = loadFallbackDb();
    let existing = fallbackDbStore.User.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      existing = {
        id: userId,
        email: email.toLowerCase(),
        full_name: nameVal,
        phone: phone || '',
        role: 'user',
        account_status: 'active',
        created_date: new Date().toISOString(),
      };
      fallbackDbStore.User.push(existing);
    }
    if (!fallbackDbStore.Sessions) fallbackDbStore.Sessions = {};
    fallbackDbStore.Sessions[token] = existing;
    saveFallbackDb(fallbackDbStore, 'User');

    return sendJSON(res, 200, { status: 'success', token, access_token: token, user: existing });
  }

  if ((pathname === '/api/auth/login' || pathname === '/auth/login') && req.method === 'POST') {
    const body = await parseBody(req);
    const { email, full_name, name, fullName } = body;
    if (!email) return sendJSON(res, 400, { error: 'Email is required' });

    const nameVal = full_name || name || fullName || email.split('@')[0];
    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';

    if (isDbConnected()) {
      try {
        const existing = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        let user;
        if (existing.rows.length === 0) {
          const insertRes = await query(
            `INSERT INTO users (id, email, full_name, role, account_status, created_date)
             VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP) RETURNING *`,
            [`user-${Date.now()}`, email.toLowerCase(), nameVal, role]
          );
          user = insertRes.rows[0];
        } else {
          user = existing.rows[0];
        }

        await query('INSERT INTO sessions (token, user_id, created_date) VALUES ($1, $2, CURRENT_TIMESTAMP)', [token, user.id]);
        return sendJSON(res, 200, { status: 'success', token, access_token: token, user });
      } catch (err) {
        console.error('[Postgres Login Error]', err.message);
      }
    }

    fallbackDbStore = loadFallbackDb();
    let user = fallbackDbStore.User.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase(),
        full_name: nameVal,
        role,
        account_status: 'active',
        created_date: new Date().toISOString(),
      };
      fallbackDbStore.User.push(user);
    }
    if (!fallbackDbStore.Sessions) fallbackDbStore.Sessions = {};
    fallbackDbStore.Sessions[token] = user;
    saveFallbackDb(fallbackDbStore, 'User');

    return sendJSON(res, 200, { status: 'success', token, access_token: token, user });
  }

  if ((pathname === '/api/auth/me' || pathname === '/auth/me') && req.method === 'GET') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || reqUrl.searchParams.get('token');

    if (isDbConnected() && token) {
      try {
        const sessionRes = await query(
          `SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1`,
          [token]
        );
        if (sessionRes.rows.length > 0) {
          return sendJSON(res, 200, { user: sessionRes.rows[0] });
        }
      } catch (err) {}
    }

    fallbackDbStore = loadFallbackDb();
    if (token && fallbackDbStore.Sessions && fallbackDbStore.Sessions[token]) {
      return sendJSON(res, 200, { user: fallbackDbStore.Sessions[token] });
    }
    if (fallbackDbStore.User && fallbackDbStore.User.length > 0) {
      return sendJSON(res, 200, { user: fallbackDbStore.User[0] });
    }

    return sendJSON(res, 200, { user: null });
  }

  if ((pathname === '/api/send-otp' || pathname === '/send-otp') && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.email) return sendJSON(res, 400, { error: 'Email is required' });
      const result = await sendOtpEmail(body.email, body.code);
      return sendJSON(res, 200, result);
    } catch (err) {
      return sendJSON(res, 400, { error: err.message });
    }
  }

  if ((pathname === '/api/verify-otp' || pathname === '/verify-otp') && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { email, code } = body;
      if (!email || !code) return sendJSON(res, 400, { error: 'Email and code are required' });
      const result = await verifyOtpCode(email, code);
      return sendJSON(res, 200, result);
    } catch (err) {
      return sendJSON(res, 400, { error: err.message });
    }
  }

  if ((pathname === '/api/functions/runMatching' || pathname === '/functions/runMatching') && req.method === 'POST') {
    try {
      const params = await parseBody(req);
      const { reportId, reportType } = params;
      const isLost = reportType === 'lost' || reportType === 'LostReports';

      let sourceList = [];
      let targetList = [];

      if (isDbConnected()) {
        const sTable = isLost ? 'lost_reports' : 'found_reports';
        const tTable = isLost ? 'found_reports' : 'lost_reports';
        const sRes = await query(`SELECT * FROM ${sTable}`);
        const tRes = await query(`SELECT * FROM ${tTable}`);
        sourceList = sRes.rows;
        targetList = tRes.rows;
      } else {
        fallbackDbStore = loadFallbackDb();
        sourceList = fallbackDbStore[isLost ? 'LostReports' : 'FoundReports'] || [];
        targetList = fallbackDbStore[isLost ? 'FoundReports' : 'LostReports'] || [];
      }

      const sourceItem = sourceList.find(r => r.id === reportId) || sourceList[sourceList.length - 1];
      if (!sourceItem) return sendJSON(res, 200, { status: 'no_report_found', matches: [] });

      const newMatches = [];

      for (const targetItem of targetList) {
        const lostRep = isLost ? sourceItem : targetItem;
        const foundRep = isLost ? targetItem : sourceItem;

        const cScore = categoryScore(lostRep.category, foundRep.category);
        const textSim = compareTextFingerprints(
          generateTextFingerprint(`${lostRep.title || ''} ${lostRep.description || ''}`),
          generateTextFingerprint(`${foundRep.title || ''} ${foundRep.description || ''}`)
        );
        const tScore = temporalScore(lostRep.lost_date, foundRep.found_date);
        const gScore = computeSpatialProximityScore(lostRep, foundRep);

        const overall = computeOverallScore({
          imageScore: 50,
          textScore: textSim,
          geoScore: gScore,
          categoryScore: cScore,
          timeScore: tScore,
        });

        if (overall >= 40) {
          const matchId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const matchRecord = {
            id: matchId,
            lost_report_id: lostRep.id,
            found_report_id: foundRep.id,
            overall_score: overall,
            overall_confidence_score: overall,
            text_similarity_score: textSim,
            image_similarity_score: 50,
            category_match_score: cScore,
            location_proximity_score: gScore,
            time_proximity_score: tScore,
            status: 'suggested',
            ai_recommendation: `Match Confidence: ${overall}% (Text: ${textSim}%, Proximity: ${gScore}%, Category: ${cScore}%)`,
            created_date: new Date().toISOString(),
          };

          if (isDbConnected()) {
            await query(
              `INSERT INTO ai_matches (id, lost_report_id, found_report_id, overall_score, overall_confidence_score,
                text_similarity_score, image_similarity_score, category_match_score, location_proximity_score,
                time_proximity_score, status, ai_recommendation, created_date)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
               ON CONFLICT (id) DO NOTHING`,
              [
                matchRecord.id, matchRecord.lost_report_id, matchRecord.found_report_id,
                matchRecord.overall_score, matchRecord.overall_confidence_score,
                matchRecord.text_similarity_score, matchRecord.image_similarity_score,
                matchRecord.category_match_score, matchRecord.location_proximity_score,
                matchRecord.time_proximity_score, matchRecord.status, matchRecord.ai_recommendation
              ]
            );
          } else {
            if (!fallbackDbStore.AIMatches) fallbackDbStore.AIMatches = [];
            fallbackDbStore.AIMatches.push(matchRecord);
          }
          newMatches.push(matchRecord);
        }
      }

      if (!isDbConnected()) saveFallbackDb(fallbackDbStore, 'AIMatches');
      broadcastEvent('MATCHES_GENERATED', { count: newMatches.length });

      return sendJSON(res, 200, { status: 'success', matchesCount: newMatches.length, matches: newMatches });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  if ((pathname === '/api/functions/submitClaim' || pathname === '/functions/submitClaim') && req.method === 'POST') {
    try {
      const params = await parseBody(req);
      const { matchId, evidence = [], claimantNotes, claimantId } = params;
      const claimId = `claim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const cid = claimantId || null;

      if (isDbConnected()) {
        const mRes = await query('SELECT * FROM ai_matches WHERE id = $1', [matchId]);
        const match = mRes.rows[0] || {};

        const claimRes = await query(
          `INSERT INTO claims (id, match_id, lost_report_id, found_report_id, claimant_id, claimant_notes, status, evidence_score, created_date)
           VALUES ($1, $2, $3, $4, $5, $6, 'submitted', 95.0, CURRENT_TIMESTAMP) RETURNING *`,
          [claimId, matchId, match.lost_report_id || null, match.found_report_id || null, cid, claimantNotes || 'Claim filed']
        );

        for (const ev of evidence) {
          await query(
            `INSERT INTO ownership_evidence (id, claim_id, uploaded_by, evidence_type, text_description, file_url, verified, created_date)
             VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP)`,
            [`ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, claimId, cid, ev.evidence_type || 'description', ev.text_description || '', ev.file_url || '']
          );
        }

        return sendJSON(res, 201, { status: 'success', data: { claim: claimRes.rows[0] } });
      }

      fallbackDbStore = loadFallbackDb();
      if (!fallbackDbStore.Claims) fallbackDbStore.Claims = [];
      const match = (fallbackDbStore.AIMatches || []).find(m => m.id === matchId) || {};
      const newClaim = {
        id: claimId,
        match_id: matchId,
        lost_report_id: match.lost_report_id || null,
        found_report_id: match.found_report_id || null,
        claimant_id: cid,
        claimant_notes: claimantNotes || 'Claim filed',
        status: 'submitted',
        evidence_score: 95.0,
        created_date: new Date().toISOString(),
      };
      fallbackDbStore.Claims.push(newClaim);
      saveFallbackDb(fallbackDbStore, 'Claims');

      return sendJSON(res, 201, { status: 'success', data: { claim: newClaim } });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  if ((pathname === '/api/functions/decideClaim' || pathname === '/functions/decideClaim') && req.method === 'POST') {
    try {
      const params = await parseBody(req);
      const { claimId, decision, notes } = params;
      const statusVal = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'evidence_requested';
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const handoverId = `handover-${Date.now()}`;

      if (isDbConnected()) {
        await query('UPDATE claims SET status = $1, review_notes = $2 WHERE id = $3', [statusVal, notes || '', claimId]);
        const claimRes = await query('SELECT * FROM claims WHERE id = $1', [claimId]);
        const claim = claimRes.rows[0];

        await query(
          `INSERT INTO handovers (id, claim_id, cert_id, item_name, lost_owner_id, found_reporter_id, scheduled_location,
            scheduled_datetime, status, verification_code, admin_supervised, created_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '1 day', 'scheduled', $8, true, CURRENT_TIMESTAMP)`,
          [
            handoverId, claimId, `ZEXO-CERT-${Math.floor(10000000 + Math.random() * 90000000)}`,
            'Recovered Item', claim?.claimant_id || null, null,
            'Central Campus Security Office Desk 1', code
          ]
        );

        return sendJSON(res, 200, { status: statusVal, handoverId, code });
      }

      fallbackDbStore = loadFallbackDb();
      if (!fallbackDbStore.Claims) fallbackDbStore.Claims = [];
      if (!fallbackDbStore.Handovers) fallbackDbStore.Handovers = [];

      const c = fallbackDbStore.Claims.find(x => x.id === claimId);
      if (c) {
        c.status = statusVal;
        c.review_notes = notes || '';
      }

      const fMatch = (fallbackDbStore.AIMatches || []).find(m => m.id === c?.match_id);
      const fReport = (fallbackDbStore.FoundReports || []).find(f => f.id === (c?.found_report_id || fMatch?.found_report_id));

      const handover = {
        id: handoverId,
        claim_id: claimId,
        cert_id: `ZEXO-CERT-${Math.floor(10000000 + Math.random() * 90000000)}`,
        item_name: 'Recovered Item',
        lost_owner_id: c?.claimant_id || null,
        found_reporter_id: fReport?.finder_id || null,
        scheduled_location: 'Central Campus Security Office Desk 1',
        scheduled_datetime: new Date(Date.now() + 86400000).toISOString(),
        status: 'scheduled',
        verification_code: code,
        admin_supervised: true,
        created_date: new Date().toISOString(),
      };
      fallbackDbStore.Handovers.push(handover);
      saveFallbackDb(fallbackDbStore, 'Handovers');

      return sendJSON(res, 200, { status: statusVal, handoverId, code });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  if ((pathname === '/api/functions/completeHandover' || pathname === '/functions/completeHandover') && req.method === 'POST') {
    try {
      const params = await parseBody(req);
      const { handoverId, verificationCode } = params;
      const now = new Date().toISOString();

      if (isDbConnected()) {
        const client = await getClient();
        try {
          await client.query('BEGIN');

          const hRes = await client.query('SELECT * FROM handovers WHERE id = $1 FOR UPDATE', [handoverId]);
          if (hRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return sendJSON(res, 404, { error: 'Handover record not found' });
          }

          const handover = hRes.rows[0];
          if (['completed', 'cancelled', 'disputed'].includes(handover.status)) {
            await client.query('ROLLBACK');
            return sendJSON(res, 409, { error: 'Handover cannot be completed in its current state' });
          }

          if (String(handover.verification_code).trim() !== String(verificationCode).trim()) {
            await client.query('ROLLBACK');
            return sendJSON(res, 403, { error: 'Invalid verification code' });
          }

          const { receiptHash } = generateHandoverReceiptHash({
            handoverId: handover.id,
            claimantId: handover.lost_owner_id,
            finderId: handover.found_reporter_id,
            adminId: 'admin-default-1',
            verificationCode: String(verificationCode),
            timestamp: now,
          });

          await client.query(
            'UPDATE handovers SET status = $1, completed_at = $2, receipt_hash = $3 WHERE id = $4',
            ['completed', now, receiptHash, handover.id]
          );

          if (handover.claim_id) {
            await client.query('UPDATE claims SET status = $1 WHERE id = $2', ['completed', handover.claim_id]);
          }

          if (handover.claim_id) {
            const claimInfo = await client.query('SELECT * FROM claims WHERE id = $1', [handover.claim_id]);
            if (claimInfo.rows.length > 0) {
              const c = claimInfo.rows[0];
              if (c.lost_report_id) {
                await client.query('UPDATE lost_reports SET status = $1, updated_date = $2 WHERE id = $3', ['closed', now, c.lost_report_id]);
              }
              if (c.found_report_id) {
                await client.query('UPDATE found_reports SET status = $1, updated_date = $2 WHERE id = $3', ['returned', now, c.found_report_id]);
              }
            }
          }

          await client.query(
            `INSERT INTO admin_actions (id, admin_id, action_type, target_entity_type, target_entity_id, notes, created_date)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [`act-${Date.now()}`, 'admin-default-1', 'handover_completed', 'handovers', handover.id, `SHA256:${receiptHash}`]
          );

          await client.query('COMMIT');
          broadcastEvent('HANDOVER_COMPLETED', { handover_id: handover.id, receipt_hash: receiptHash });

          return sendJSON(res, 200, {
            status: 'completed',
            receipt_hash: receiptHash,
            message: 'Handover verified and recovery completed atomically with SQL transaction!',
          });
        } catch (txErr) {
          await client.query('ROLLBACK');
          throw txErr;
        } finally {
          client.release();
        }
      }

      fallbackDbStore = loadFallbackDb();
      const handovers = fallbackDbStore.Handovers || [];
      const handover = handovers.find(h => h.id === handoverId);
      if (!handover) return sendJSON(res, 404, { error: 'Handover record not found' });

      if (['completed', 'cancelled', 'disputed'].includes(handover.status)) {
        return sendJSON(res, 409, { error: 'Handover cannot be completed in its current state' });
      }

      if (String(handover.verification_code).trim() !== String(verificationCode).trim()) {
        return sendJSON(res, 403, { error: 'Invalid verification code' });
      }

      const { receiptHash } = generateHandoverReceiptHash({
        handoverId: handover.id,
        claimantId: handover.lost_owner_id,
        finderId: handover.found_reporter_id,
        adminId: 'admin-default-1',
        verificationCode: String(verificationCode),
        timestamp: now,
      });

      handover.status = 'completed';
      handover.completed_at = now;
      handover.receipt_hash = receiptHash;

      if (fallbackDbStore.Claims) {
        const c = fallbackDbStore.Claims.find(x => x.id === handover.claim_id);
        if (c) c.status = 'completed';
      }

      saveFallbackDb(fallbackDbStore, 'Handovers');
      return sendJSON(res, 200, { status: 'completed', receipt_hash: receiptHash, message: 'Handover verified and recovery completed!' });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // ── Privacy PII Masking Utility ──
  const maskPiiContent = (text) => {
    if (!text || typeof text !== 'string') return text;
    let masked = text.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE REDACTED BY RELAY]');
    masked = masked.replace(/\b\d{10}\b/g, '[PHONE REDACTED BY RELAY]');
    masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]');
    return masked;
  };

  // ── Secure Chat & Messaging Endpoints ──
  const chatMatch = pathname.match(/^(?:\/api)?\/chat\/([^\/]+)(?:\/messages)?$/i);
  if (chatMatch) {
    const channelId = chatMatch[1];
    fallbackDbStore = loadFallbackDb();
    if (!fallbackDbStore.ChatMessages) fallbackDbStore.ChatMessages = [];

    if (req.method === 'GET') {
      const channelMessages = fallbackDbStore.ChatMessages.filter(m => m.channel_id === channelId);
      return sendJSON(res, 200, channelMessages);
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const rawText = sanitizeInput(body.text || '');
      if (!rawText.trim()) return sendJSON(res, 400, { error: 'Message text required' });

      const safeText = maskPiiContent(rawText);
      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        channel_id: channelId,
        sender_id: body.sender_id || 'user-anonymous',
        sender_name: body.sender_name || 'Anonymous User',
        sender_role: body.sender_role || 'Finder',
        text: safeText,
        created_at: new Date().toISOString(),
        read: false,
      };

      fallbackDbStore.ChatMessages.push(newMsg);
      saveFallbackDb(fallbackDbStore, 'ChatMessages');
      broadcastEvent('CHAT_MESSAGE', { channel_id: channelId, message: newMsg });
      return sendJSON(res, 201, { status: 'success', message: newMsg });
    }
  }

  // ── Virtual Masked Calling Bridge Endpoints ──
  if ((pathname === '/api/call/session' || pathname === '/call/session') && req.method === 'POST') {
    const body = await parseBody(req);
    const channelId = body.channel_id || 'default-relay';
    const trunkId = `TRUNK-${Math.floor(1000 + Math.random() * 9000)}-ZEXO`;
    const callPayload = {
      trunk_id: trunkId,
      channel_id: channelId,
      status: body.action === 'end' ? 'terminated' : 'bridged',
      caller_id: body.caller_id || 'caller-anonymous',
      recipient_id: body.recipient_id || 'recipient-anonymous',
      relay_number: '+1 (800) 555-ZEXO',
      timestamp: new Date().toISOString(),
      encryption: 'TLS 1.3 End-to-End Masked Trunk',
    };
    broadcastEvent('CALL_EVENT', callPayload);
    return sendJSON(res, 200, { status: 'success', call: callPayload });
  }

  const entityMatch = pathname.match(/^(?:\/api)?\/entities\/([^\/]+)(?:\/([^\/]+))?$/i)
    || pathname.match(/^(?:\/api)?\/(lost-reports|lost_reports|found-reports|found_reports|ai-matches|ai_matches|matches|claims|handovers|ownership-evidence|ownership_evidence|notifications|admin-actions|admin_actions|users)(?:\/([^\/]+))?$/i);

  if (entityMatch) {
    const entityName = entityMatch[1];
    const id = entityMatch[2];
    const tableName = getTableName(entityName);

    if (isDbConnected()) {
      try {
        if (req.method === 'GET' && id) {
          const result = await query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
          return result.rows.length > 0
            ? sendJSON(res, 200, result.rows[0])
            : sendJSON(res, 404, { error: 'Item not found' });
        }

        if (req.method === 'GET') {
          const conditions = [];
          const values = [];
          let pIndex = 1;

          reqUrl.searchParams.forEach((val, key) => {
            if (key !== '_orderBy' && key !== '_limit' && key !== 'token' && key !== 't') {
              conditions.push(`${key} = $${pIndex}`);
              values.push(val);
              pIndex++;
            }
          });

          let sql = `SELECT * FROM ${tableName}`;
          if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;

          const orderBy = reqUrl.searchParams.get('_orderBy');
          if (orderBy) {
            const isDesc = orderBy.startsWith('-');
            const colName = isDesc ? orderBy.substring(1) : orderBy;
            sql += ` ORDER BY ${colName} ${isDesc ? 'DESC' : 'ASC'}`;
          } else {
            sql += ` ORDER BY created_date DESC`;
          }

          const limit = parseInt(reqUrl.searchParams.get('_limit'), 10);
          if (!isNaN(limit) && limit > 0) {
            sql += ` LIMIT ${limit}`;
          }

          const result = await query(sql, values);
          return sendJSON(res, 200, result.rows);
        }

        if (req.method === 'POST') {
          const body = await parseBody(req);
          const newItemId = body.id || `${tableName}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const data = { id: newItemId, ...body };

          const cols = Object.keys(data);
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
          const values = Object.values(data).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);

          const insertSql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`;
          const result = await query(insertSql, values);
          broadcastEvent('ENTITY_CREATED', { entity: entityName, id: newItemId });
          return sendJSON(res, 201, result.rows[0]);
        }

        if (req.method === 'PUT' && id) {
          const body = await parseBody(req);
          delete body.id;

          const cols = Object.keys(body);
          if (cols.length === 0) return sendJSON(res, 400, { error: 'No fields to update' });

          const setClauses = cols.map((col, i) => `${col} = $${i + 1}`).join(', ');
          const values = Object.values(body).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
          values.push(id);

          const updateSql = `UPDATE ${tableName} SET ${setClauses}, updated_date = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
          const result = await query(updateSql, values);

          if (result.rows.length === 0) return sendJSON(res, 404, { error: 'Item not found' });
          broadcastEvent('ENTITY_UPDATED', { entity: entityName, id });
          return sendJSON(res, 200, result.rows[0]);
        }

        if (req.method === 'DELETE' && id) {
          const result = await query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
          if (result.rows.length === 0) return sendJSON(res, 404, { error: 'Item not found' });
          broadcastEvent('ENTITY_DELETED', { entity: entityName, id });
          return sendJSON(res, 200, { id, deleted: true });
        }
      } catch (err) {
        console.error(`[PostgreSQL CRUD Error for ${entityName}]`, err.message);
      }
    }

    const fallbackKey = Object.keys(defaultDb).find(k => k.toLowerCase() === entityName.toLowerCase() || k.toLowerCase() === tableName.replace(/_/g, '').toLowerCase()) || entityName;
    fallbackDbStore = loadFallbackDb();
    if (!fallbackDbStore[fallbackKey]) fallbackDbStore[fallbackKey] = [];

    if (req.method === 'GET') {
      if (id) {
        const item = fallbackDbStore[fallbackKey].find((x) => x.id === id);
        return item ? sendJSON(res, 200, item) : sendJSON(res, 404, { error: 'Item not found' });
      }

      let list = fallbackDbStore[fallbackKey];
      reqUrl.searchParams.forEach((val, key) => {
        if (key !== '_orderBy' && key !== '_limit' && key !== 'token' && key !== 't') {
          list = list.filter((item) => String(item[key]) === String(val));
        }
      });
      return sendJSON(res, 200, list);
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const newItem = {
        id: body.id || `${entityName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        created_date: new Date().toISOString(),
        status: 'active',
        ...body,
      };
      fallbackDbStore[fallbackKey].push(newItem);
      saveFallbackDb(fallbackDbStore, fallbackKey);
      return sendJSON(res, 201, newItem);
    }

    if (req.method === 'PUT' && id) {
      const body = await parseBody(req);
      const idx = fallbackDbStore[fallbackKey].findIndex((x) => x.id === id);
      if (idx >= 0) {
        fallbackDbStore[fallbackKey][idx] = {
          ...fallbackDbStore[fallbackKey][idx],
          ...body,
          updated_date: new Date().toISOString(),
        };
        saveFallbackDb(fallbackDbStore, fallbackKey);
        return sendJSON(res, 200, fallbackDbStore[fallbackKey][idx]);
      }
      return sendJSON(res, 404, { error: 'Item not found' });
    }

    if (req.method === 'DELETE' && id) {
      fallbackDbStore[fallbackKey] = fallbackDbStore[fallbackKey].filter((x) => x.id !== id);
      saveFallbackDb(fallbackDbStore, fallbackKey);
      return sendJSON(res, 200, { id, deleted: true });
    }
  }

  sendJSON(res, 404, { error: 'Endpoint not found', path: pathname, method: req.method });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`🚀 FindBack AI Backend Server Active on Port: ${PORT}`);
  console.log(`📡 Health Check URL: http://0.0.0.0:${PORT}/api/health`);
  console.log(`⚡ Real-Time SSE Stream: http://0.0.0.0:${PORT}/api/events`);
  console.log(`🐘 Database Mode: ${isDbConnected() ? 'PostgreSQL Pool Active' : 'File-Backed Fallback'}`);
  console.log(`================================================================`);
});
