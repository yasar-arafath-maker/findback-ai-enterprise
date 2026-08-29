/**
 * FindBack AI — Geospatial Proximity Engine
 * Provides Haversine distance calculations and spatial cell indexing
 */

export const CAMPUS_ZONES = {
  'KRCT Campus Library': '89608447223ffff',
  'KRCT Campus Main Gate': '89608447227ffff',
  'KRCT Science Block': '8960844722bffff',
  'KRCT Sports Complex': '8960844722ffff',
  'KRCT Cafeteria': '89608447233ffff',
};

/**
 * Converts lat/lng coordinates to a quantized spatial cell hex identifier.
 */
export function latLngToSpatialCell(lat, lng, locationText = '') {
  if (lat != null && lng != null) {
    const latIndex = Math.floor((lat + 90) * 1000).toString(16);
    const lngIndex = Math.floor((lng + 180) * 1000).toString(16);
    return `89${latIndex.padStart(5, '0')}${lngIndex.padStart(5, '0')}f`;
  }

  if (locationText) {
    for (const [zoneName, cellId] of Object.entries(CAMPUS_ZONES)) {
      if (locationText.toLowerCase().includes(zoneName.toLowerCase())) {
        return cellId;
      }
    }
  }

  return null;
}

/**
 * Computes Haversine great-circle distance in kilometers.
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

/**
 * Computes a 0–100 geo-proximity score between two items.
 */
export function computeSpatialProximityScore(itemA, itemB) {
  const km = haversineDistanceKm(
    itemA?.location_lat, itemA?.location_lng,
    itemB?.location_lat, itemB?.location_lng
  );

  if (km !== null) {
    return Math.round(100 * Math.exp(-km / 20));
  }

  const cellA = latLngToSpatialCell(itemA?.location_lat, itemA?.location_lng, itemA?.location_text);
  const cellB = latLngToSpatialCell(itemB?.location_lat, itemB?.location_lng, itemB?.location_text);

  if (cellA && cellB) {
    return cellA === cellB ? 90 : 40;
  }

  return 50;
}
