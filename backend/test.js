/**
 * FindBack AI Enterprise - Backend Server Automated Test Runner
 * Validates Health, Auth, Entity CRUD, Serverless AI Matching, and Crypto Handover endpoints.
 */

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 5055;

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       FindBack AI Backend - Smoke & Integration Tests        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  process.env.PORT = String(TEST_PORT);
  const serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: 'pipe',
  });

  // Wait 1 second for server to initialize
  await new Promise((r) => setTimeout(r, 1200));

  let passed = 0;
  let failed = 0;

  const testCase = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  };

  try {
    // 1. Health Probe
    await testCase('GET /api/health returns 200 and status online', async () => {
      const res = await request('GET', '/api/health');
      if (res.status !== 200 || res.data.status !== 'online') {
        throw new Error(`Expected 200 online, got ${res.status} ${JSON.stringify(res.data)}`);
      }
    });

    // 2. Render Root Probe
    await testCase('GET / returns 200 online', async () => {
      const res = await request('GET', '/');
      if (res.status !== 200 || res.data.status !== 'online') {
        throw new Error(`Expected 200, got ${res.status}`);
      }
    });

    // 3. Stats Endpoint
    await testCase('GET /api/stats returns counts', async () => {
      const res = await request('GET', '/api/stats');
      if (res.status !== 200 || typeof res.data.users_count !== 'number') {
        throw new Error(`Invalid stats response: ${JSON.stringify(res.data)}`);
      }
    });

    // 4. Auth Register & Login
    let authToken = '';
    await testCase('POST /api/auth/register creates user and returns token', async () => {
      const email = `test.${Date.now()}@findback.app`;
      const res = await request('POST', '/api/auth/register', { email, full_name: 'Test Runner' });
      if (res.status !== 200 || !res.data.token) {
        throw new Error(`Register failed: ${JSON.stringify(res.data)}`);
      }
      authToken = res.data.token;
    });

    // 5. Auth Me
    await testCase('GET /api/auth/me returns authenticated user', async () => {
      const res = await request('GET', '/api/auth/me', null, { Authorization: `Bearer ${authToken}` });
      if (res.status !== 200 || !res.data.user) {
        throw new Error(`Auth me failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 6. Entity CRUD (LostReports)
    let testReportId = '';
    await testCase('POST /api/entities/LostReports creates a report', async () => {
      const payload = {
        title: 'MacBook Air M2 Silver',
        category: 'Electronics',
        description: 'Silver 13-inch laptop left at cafeteria',
        brand: 'Apple',
        color: 'Silver',
        location_lat: 10.8231,
        location_lng: 78.6942,
      };
      const res = await request('POST', '/api/entities/LostReports', payload);
      if (res.status !== 201 || !res.data.id) {
        throw new Error(`Create entity failed: ${JSON.stringify(res.data)}`);
      }
      testReportId = res.data.id;
    });

    await testCase('GET /api/entities/LostReports returns array with new report', async () => {
      const res = await request('GET', '/api/entities/LostReports');
      if (res.status !== 200 || !Array.isArray(res.data)) {
        throw new Error(`Get entities failed: ${JSON.stringify(res.data)}`);
      }
      const exists = res.data.some(r => r.id === testReportId);
      if (!exists) throw new Error('Created item not found in list');
    });

    // 7. Serverless AI Matching Function
    await testCase('POST /api/functions/runMatching evaluates reports and produces scores', async () => {
      const res = await request('POST', '/api/functions/runMatching', {
        reportId: testReportId,
        reportType: 'lost',
      });
      if (res.status !== 200 || !Array.isArray(res.data.matches)) {
        throw new Error(`runMatching failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 8. Serverless Handover Finalization & Crypto Hash
    await testCase('POST /api/functions/completeHandover generates SHA-256 receipt', async () => {
      // First decide a claim to generate handover with code
      const claimRes = await request('POST', '/api/functions/decideClaim', {
        claimId: 'claim-seed-401',
        decision: 'approve',
        notes: 'Proof verified',
      });
      if (claimRes.status !== 200 || !claimRes.data.handoverId || !claimRes.data.code) {
        throw new Error(`decideClaim failed: ${JSON.stringify(claimRes.data)}`);
      }

      // Now complete handover
      const completeRes = await request('POST', '/api/functions/completeHandover', {
        handoverId: claimRes.data.handoverId,
        verificationCode: claimRes.data.code,
      });

      if (completeRes.status !== 200 || !completeRes.data.receipt_hash) {
        throw new Error(`completeHandover failed: ${JSON.stringify(completeRes.data)}`);
      }
      if (completeRes.data.receipt_hash.length !== 64) {
        throw new Error(`Invalid SHA-256 hash length: ${completeRes.data.receipt_hash}`);
      }
    });

    // 9. OTP Dispatch & Verify
    await testCase('POST /api/send-otp and /api/verify-otp succeed', async () => {
      const email = 'otp.test@findback.app';
      const sendRes = await request('POST', '/api/send-otp', { email });
      if (sendRes.status !== 200 || !sendRes.data.code) {
        throw new Error(`send-otp failed: ${JSON.stringify(sendRes.data)}`);
      }
      const verifyRes = await request('POST', '/api/verify-otp', { email, code: sendRes.data.code });
      if (verifyRes.status !== 200 || !verifyRes.data.verified) {
        throw new Error(`verify-otp failed: ${JSON.stringify(verifyRes.data)}`);
      }
    });

    // 10. Enterprise Console & Reports Routing
    await testCase('GET /api/enterprise-console returns collections without 404', async () => {
      const res = await request('GET', '/api/enterprise-console');
      if (res.status !== 200 || !res.data.collections) {
        throw new Error(`enterprise-console failed: ${JSON.stringify(res.data)}`);
      }
    });

    await testCase('GET /api/reports returns unified lost and found reports', async () => {
      const res = await request('GET', '/api/reports');
      if (res.status !== 200 || !Array.isArray(res.data.all_reports)) {
        throw new Error(`reports endpoint failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 11. Shorthand and Route Normalization
    await testCase('GET /api/lost-reports shorthand resolves properly', async () => {
      const res = await request('GET', '/api/lost-reports');
      if (res.status !== 200 || !Array.isArray(res.data)) {
        throw new Error(`lost-reports shorthand failed: ${JSON.stringify(res.data)}`);
      }
    });

    await testCase('GET /api/api/health normalizes duplicate prefix without 404', async () => {
      const res = await request('GET', '/api/api/health');
      if (res.status !== 200 || res.data.status !== 'online') {
        throw new Error(`duplicate prefix normalization failed: ${JSON.stringify(res.data)}`);
      }
    });

  } finally {
    serverProcess.kill();
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runTests();
