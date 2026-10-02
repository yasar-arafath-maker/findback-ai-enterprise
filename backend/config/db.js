/**
 * FindBack AI Enterprise — PostgreSQL Connection Pool & Query Engine
 * ───────────────────────────────────────────────────────────────────
 * Connects to PostgreSQL (Supabase / Render / Neon / AWS RDS) via `DATABASE_URL`.
 * Supports connection pooling, SSL, and schema initialization.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
}
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
}

let pool = null;
let isPostgresActive = false;

const DATABASE_URL = process.env.DATABASE_URL;
const isPlaceholderDb = !DATABASE_URL || DATABASE_URL.includes('yourproject') || DATABASE_URL.includes('yourpassword') || DATABASE_URL.includes('your_') || DATABASE_URL.includes('example');

if (DATABASE_URL && !isPlaceholderDb) {
  try {
    const requiresSsl = DATABASE_URL && !DATABASE_URL.includes('sslmode=disable');
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: requiresSsl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]', err.message);
    });

    isPostgresActive = true;
    console.log('[PostgreSQL] Configured connection pool for DATABASE_URL');
  } catch (err) {
    console.warn('[PostgreSQL] Failed to initialize connection pool:', err.message);
    pool = null;
    isPostgresActive = false;
  }
} else {
  console.log('[PostgreSQL] No DATABASE_URL provided. Running in file-backed fallback mode.');
}

/**
 * Execute a parameterized SQL query
 * @param {string} text - SQL query string
 * @param {Array} params - Parameter values
 * @returns {Promise<pg.QueryResult>}
 */
export const query = async (text, params = []) => {
  if (!pool) {
    throw new Error('PostgreSQL Pool is not active. DATABASE_URL is required.');
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('[PostgreSQL Query]', { text, duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
};

/**
 * Get a dedicated client from pool for transactions
 * @returns {Promise<pg.PoolClient>}
 */
export const getClient = async () => {
  if (!pool) {
    throw new Error('PostgreSQL Pool is not active. DATABASE_URL is required.');
  }
  return await pool.connect();
};

/**
 * Initialize PostgreSQL Schema from schema.sql
 */
export const initSchema = async () => {
  if (!pool) return false;
  try {
    await pool.query('SELECT 1');
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('✅ [PostgreSQL] Database schema verified/initialized from schema.sql');
      return true;
    }
  } catch (err) {
    console.warn('⚠️ [PostgreSQL] Remote database unreachable (' + err.message + '). Seamlessly falling back to local file storage.');
    isPostgresActive = false;
  }
  return false;
};

export const isDbConnected = () => isPostgresActive && Boolean(pool);

export default {
  query,
  getClient,
  initSchema,
  isDbConnected,
  pool,
};
