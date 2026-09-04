// Contract: Nearby Pharmacy / Distance decision — the backend calculates
// straight-line geographic distance itself; no routing API is used. Narrow,
// reusable helper (mirrors the existing pharmacyStatus.js / date.js pattern) —
// it does not own any domain workflow.

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Straight-line (great-circle) distance in kilometers between two
 * latitude/longitude points, via the Haversine formula.
 * @param {{ latitude: number, longitude: number }} pointA
 * @param {{ latitude: number, longitude: number }} pointB
 * @returns {number}
 */
export function calculateDistanceKm(pointA, pointB) {
  const dLat = toRadians(pointB.latitude - pointA.latitude);
  const dLon = toRadians(pointB.longitude - pointA.longitude);
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}
