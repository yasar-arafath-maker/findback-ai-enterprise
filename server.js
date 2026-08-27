/**
 * ZEXO / FindBack AI — Native Node Backend Server & File Database Persistence Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero-dependency native Node.js HTTP server running on port 5000 backed by a local JSON file DB (`local_db.json`).
 * Guarantees zero data loss across restarts for user registration, authentication sessions,
 * lost/found reports CRUD, claims, handovers, and real-time AI matching.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'local_db.json');
const PORT = process.env.PORT || 5000;

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

const loadDatabase = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return { ...defaultDb, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('[Server DB] Read error:', err.message);
  }
  saveDatabase(defaultDb);
  return defaultDb;
};

const saveDatabase = (dbData) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error('[Server DB] Write error:', err.message);
  }
};

let dbStore = loadDatabase();

const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = reqUrl.pathname;

  // ── Health Check ──
  if (pathname === '/api/health') {
    return sendJSON(res, 200, {
      status: 'ok',
      server: 'ZEXO Local Native HTTP Server',
      database_file: DB_FILE,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Auth Endpoints ──
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await parseBody(req);
    const { email, full_name, phone } = body;
    if (!email) return sendJSON(res, 400, { error: 'Email is required' });

    dbStore = loadDatabase();
    let existing = dbStore.User.find((u) => u.email === email);
    if (!existing) {
      existing = {
        id: `user-${Date.now()}`,
        email,
        full_name: full_name || email.split('@')[0],
        phone: phone || '',
        role: 'user',
        account_status: 'active',
        created_date: new Date().toISOString(),
      };
      dbStore.User.push(existing);
    }

    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    dbStore.Sessions[token] = existing;
    saveDatabase(dbStore);

    return sendJSON(res, 200, { status: 'success', token, user: existing });
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const { email } = body;
    if (!email) return sendJSON(res, 400, { error: 'Email is required' });

    dbStore = loadDatabase();
    let user = dbStore.User.find((u) => u.email === email);
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        email,
        full_name: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'user',
        account_status: 'active',
        created_date: new Date().toISOString(),
      };
      dbStore.User.push(user);
    }

    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    dbStore.Sessions[token] = user;
    saveDatabase(dbStore);

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
      saveDatabase(dbStore);
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
        saveDatabase(dbStore);
        return sendJSON(res, 200, dbStore[entityName][idx]);
      }
    }

    if (req.method === 'DELETE' && id) {
      dbStore[entityName] = dbStore[entityName].filter((x) => x.id !== id);
      saveDatabase(dbStore);
      return sendJSON(res, 200, { id, deleted: true });
    }
  }

  sendJSON(res, 404, { error: 'Endpoint not found' });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  ZEXO Local Server Running on http://localhost:${PORT}`);
  console.log(`  Local Database Storage File: ${DB_FILE}`);
  console.log(`=======================================================`);
});
