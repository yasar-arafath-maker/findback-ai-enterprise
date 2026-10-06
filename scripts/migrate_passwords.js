import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

async function migratePasswords() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('No DATABASE_URL found in process.env');
    return;
  }

  console.log('Connecting to PostgreSQL database for password migration...');
  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'Zero@123';`);
    console.log('✓ Added password column to users table if not existing.');

    const res = await pool.query(`UPDATE users SET password = 'Zero@123' WHERE password IS NULL OR password = '';`);
    console.log(`✓ Updated ${res.rowCount} user records with default password 'Zero@123'.`);
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migratePasswords();
