/**
 * FindBack AI — Text Fingerprinting Engine
 * Generates SimHash 64-bit fingerprints and computes Hamming distance
 */

const stringHash64 = (str) => {
  let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const u1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const u2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return u1 + u2;
};

/**
 * Generates a 64-bit SimHash fingerprint from a text string.
 */
export function generateTextFingerprint(text) {
  if (!text) return '0000000000000000';
  const str = typeof text === 'string' ? text : String(text);
  const tokens = str.toLowerCase().split(/\W+/).filter(Boolean);

  if (tokens.length > 0) {
    const v = new Array(64).fill(0);
    for (const token of tokens) {
      const hexHash = stringHash64(token);
      for (let i = 0; i < 64; i++) {
        const hexCharIndex = Math.floor(i / 4);
        const bitOffset = i % 4;
        const val = parseInt(hexHash[hexCharIndex] || '0', 16);
        const bit = (val >> bitOffset) & 1;
        v[i] += bit ? 1 : -1;
      }
    }
    let fingerprint = 0n;
    for (let i = 0; i < 64; i++) {
      if (v[i] > 0) fingerprint |= (1n << BigInt(i));
    }
    return fingerprint.toString(16).padStart(16, '0');
  }

  return stringHash64(str);
}

/**
 * Calculates Hamming distance between two 16-char hex fingerprints (0–64).
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
 * Converts Hamming distance to percentage similarity (0–100%).
 */
export function compareTextFingerprints(hashA, hashB) {
  const dist = hammingDistance(hashA, hashB);
  return Math.max(0, Math.min(100, Math.round((1 - dist / 32) * 100)));
}

/**
 * Extracts a lightweight text-based feature vector from item metadata.
 */
export function extractTextFeatures(title = '', color = '', description = '') {
  const combined = `${title}:${color}:${description}`.toLowerCase();
  const fingerprint = generateTextFingerprint(combined);
  const knownColors = ['black', 'blue', 'red', 'green', 'brown', 'silver', 'white', 'grey', 'gray', 'yellow', 'pink', 'orange', 'purple'];
  const detectedColor = knownColors.find(c => combined.includes(c)) || color || 'other';

  return {
    fingerprint,
    color: detectedColor,
    structuralHash: stringHash64(combined).substring(0, 12),
  };
}
