import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'local_db.json');

const INITIAL_USERS = [
  {
    id: 'user-yasar-admin',
    email: 'yasar@zexo.app',
    full_name: 'YASAR',
    phone: '+91 9876543210',
    role: 'admin',
    password: 'Zero@123',
    security_key: 'SEC123',
    account_status: 'active',
    created_date: new Date().toISOString(),
  },
  {
    id: 'user-theoriongd-campus',
    email: 'theoriongd@zexo.app',
    full_name: 'THEORIONGD',
    phone: '+91 9344462238',
    role: 'campus',
    password: 'Zero@123',
    security_key: 'SEC123',
    account_status: 'active',
    created_date: new Date().toISOString(),
  },
  {
    id: 'user-arun-citizen',
    email: 'arun@zexo.app',
    full_name: 'ARUN',
    phone: '+91 9876543212',
    role: 'citizen',
    password: 'Zero@123',
    security_key: 'SEC123',
    account_status: 'active',
    created_date: new Date().toISOString(),
  },
  {
    id: 'user-alen-citizen',
    email: 'alen@findback.app',
    full_name: 'ALEN',
    phone: '+91 9876543213',
    role: 'citizen',
    password: 'Zero@123',
    security_key: 'SEC123',
    account_status: 'active',
    created_date: new Date().toISOString(),
  },
  {
    id: 'user-godfrey-citizen',
    email: 'godfrey@findback.app',
    full_name: 'GODFREY',
    phone: '+91 9876543214',
    role: 'citizen',
    password: 'Zero@123',
    security_key: 'SEC123',
    account_status: 'active',
    created_date: new Date().toISOString(),
  },
  {
    id: 'user-alan-citizen',
    email: 'alan@findback.app',
    full_name: 'ALAN',
    phone: '+91 9876543215',
    role: 'citizen',
    password: 'Zero@123',
    security_key: 'SEC123',
    account_status: 'active',
    created_date: new Date().toISOString(),
  },
  {
    id: 'user-yasar-tech',
    email: 'yasararafath.tech@gmail.com',
    full_name: 'Yasar',
    phone: '+91 7200894218',
    role: 'user',
    password: 'Zero@123',
    security_key: 'SEC123',
    account_status: 'active',
    created_date: new Date().toISOString(),
  },
];

export const cleanAndSeedDatabase = async () => {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    console.log('Clearing and seeding PostgreSQL database...');
    const pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await pool.query(
        `TRUNCATE admin_actions, ai_matches, claims, found_reports, handovers, lost_reports, notifications, ownership_evidence, sessions, users CASCADE;`
      );
      console.log('✓ Truncated PostgreSQL tables.');

      for (const u of INITIAL_USERS) {
        await pool.query(
          `INSERT INTO users (id, email, full_name, phone, role, password, security_key, account_status, created_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [u.id, u.email, u.full_name, u.phone, u.role, u.password, u.security_key, u.account_status]
        );
      }
      console.log(`✓ Inserted ${INITIAL_USERS.length} unique user accounts with security keys into PostgreSQL database.`);
    } catch (err) {
      console.error('PostgreSQL seeding error:', err.message);
    } finally {
      await pool.end();
    }
  }

  const cleanDb = {
    User: INITIAL_USERS,
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

  fs.writeFileSync(DB_FILE, JSON.stringify(cleanDb, null, 2), 'utf-8');
  console.log(`✓ local_db.json initialized with ${INITIAL_USERS.length} unique user accounts.`);
};

cleanAndSeedDatabase().catch((err) => console.error('Seed database failed:', err));


