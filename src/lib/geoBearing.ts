import type { LatLng } from "./types";

const EARTH_RADIUS_METERS = 6371000;

/**
 * Returns the destination point reached by travelling `distanceMeters` from
 * `start` along the great-circle path with initial bearing `bearingDeg`
 * (0 = true north, increasing clockwise).
 */
export function destinationPoint(
  start: LatLng,
  distanceMeters: number,
  bearingDeg: number,
): LatLng {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearingRad = (bearingDeg * Math.PI) / 180;
  const lat1 = (start.latitude * Math.PI) / 180;
  const lon1 = (start.longitude * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (((lon2 * 180) / Math.PI + 540) % 360) - 180,
  };
}
