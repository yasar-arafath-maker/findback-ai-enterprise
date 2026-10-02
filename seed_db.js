/**
 * FindBack AI Enterprise — Clean Database Initializer
 * Resets local_db.json to a clean, empty production-ready state with zero seed or mock data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'local_db.json');

export const cleanDatabase = () => {
  const cleanDb = {
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

  fs.writeFileSync(DB_FILE, JSON.stringify(cleanDb, null, 2), 'utf-8');
  console.log('✓ Database cleaned successfully: 0 seed records, 0 credentials.');
};

cleanDatabase();
