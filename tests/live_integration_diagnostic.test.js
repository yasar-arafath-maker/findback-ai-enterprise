/**
 * ZEXO / FindBack AI — Live Integration & Storage Persistence Diagnostic
 * ─────────────────────────────────────────────────────────────────────────────
 * Performs end-to-end local runtime verification for registration, login,
 * user session retrieval, report creation, CRUD operations, and match calculations.
 */

import db from '../base44Client.js';
import { seedInitialCommunityData } from '../communitySeed.js';

async function runLiveDiagnostics() {
  seedInitialCommunityData();
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  ZEXO / FindBack AI — Live Integration Diagnostic Suite');
  console.log('══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  const assertStep = (title, condition, info = '') => {
    if (condition) {
      console.log(`  [+] [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [-] [FAIL] ${title} ${info}`);
      failed++;
    }
  };

  try {
    // 1. User Registration Flow Test
    const testEmail = `test.user.${Date.now()}@zexo.app`;
    console.log(`[1/6] Testing Registration for ${testEmail}...`);
    const regResult = await db.auth.register({
      email: testEmail,
      full_name: 'Live Diagnostic User',
      phone: '+91 9988776655',
    });
    assertStep('User Registration Dispatched', regResult && regResult.status === 'success');

    // 2. Login Flow & Session Storage Test
    console.log('\n[2/6] Testing Email Login & Token/User Session Storage...');
    const loginResult = await db.auth.loginViaEmailPassword(testEmail);
    assertStep('User Login Token Issued', loginResult && loginResult.access_token);
    assertStep('User Object Returned', loginResult && loginResult.user?.email === testEmail);

    // 3. User Session Verification (me())
    console.log('\n[3/6] Verifying Current Session (db.auth.me())...');
    const activeUser = await db.auth.me();
    assertStep('Session User Retrieved', activeUser && activeUser.email === testEmail);

    // 4. Lost Report Creation & Persistence Test
    console.log('\n[4/6] Testing Lost Report Creation & Persistence...');
    const newLostReport = await db.entities.LostReports.create({
      title: 'Diagnostic Test iPhone 15 Pro',
      category: 'Electronics',
      description: 'Lost during live integration test run',
      reporter_id: activeUser.id,
      location_text: 'Diagnostic Test Suite Lab',
      lost_date: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    assertStep('Lost Report Created with ID', newLostReport && newLostReport.id);

    // 5. My Reports CRUD Operations Test
    console.log('\n[5/6] Testing My Reports Query, Update, & Delete Operations...');
    const userLostReports = await db.entities.LostReports.filter({ reporter_id: activeUser.id });
    assertStep('Query Reports by Reporter ID', userLostReports.length > 0);

    const updatedReport = await db.entities.LostReports.update(newLostReport.id, {
      description: 'Updated diagnostic description text',
      status: 'closed',
    });
    assertStep('Report Updated Successfully', updatedReport && updatedReport.status === 'closed');

    const deleteResult = await db.entities.LostReports.delete(newLostReport.id);
    assertStep('Report Deleted Successfully', deleteResult !== null);

    // 6. Real-Time Matching Engine Verification
    console.log('\n[6/6] Testing Real-Time AI Match Trigger...');
    const matchRunResult = await db.functions.invoke('runMatching', {
      reportId: 'lost-seed-101',
      reportType: 'lost',
    });
    assertStep('AI Matching Function Executed', matchRunResult && matchRunResult.status === 'success');

  } catch (err) {
    console.error('\n[-] Diagnostic suite threw exception:', err);
    failed++;
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  DIAGNOSTIC RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runLiveDiagnostics();
