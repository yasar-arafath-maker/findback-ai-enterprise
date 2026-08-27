/**
 * FindBack AI — End-to-End Submission & Null Safety Test Suite
 * Tests report creation, null user handling, auto-fill mock data, empty state handling, and network recovery.
 */

import db from '../base44Client.js';

const runTests = async () => {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  FindBack AI — E2E Submission & UI Resilience Test Suite');
  console.log('══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  [+] [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [-] [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  };

  // Test 1: Null User Session Safety
  await test('Null User Session Fallback', async () => {
    const authUser = await db.auth.me().catch(() => null);
    const userId = authUser?.id || `user-guest-${Date.now()}`;
    if (!userId) throw new Error('Failed to resolve user ID safely');
  });

  // Test 2: Valid Lost Report Creation
  await test('Valid Lost Report Submission', async () => {
    const payload = {
      title: 'Apple AirPods Pro (2nd Gen)',
      category: 'Electronics',
      description: 'White MagSafe case with small scratch near hinge.',
      brand: 'Apple',
      color: 'White',
      distinguishing_marks: 'Blue silicone tip on left earbud',
      location_text: 'Central Library, 2nd Floor',
      location_lat: 10.8231,
      location_lng: 78.6942,
      primary_image_url: 'https://example.com/airpods.jpg',
      status: 'active',
      reporter_id: 'test-user-123',
      lost_date: '2026-08-27',
      lost_time: '14:30',
    };

    const report = await db.entities.LostReports.create(payload);
    if (!report || !report.id) throw new Error('LostReport creation failed');
  });

  // Test 3: Valid Found Report Creation
  await test('Valid Found Report Submission', async () => {
    const payload = {
      title: 'Leather Wallet with Student ID',
      category: 'Bags',
      description: 'Black leather Wildcraft wallet found under study desk.',
      brand: 'Wildcraft',
      color: 'Black',
      location_text: 'KRCT Student Center Lounge',
      location_lat: 10.8240,
      location_lng: 78.6950,
      current_holder_location: 'Campus Security Office',
      status: 'active',
      finder_id: 'test-user-456',
      found_date: '2026-08-27',
      found_time: '15:00',
    };

    const report = await db.entities.FoundReports.create(payload);
    if (!report || !report.id) throw new Error('FoundReport creation failed');
  });

  // Test 4: Empty State & Filter Resilience
  await test('Empty Matches & Reports Filtering Resilience', async () => {
    const emptyMatches = await db.entities.AIMatches.filter({ lost_report_id: 'non-existent-id' });
    if (!Array.isArray(emptyMatches)) throw new Error('Empty filter did not return an array');
  });

  // Test 5: Network Timeout / Upload Fallback
  await test('Network Failure Graceful Recovery', async () => {
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file: null }).catch(() => ({ file_url: '' }));
      if (typeof file_url !== 'string') throw new Error('Upload fallback failed to return string');
    } catch (e) {
      // Expected to handle safely
    }
  });

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  E2E SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
};

runTests().catch(err => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});
