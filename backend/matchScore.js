/**
 * FindBack AI — Match Scoring Utility
 * Combines 5 distinct signals into a single overall match score
 */

export const W_IMAGE     = 0.30;
export const W_TEXT      = 0.30;
export const W_GEO       = 0.15;
export const W_CATEGORY  = 0.15;
export const W_TIME      = 0.10;

const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));

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

export function categoryScore(catA, catB) {
  if (catA === catB) return 100;
  if ((RELATED_CATEGORIES[catA] || []).includes(catB)) return 50;
  return 0;
}

export function temporalScore(dateA, dateB) {
  if (!dateA || !dateB) return 50;
  const days = Math.abs(new Date(dateA).getTime() - new Date(dateB).getTime()) / 86_400_000;
  return Math.round(100 * Math.exp(-days / 7));
}

export function computeImageScore({ llmImageScore = 50, textFingerprintSimilarity = 50, hasBothImages = false }) {
  if (!hasBothImages) {
    return { score: 50, image_unavailable: true };
  }
  const blended = Math.round(clamp(llmImageScore) * 0.7 + clamp(textFingerprintSimilarity) * 0.3);
  return { score: blended, image_unavailable: false };
}

export function computeTextScore(llmTextScore, fingerprintSimilarity) {
  return Math.round(clamp(llmTextScore) * 0.8 + clamp(fingerprintSimilarity) * 0.2);
}

export function computeOverallScore({ imageScore = 50, textScore = 50, geoScore = 50, categoryScore = 50, timeScore = 50 }) {
  return Math.round(
    clamp(imageScore)    * W_IMAGE +
    clamp(textScore)     * W_TEXT +
    clamp(geoScore)      * W_GEO +
    clamp(categoryScore) * W_CATEGORY +
    clamp(timeScore)     * W_TIME
  );
}

export function confidenceLevel(overall) {
  if (overall >= 75) return 'high';
  if (overall >= 50) return 'medium';
  return 'low';
}

export function isViableCandidate({ catScore, days, km }) {
  if (catScore === 0) return false;
  if (days > 14) return false;
  if (km !== null && km > 50) return false;
  return true;
}

export function preRankScore(catScore, geoScore, timeScore) {
  return catScore * 0.50 + geoScore * 0.25 + timeScore * 0.25;
}
