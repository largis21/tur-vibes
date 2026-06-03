import { destinationPoint } from "./geoBearing";
import type { LatLng } from "./types";

const ENDPOINT = "https://ws.geonorge.no/hoydedata/v1/punkt";

type ApiPoint = {
  x: number;
  y: number;
  z: number | null;
  datakilde?: string;
  terreng?: string;
};

type ApiResponse = {
  koordsys: number;
  punkter: ApiPoint[];
};

/**
 * Fetch the best-available terrain elevation for one or more lat/lon points.
 * Returns elevations (meters above sea level) in the same order as `points`.
 * A `null` entry means the API had no elevation for that point.
 */
export async function fetchElevations(
  points: LatLng[],
  signal?: AbortSignal,
): Promise<(number | null)[]> {
  if (points.length === 0) return [];
  // Coordinate order for `punkter` is [ost, nord] = [lon, lat].
  const punkter = points.map((p) => [p.longitude, p.latitude]);
  const url = `${ENDPOINT}?koordsys=4258&punkter=${encodeURIComponent(
    JSON.stringify(punkter),
  )}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Elevation API ${res.status}`);
  }
  const data = (await res.json()) as ApiResponse;
  return data.punkter.map((p) =>
    typeof p.z === "number" && Number.isFinite(p.z) ? p.z : null,
  );
}

export type PointInfo = {
  /** Center elevation in meters, or null if unknown. */
  elevation: number | null;
  /** Slope at the point in degrees, or null if any neighbor is missing. */
  slopeDeg: number | null;
  /** Aspect (direction the slope faces) in degrees, 0=N, 90=E. */
  aspectDeg: number | null;
};

/**
 * Sample a 4-direction cross around `center` and compute slope via central
 * difference. `sampleDistanceMeters` is the half-width of the cross.
 */
export async function fetchPointInfo(
  center: LatLng,
  sampleDistanceMeters = 30,
  signal?: AbortSignal,
): Promise<PointInfo> {
  const north = destinationPoint(center, sampleDistanceMeters, 0);
  const south = destinationPoint(center, sampleDistanceMeters, 180);
  const east = destinationPoint(center, sampleDistanceMeters, 90);
  const west = destinationPoint(center, sampleDistanceMeters, 270);

  const elevations = await fetchElevations(
    [center, north, south, east, west],
    signal,
  );
  const [zC, zN, zS, zE, zW] = elevations;

  const elevation = zC;

  if (zN == null || zS == null || zE == null || zW == null) {
    return { elevation, slopeDeg: null, aspectDeg: null };
  }
  // Central differences. dz/dy: positive = uphill towards north.
  const dzdy = (zN - zS) / (2 * sampleDistanceMeters);
  const dzdx = (zE - zW) / (2 * sampleDistanceMeters);
  const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));
  const slopeDeg = (slopeRad * 180) / Math.PI;
  // Aspect: direction the slope faces (downhill). Convert from math angle
  // (atan2 of -gradient) to compass bearing (0=N, clockwise).
  let aspectDeg: number | null = null;
  if (dzdx !== 0 || dzdy !== 0) {
    // Downhill direction vector = -gradient.
    const downX = -dzdx;
    const downY = -dzdy;
    // atan2(downX, downY): screen-style with N=up, clockwise.
    const a = (Math.atan2(downX, downY) * 180) / Math.PI;
    aspectDeg = (a + 360) % 360;
  }
  return { elevation, slopeDeg, aspectDeg };
}
