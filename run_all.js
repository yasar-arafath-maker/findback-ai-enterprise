/**
 * FindBack AI Enterprise (ZEXO) - Single-Command Full-Stack Runner
 * ──────────────────────────────────────────────────────────────
 * Boots both Backend (Port 5000) and Frontend Vite (Port 5173) together!
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   🚀 Booting FindBack AI Enterprise (Frontend + Backend)     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 1. Boot Backend Server on Port 5000
console.log('⚙️ [1/2] Starting Node.js Backend Server on port 5000...');
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
});

backend.on('error', (err) => {
  console.error('❌ Failed to start backend:', err.message);
});

// 2. Boot Frontend Vite Server on Port 5173
console.log('⚡ [2/2] Starting Vite Frontend App on port 5173...\n');
const frontend = spawn('npx', ['vite', '--open'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

frontend.on('error', (err) => {
  console.error('❌ Failed to start frontend:', err.message);
});

// Handle graceful shutdown on Ctrl+C
const shutdown = () => {
  console.log('\n🛑 Shutting down FindBack AI services...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
