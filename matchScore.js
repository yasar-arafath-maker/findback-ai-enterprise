/**
 * FindBack AI — Match Scoring Utility
 * ────────────────────────────────────
 * Combines individual signal scores into a single overall match score
 * with explicit, named weights. All weights are declared as constants
 * at the top of this file so they can be tuned without touching logic.
 *
 * Signals:
 *   1. Text Similarity     — LLM semantic + text fingerprint comparison
 *   2. Image Score          — LLM vision (when available) or fallback
 *   3. Geo Proximity        — Haversine distance / spatial cell match
 *   4. Category Match       — Exact (100) / related (50) / none (0)
 *   5. Temporal Proximity   — Exponential decay over days between dates
 */

// ── Weight Configuration ──────────────────────────────────────────────
// All weights must sum to 1.0.

/** Weight for LLM image analysis (or image_unavailable fallback) */
export const W_IMAGE     = 0.30;
/** Weight for LLM text semantic similarity + text fingerprint blend */
export const W_TEXT      = 0.30;
/** Weight for Haversine geo-proximity */
export const W_GEO       = 0.15;
/** Weight for exact/related category match */
export const W_CATEGORY  = 0.15;
/** Weight for temporal proximity (date closeness) */
export const W_TIME      = 0.10;

// Sanity check
const _sum = W_IMAGE + W_TEXT + W_GEO + W_CATEGORY + W_TIME;
if (Math.abs(_sum - 1.0) > 0.001) {
  throw new Error(`Score weights must sum to 1.0, got ${_sum}`);
}

// ── Utilities ─────────────────────────────────────────────────────────

const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));

/**
 * Category relationships used for the 50% "related" tier.
 */
const RELATED_CATEGORIES = {
  Electronics: ['Electronics', 'Other'],
  Bags:        ['Bags', 'Clothing', 'Other'],
  Documents:   ['Documents', 'Other'],
  Jewelry:     ['Jewelry', 'Other'],
  Keys:        ['Keys', 'Other'],
  Pets:        ['Pets', 'Other'],
  Clothing:    ['Clothing', 'Bags', 'Other'],
  Other:       ['Other'],
};

// ── Individual Scorers ────────────────────────────────────────────────

/**
 * Category match score.
 * @param {string} catA
 * @param {string} catB
 * @returns {number} 100 = exact, 50 = related, 0 = unrelated
 */
export function categoryScore(catA, catB) {
  if (catA === catB) return 100;
  if ((RELATED_CATEGORIES[catA] || []).includes(catB)) return 50;
  return 0;
}

/**
 * Temporal proximity score using exponential decay.
 * @param {string|Date} dateA
 * @param {string|Date} dateB
 * @returns {number} 0–100
 */
export function temporalScore(dateA, dateB) {
  if (!dateA || !dateB) return 50; // neutral if dates missing
  const days = Math.abs(new Date(dateA).getTime() - new Date(dateB).getTime()) / 86_400_000;
  return Math.round(100 * Math.exp(-days / 7));
}

/**
 * Blends the LLM image analysis score with the text fingerprint
 * similarity to produce a single image score.
 *
 * When both images are available:
 *   70% LLM vision score + 30% text fingerprint overlap
 *
 * When images are unavailable:
 *   Returns a neutral 50 with an `image_unavailable` flag.
 *
 * @param {{ llmImageScore: number, textFingerprintSimilarity: number, hasBothImages: boolean }} opts
 * @returns {{ score: number, image_unavailable: boolean }}
 */
export function computeImageScore({ llmImageScore, textFingerprintSimilarity, hasBothImages }) {
  if (!hasBothImages) {
    return { score: 50, image_unavailable: true };
  }
  const blended = Math.round(clamp(llmImageScore) * 0.7 + clamp(textFingerprintSimilarity) * 0.3);
  return { score: blended, image_unavailable: false };
}

/**
 * Blends the LLM text similarity score with the text fingerprint
 * similarity for a combined text score.
 *
 * 80% LLM semantic score + 20% SimHash fingerprint similarity
 *
 * @param {number} llmTextScore — 0–100 from LLM
 * @param {number} fingerprintSimilarity — 0–100 from Hamming distance
 * @returns {number} Blended score 0–100
 */
export function computeTextScore(llmTextScore, fingerprintSimilarity) {
  return Math.round(clamp(llmTextScore) * 0.8 + clamp(fingerprintSimilarity) * 0.2);
}

// ── Overall Score ─────────────────────────────────────────────────────

/**
 * Combines all signal scores into a single overall match score.
 *
 * @param {object} signals
 * @param {number} signals.imageScore     — 0–100
 * @param {number} signals.textScore      — 0–100
 * @param {number} signals.geoScore       — 0–100 (from spatialIndexer)
 * @param {number} signals.categoryScore  — 0, 50, or 100
 * @param {number} signals.timeScore      — 0–100
 * @returns {number} Overall score 0–100
 */
export function computeOverallScore({ imageScore, textScore, geoScore, categoryScore, timeScore }) {
  return Math.round(
    clamp(imageScore)    * W_IMAGE +
    clamp(textScore)     * W_TEXT +
    clamp(geoScore)      * W_GEO +
    clamp(categoryScore) * W_CATEGORY +
    clamp(timeScore)     * W_TIME
  );
}

/**
 * Determines confidence level from overall score.
 * @param {number} overall
 * @returns {'high'|'medium'|'low'}
 */
export function confidenceLevel(overall) {
  if (overall >= 75) return 'high';
  if (overall >= 50) return 'medium';
  return 'low';
}

// ── Pre-filter (candidate viability) ──────────────────────────────────

/**
 * Quick pre-filter to determine if a candidate is worth sending to the LLM.
 *
 * @param {object} opts
 * @param {number} opts.catScore   — Category score (0/50/100)
 * @param {number} opts.days       — Days between report dates
 * @param {number|null} opts.km    — Haversine distance in km (null = unknown)
 * @returns {boolean}
 */
export function isViableCandidate({ catScore, days, km }) {
  if (catScore === 0) return false;      // completely unrelated category
  if (days > 14) return false;           // too far apart in time
  if (km !== null && km > 50) return false; // too far apart geographically
  return true;
}

/**
 * Computes a lightweight pre-LLM ranking score for sorting candidates.
 * Uses only category + geo + time (no LLM calls).
 *
 * @param {number} catScore
 * @param {number} geoScore
 * @param {number} timeScore
 * @returns {number}
 */
export function preRankScore(catScore, geoScore, timeScore) {
  return catScore * 0.50 + geoScore * 0.25 + timeScore * 0.25;
}
