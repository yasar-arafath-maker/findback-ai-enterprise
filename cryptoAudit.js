/**
 * FindBack AI — Cryptographic Immutable Audit Trail Engine
 * Pillar 3: Cryptographically Secured Immutable Handover Receipts & Audit Logs
 * 
 * Features:
 * - SHA-256 Receipt Hash generation combining handover ID, timestamp, admin ID, claimant ID, verification code & prev hash
 * - Merkle-chain link integrity verification
 * - Immutable tamper-evident audit record creation
 */

import { createHash } from 'crypto';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Generates an immutable SHA-256 cryptographic receipt hash for a handover event.
 * @param {object} params
 * @param {string} params.handoverId
 * @param {string} params.claimantId
 * @param {string} params.finderId
 * @param {string} params.adminId
 * @param {string} params.verificationCode
 * @param {string} [params.timestamp]
 * @param {string} [params.previousHash]
 * @returns {object} { receiptHash, previousHash, timestamp }
 */
export function generateHandoverReceiptHash({
  handoverId,
  claimantId,
  finderId,
  adminId,
  verificationCode,
  timestamp = new Date().toISOString(),
  previousHash = GENESIS_HASH
}) {
  const payload = [
    `HANDOVER:${handoverId}`,
    `CLAIMANT:${claimantId}`,
    `FINDER:${finderId}`,
    `ADMIN:${adminId}`,
    `CODE:${verificationCode}`,
    `TIME:${timestamp}`,
    `PREV:${previousHash}`
  ].join('|');

  const receiptHash = createHash('sha256').update(payload).digest('hex');

  return {
    receiptHash,
    previousHash,
    timestamp,
    payload
  };
}

/**
 * Verifies that a given receipt hash matches the payload components.
 * @param {object} receiptRecord 
 * @returns {boolean} True if valid & untampered
 */
export function verifyReceiptIntegrity(receiptRecord) {
  if (!receiptRecord || !receiptRecord.receiptHash) return false;
  const recalculated = generateHandoverReceiptHash({
    handoverId: receiptRecord.handoverId,
    claimantId: receiptRecord.claimantId,
    finderId: receiptRecord.finderId,
    adminId: receiptRecord.adminId,
    verificationCode: receiptRecord.verificationCode,
    timestamp: receiptRecord.timestamp,
    previousHash: receiptRecord.previousHash || GENESIS_HASH
  });
  return recalculated.receiptHash === receiptRecord.receiptHash;
}
