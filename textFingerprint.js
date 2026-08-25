/**
 * FindBack AI — Text Fingerprinting Engine
 * ─────────────────────────────────────────
 * Generates SimHash-style 64-bit fingerprints from text metadata (title,
 * description, color, brand, marks) and compares them via Hamming distance.
 *
 * ENGINEERING NOTE: This module operates on TEXT TOKENS, not raw image bytes.
 * For actual image analysis, the matching pipeline delegates to the LLM
 * vision integration (gemini_3_flash) which processes the image URLs directly.
 * The name was changed from "perceptualHash.js" to maintain honesty about
 * what this code actually does.
 */

import { createHash } from 'crypto';

// ── SimHash Generation ────────────────────────────────────────────────

/**
 * Generates a 64-bit SimHash fingerprint from a text string.
 * Tokenizes the input, hashes each token with MD5, and accumulates a
 * weighted bit-vector to produce a binary fingerprint.
 *
 * @param {string} text — Concatenated text metadata (title + description + color, etc.)
 * @returns {string} 16-character hex string representing a 64-bit fingerprint
 */
export function generateTextFingerprint(text) {
  if (!text) return '0000000000000000';
  const str = typeof text === 'string' ? text : String(text);
  const tokens = str.toLowerCase().split(/\W+/).filter(Boolean);

  if (tokens.length > 0) {
    const v = new Array(64).fill(0);
    for (const token of tokens) {
      const h = createHash('md5').update(token).digest();
      for (let i = 0; i < 64; i++) {
        const byteIndex = Math.floor(i / 8);
        const bitIndex = i % 8;
        const bit = (h[byteIndex] >> bitIndex) & 1;
        v[i] += bit ? 1 : -1;
      }
    }
    let fingerprint = 0n;
    for (let i = 0; i < 64; i++) {
      if (v[i] > 0) fingerprint |= (1n << BigInt(i));
    }
    return fingerprint.toString(16).padStart(16, '0');
  }

  // Fallback: SHA-256 truncated to 64 bits
  return createHash('sha256').update(str).digest('hex').substring(0, 16);
}

// ── Hamming Distance ──────────────────────────────────────────────────

/**
 * Calculates the Hamming distance between two 16-char hex fingerprints.
 * @returns {number} Distance between 0 (identical) and 64 (maximally different)
 */
export function hammingDistance(hashA, hashB) {
  if (!hashA || !hashB || hashA.length !== 16 || hashB.length !== 16) return 64;
  let dist = 0;
  for (let i = 0; i < 16; i++) {
    const valA = parseInt(hashA[i], 16);
    const valB = parseInt(hashB[i], 16);
    let xor = valA ^ valB;
    while (xor > 0) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}

/**
 * Converts Hamming distance (0–64) to a similarity percentage (0–100).
 * Distance 0 → 100% similar, distance ≥ 32 → 0%.
 */
export function compareTextFingerprints(hashA, hashB) {
  const dist = hammingDistance(hashA, hashB);
  return Math.max(0, Math.min(100, Math.round((1 - dist / 32) * 100)));
}

// ── Feature Extraction ────────────────────────────────────────────────

/**
 * Extracts a lightweight text-based feature vector from item metadata.
 * - `fingerprint`: SimHash from concatenated title + color + description
 * - `color`: detected dominant color keyword
 * - `structuralHash`: MD5 of concatenated text (for dedup / exact-match)
 *
 * @param {string} title
 * @param {string} color
 * @param {string} description
 * @returns {{ fingerprint: string, color: string, structuralHash: string }}
 */
export function extractTextFeatures(title = '', color = '', description = '') {
  const combined = `${title}:${color}:${description}`.toLowerCase();
  const fingerprint = generateTextFingerprint(combined);
  const knownColors = ['black', 'blue', 'red', 'green', 'brown', 'silver', 'white', 'grey', 'gray', 'yellow', 'pink', 'orange', 'purple'];
  const detectedColor = knownColors.find(c => combined.includes(c)) || color || 'other';

  return {
    fingerprint,
    color: detectedColor,
    structuralHash: createHash('md5').update(combined).digest('hex').substring(0, 12),
  };
}

// ── Backward-compatible aliases ───────────────────────────────────────
// These exist so that test files importing the old names continue to work
// without modification. New code should use the explicit names above.

/** @deprecated Use generateTextFingerprint() */
export const generatePerceptualHash = generateTextFingerprint;
/** @deprecated Use compareTextFingerprints() */
export const comparePerceptualHashes = compareTextFingerprints;
/** @deprecated Use extractTextFeatures() */
export const extractImageFeatures = extractTextFeatures;
