/**
 * ZEXO / FindBack AI — Smart GPS Geo-Fencing & Radius Alerts Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Computes Haversine distances between lost/found item coordinates and active
 * community locations to trigger localized proximity notifications (e.g. 5km).
 */

// Haversine formula to compute distance in kilometers between two GPS points
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

/**
 * Checks if a report location is within specified radius (default 5km)
 * and generates localized alert notifications.
 */
export function checkGeoFenceAlerts(newReport, existingReports = [], radiusKm = 5.0) {
  if (!newReport || !newReport.latitude || !newReport.longitude) return [];

  const alerts = [];
  const newLat = parseFloat(newReport.latitude);
  const newLng = parseFloat(newReport.longitude);

  existingReports.forEach((item) => {
    if (item.id === newReport.id) return;
    if (!item.latitude || !item.longitude) return;

    const dist = calculateHaversineDistance(newLat, newLng, parseFloat(item.latitude), parseFloat(item.longitude));

    if (dist <= radiusKm) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `⚡ Nearby ${newReport.type === 'lost' ? 'Lost' : 'Found'} Item Alert (${dist} km)`,
        message: `An item matching "${newReport.title || newReport.item_name}" was logged within ${dist} km of ${item.location_name || 'your reported zone'}.`,
        distance_km: dist,
        report_id: newReport.id,
        target_user_id: item.reporter_id || item.user_id || 'community',
        created_date: new Date().toISOString(),
        is_read: false,
      });
    }
  });

  return alerts;
}
