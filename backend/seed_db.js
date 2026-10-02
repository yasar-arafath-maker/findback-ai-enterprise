/**
 * FindBack AI Enterprise — Backend Clean Database Initializer
 * Resets backend/local_db.json and root local_db.json to clean state with 0 seed/sample data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDb = path.join(__dirname, '..', 'local_db.json');
const backendDb = path.join(__dirname, 'local_db.json');

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

  const str = JSON.stringify(cleanDb, null, 2);
  fs.writeFileSync(rootDb, str, 'utf-8');
  fs.writeFileSync(backendDb, str, 'utf-8');
  console.log('✓ Backend & Root Databases cleaned successfully: 0 seed records, 0 credentials.');
};

cleanDatabase();
