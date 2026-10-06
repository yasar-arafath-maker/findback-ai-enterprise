/**
 * FindBack AI — Backward-compatibility shim for perceptualHash.js
 * ────────────────────────────────────────────────────────────────
 * The real implementation now lives in textFingerprint.js.
 * This file re-exports everything so existing test suites and
 * devops runners that import from './perceptualHash.js' continue to work.
 *
 * New code should import from './textFingerprint.js' directly.
 */

export {
  generateTextFingerprint as generatePerceptualHash,
  compareTextFingerprints as comparePerceptualHashes,
  hammingDistance,
  extractTextFeatures as extractImageFeatures,
  // Also export the new names so callers can migrate gradually
  generateTextFingerprint,
  compareTextFingerprints,
  extractTextFeatures,
} from './textFingerprint.js';
