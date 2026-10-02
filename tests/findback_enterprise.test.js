/**
 * FindBack AI — Enterprise 5-Pillar Architectural Test Suite
 * Validating Enterprise Pillars:
 * 1. Hybrid Computer Vision & Perceptual Hashing (pHash / dHash)
 * 2. Event-Driven Real-time Notification Service
 * 3. SHA-256 Cryptographic Immutable Receipt Audit Trail
 * 4. Uber H3 Spatial Cell Indexing & Geo-Proximity
 * 5. Attribute-Based Access Control (ABAC) Security Engine
 */

import { generatePerceptualHash, comparePerceptualHashes, hammingDistance } from '../perceptualHash.js';
import { notificationService } from '../notificationService.js';
import { generateHandoverReceiptHash, verifyReceiptIntegrity } from '../cryptoAudit.js';
import { latLngToSpatialCell, computeSpatialProximityScore, haversineDistanceKm } from '../spatialIndexer.js';
import { evaluateABAC } from '../abacEngine.js';

let passed = 0, failed = 0;
function assert(id, desc, condition, detail = '') {
  if (condition) {
    console.log(`  [+] [${id}] ${desc} — ${detail || 'PASS'}`);
    passed++;
  } else {
    console.error(`  [X] [${id}] ${desc} — FAILED: ${detail}`);
    failed++;
  }
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║    FindBack AI — 5-Pillar Enterprise Test Runner             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Pillar 1 Tests
const hash1 = generatePerceptualHash('wildcraft black leather wallet campus library');
const hash2 = generatePerceptualHash('wildcraft black leather wallet campus desk');
const dist = hammingDistance(hash1, hash2);
const sim = comparePerceptualHashes(hash1, hash2);

assert('E-01', 'Pillar 1: Perceptual Hash Generation (pHash/dHash)', hash1.length === 16, `Hash: ${hash1}`);
assert('E-02', 'Pillar 1: Hamming Distance & Vision Similarity', sim >= 50, `Distance: ${dist}, Similarity: ${sim}%`);

// Pillar 2 Tests
let eventReceived = null;
const unsub = notificationService.subscribe('user:user-A', evt => { eventReceived = evt; });
notificationService.notifyMatchFound('user-A', { score: 92, title: 'Wildcraft Black Wallet' });

assert('E-03', 'Pillar 2: Event-Driven Real-time Notification Dispatch', eventReceived !== null && eventReceived.type === 'MATCH_FOUND', `Event: ${eventReceived?.type}`);
unsub();

// Pillar 3 Tests
const receipt = generateHandoverReceiptHash({
  handoverId: 'handover-991',
  claimantId: 'user-A',
  finderId: 'user-B',
  adminId: 'admin-01',
  verificationCode: '592814',
  timestamp: '2026-08-20T21:30:00.000Z'
});
const isIntegrityValid = verifyReceiptIntegrity({
  ...receipt,
  handoverId: 'handover-991',
  claimantId: 'user-A',
  finderId: 'user-B',
  adminId: 'admin-01',
  verificationCode: '592814'
});

assert('E-04', 'Pillar 3: SHA-256 Cryptographic Receipt Generation', receipt.receiptHash.length === 64, `SHA256: ${receipt.receiptHash.slice(0, 16)}...`);
assert('E-05', 'Pillar 3: Immutable Audit Trail Chain Integrity', isIntegrityValid === true, 'Receipt payload untampered & verified');

// Pillar 4 Tests
const cellA = latLngToSpatialCell(10.8, 78.7, 'KRCT Campus Library');
const cellB = latLngToSpatialCell(10.8, 78.7, 'KRCT Campus Library');
const proxScore = computeSpatialProximityScore(
  { location_lat: 10.8001, location_lng: 78.7001 },
  { location_lat: 10.8002, location_lng: 78.7002 }
);

assert('E-06', 'Pillar 4: Uber H3 Spatial Cell Indexing', cellA.startsWith('89') && cellA === cellB, `H3 Cell: ${cellA}`);
assert('E-07', 'Pillar 4: Spatial Micro-Proximity Scoring', proxScore >= 90, `Spatial Proximity Score: ${proxScore}/100`);
const distKm = haversineDistanceKm(10.8001, 78.7001, 10.8002, 78.7002);
assert('E-07b', 'Pillar 4: Haversine Distance < 100 meters for micro-offsets', distKm !== null && distKm < 0.1, `Distance: ${(distKm * 1000).toFixed(1)}m`);

// Pillar 5 Tests
const adminSubject = { id: 'admin-01', role: 'admin', account_status: 'active', department: 'CS' };
const suspendedAdmin = { id: 'admin-02', role: 'admin', account_status: 'suspended', department: 'CS' };
const resClaim = { claimant_id: 'user-A', department: 'CS' };

const abacAllowed = evaluateABAC('decideClaim', adminSubject, resClaim);
const abacBlocked = evaluateABAC('decideClaim', suspendedAdmin, resClaim);

assert('E-08', 'Pillar 5: ABAC Grant Authorized Action', abacAllowed.authorized === true, abacAllowed.reason);
assert('E-09', 'Pillar 5: ABAC Block Suspended/Unauthorized Action', abacBlocked.authorized === false, abacBlocked.reason);

console.log('\n══════════════════════════════════════════════════════════════');
console.log(`  ENTERPRISE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('══════════════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
