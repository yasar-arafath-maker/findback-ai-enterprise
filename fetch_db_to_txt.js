import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

dotenv.config();

const outputFile = path.join(process.cwd(), 'database_export.txt');

async function exportDatabaseToTxt() {
  const timestamp = new Date().toISOString();
  let exportContent = `=================================================================\n`;
  exportContent += `FINDBACK AI ENTERPRISE - DATABASE EXPORT\n`;
  exportContent += `Export Timestamp: ${timestamp}\n`;
  exportContent += `=================================================================\n\n`;

  const dbUrl = process.env.DATABASE_URL;
  let fetchedFromPg = false;

  if (dbUrl) {
    console.log('Connecting to PostgreSQL database...');
    const pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      const tablesRes = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
      );
      const tables = tablesRes.rows.map((r) => r.table_name);

      console.log(`Found ${tables.length} tables in PostgreSQL database:`, tables);

      for (const table of tables) {
        exportContent += `-----------------------------------------------------------------\n`;
        exportContent += `TABLE: ${table.toUpperCase()}\n`;
        exportContent += `-----------------------------------------------------------------\n`;

        try {
          const res = await pool.query(`SELECT * FROM "${table}"`);
          if (res.rows.length === 0) {
            exportContent += `[No records found]\n\n`;
          } else {
            exportContent += `Total Records: ${res.rows.length}\n\n`;
            res.rows.forEach((row, index) => {
              exportContent += `--- Record #${index + 1} ---\n`;
              exportContent += JSON.stringify(row, null, 2) + '\n';
            });
            exportContent += '\n';
          }
        } catch (err) {
          exportContent += `Error querying table ${table}: ${err.message}\n\n`;
        }
      }

      fetchedFromPg = true;
      await pool.end();
    } catch (err) {
      console.warn('PostgreSQL query failed, falling back to local_db.json:', err.message);
    }
  }

  if (!fetchedFromPg && fs.existsSync('local_db.json')) {
    console.log('Exporting from local_db.json fallback...');
    exportContent += `[SOURCE: LOCAL FILE FALLBACK (local_db.json)]\n\n`;
    const localData = JSON.parse(fs.readFileSync('local_db.json', 'utf8'));
    for (const [key, records] of Object.entries(localData)) {
      exportContent += `-----------------------------------------------------------------\n`;
      exportContent += `ENTITY: ${key.toUpperCase()}\n`;
      exportContent += `-----------------------------------------------------------------\n`;
      if (Array.isArray(records)) {
        exportContent += `Total Records: ${records.length}\n\n`;
        records.forEach((row, index) => {
          exportContent += `--- Record #${index + 1} ---\n`;
          exportContent += JSON.stringify(row, null, 2) + '\n';
        });
      } else {
        exportContent += JSON.stringify(records, null, 2) + '\n';
      }
      exportContent += '\n';
    }
  }

  fs.writeFileSync(outputFile, exportContent, 'utf8');
  console.log(`\nExport complete! File written to: ${outputFile}`);
  console.log(`File size: ${fs.statSync(outputFile).size} bytes`);
}

exportDatabaseToTxt().catch((err) => {
  console.error('Fatal error during database export:', err);
  process.exit(1);
});
