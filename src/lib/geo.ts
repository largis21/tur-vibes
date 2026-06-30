import type { LatLng } from "./types";

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function getDistanceMeters(start: LatLng, end: LatLng) {
  const latitudeDelta = toRadians(end.latitude - start.latitude);
  const longitudeDelta = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    EARTH_RADIUS_METERS *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function getTotalDistanceMeters(points: LatLng[]) {
  return points.reduce((totalDistance, point, index) => {
    if (index === 0) return totalDistance;
    return totalDistance + getDistanceMeters(points[index - 1], point);
  }, 0);
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

/** Approximate ground meters per screen pixel at a given Web Mercator zoom. */
export function metersPerPixel(latitude: number, zoom: number): number {
  return (
    (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom)
  );
}

/**
 * Returns `count` evenly-spaced LatLng points sampled along the multi-segment
 * path. Requires at least 2 points and count >= 2.
 */
export function samplePointsAlongPath(
  points: LatLng[],
  count: number,
): LatLng[] {
  if (points.length < 2 || count < 2) return [...points];

  const cumDist: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cumDist.push(cumDist[i - 1] + getDistanceMeters(points[i - 1], points[i]));
  }
  const total = cumDist[cumDist.length - 1];

  if (total === 0) {
    return Array.from({ length: count }, () => ({ ...points[0] }));
  }

  const result: LatLng[] = [];
  for (let i = 0; i < count; i++) {
    const targetDist = (i / (count - 1)) * total;
    let segIdx = cumDist.length - 2;
    for (let j = 0; j < cumDist.length - 1; j++) {
      if (targetDist <= cumDist[j + 1]) {
        segIdx = j;
        break;
      }
    }
    const segLen = cumDist[segIdx + 1] - cumDist[segIdx];
    const t = segLen === 0 ? 0 : (targetDist - cumDist[segIdx]) / segLen;
    const p0 = points[segIdx];
    const p1 = points[segIdx + 1];
    result.push({
      latitude: p0.latitude + t * (p1.latitude - p0.latitude),
      longitude: p0.longitude + t * (p1.longitude - p0.longitude),
    });
  }
  return result;
}
