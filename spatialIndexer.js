/**
 * FindBack AI — Geospatial Proximity Engine
 * ──────────────────────────────────────────
 * Provides Haversine distance calculations and spatial cell indexing
 * for location-based matching between lost and found reports.
 *
 * Scoring method:
 *   - Primary: Haversine great-circle distance (when both items have lat/lng)
 *   - Fallback: Quantized spatial cell match (approximate H3-style grid)
 *   - Last resort: Text-based campus zone lookup
 */

// ── Campus Zone Presets ───────────────────────────────────────────────
// Known campus spatial cell presets (approximate Resolution 9 cell IDs)
export const CAMPUS_ZONES = {
  'KRCT Campus Library': '89608447223ffff',
  'KRCT Campus Main Gate': '89608447227ffff',
  'KRCT Science Block': '8960844722bffff',
  'KRCT Sports Complex': '8960844722ffff',
  'KRCT Cafeteria': '89608447233ffff',
};

// ── Spatial Cell Generation ───────────────────────────────────────────

/**
 * Converts lat/lng coordinates to a quantized spatial cell hex identifier.
 * Uses a 0.001° grid (~111m × 111m at equator) as an approximation of
 * Uber H3 Resolution 9 cells.
 *
 * Falls back to campus zone text matching if coordinates are unavailable.
 * Returns null if no mapping can be determined.
 *
 * @param {number|null} lat
 * @param {number|null} lng
 * @param {string} [locationText='']
 * @returns {string|null} Spatial cell ID or null
 */
export function latLngToSpatialCell(lat, lng, locationText = '') {
  if (lat != null && lng != null) {
    const latIndex = Math.floor((lat + 90) * 1000).toString(16);
    const lngIndex = Math.floor((lng + 180) * 1000).toString(16);
    return `89${latIndex.padStart(5, '0')}${lngIndex.padStart(5, '0')}f`;
  }

  // Text-based campus zone lookup
  if (locationText) {
    for (const [zoneName, cellId] of Object.entries(CAMPUS_ZONES)) {
      if (locationText.toLowerCase().includes(zoneName.toLowerCase())) {
        return cellId;
      }
    }
  }

  return null; // No coordinates and no recognized zone text
}

// ── Haversine Distance ────────────────────────────────────────────────

/**
 * Computes the Haversine great-circle distance in kilometers between two
 * geographic coordinate pairs.
 *
 * @param {number|null} lat1
 * @param {number|null} lng1
 * @param {number|null} lat2
 * @param {number|null} lng2
 * @returns {number|null} Distance in km, or null if any coordinate is missing
 */
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some(v => v == null)) return null;
  const R = 6371; // Earth radius in km
  const p = Math.PI / 180;
  const dLat = (lat2 - lat1) * p;
  const dLon = (lng2 - lng1) * p;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── Proximity Score ───────────────────────────────────────────────────

/**
 * Computes a 0–100 geo-proximity score between two items.
 *
 * Tier 1 — Haversine distance (when both items have coordinates):
 *   Exponential decay: 0 km → 100, ~14 km → 50, ~46 km → 10
 *
 * Tier 2 — Spatial cell match (when one/both lack coordinates but have
 *   location text that maps to a known zone):
 *   Exact cell match → 90, no match → 40
 *
 * Tier 3 — No geo data at all → 50 (neutral; does not penalize or boost)
 *
 * @param {{ location_lat?: number, location_lng?: number, location_text?: string }} itemA
 * @param {{ location_lat?: number, location_lng?: number, location_text?: string }} itemB
 * @returns {number}
 */
export function computeSpatialProximityScore(itemA, itemB) {
  const km = haversineDistanceKm(
    itemA.location_lat, itemA.location_lng,
    itemB.location_lat, itemB.location_lng
  );

  if (km !== null) {
    // Exponential decay: 0km → 100, 20km → 37, 50km → 8
    return Math.round(100 * Math.exp(-km / 20));
  }

  // Fallback: spatial cell comparison
  const cellA = latLngToSpatialCell(itemA.location_lat, itemA.location_lng, itemA.location_text);
  const cellB = latLngToSpatialCell(itemB.location_lat, itemB.location_lng, itemB.location_text);

  if (cellA && cellB) {
    return cellA === cellB ? 90 : 40;
  }

  // No geo data available — neutral score
  return 50;
}
