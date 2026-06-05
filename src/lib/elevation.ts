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

const STEDSNAVN_PUNKT_URL = "https://ws.geonorge.no/stedsnavn/v1/punkt";

type StedPunktResult = {
  meterFraPunkt: number;
  navneobjekttype: string;
  stedsnavn: { skrivemåte: string; navnestatus: string }[];
};

type StedPunktResponse = {
  navn: StedPunktResult[];
};

/**
 * Finds the nearest named place to the given coordinate using Kartverket's
 * Stedsnavn punkt API. Returns a structured result or null if nothing is found.
 */
export type NearestPlaceResult = {
  name: string;
  type: string;
  distanceM: number;
};

export async function fetchNearestPlaceName(
  point: LatLng,
  signal?: AbortSignal,
): Promise<NearestPlaceResult | null> {
  const params = new URLSearchParams({
    nord: String(point.latitude),
    ost: String(point.longitude),
    koordsys: "4326",
    utkoordsys: "4326",
    radius: "200",
    treffPerSide: "10",
    side: "1",
  });
  const res = await fetch(`${STEDSNAVN_PUNKT_URL}?${params}`, { signal });
  if (!res.ok) return null;
  const data: StedPunktResponse = await res.json();
  const results = data.navn ?? [];
  if (results.length === 0) return null;

  // Prefer the closest result whose primary name is a natural feature.
  const PREFERRED_TYPES = new Set([
    "Fjell",
    "Topp",
    "Ås",
    "Haug",
    "Dal",
    "Dalføre",
    "Vidde",
    "Bre",
    "Elv",
    "Innsjø",
    "Vann",
    "Tjern",
    "Skar",
    "Vik",
    "Halvøy",
    "Nes",
  ]);
  const sorted = [...results].sort((a, b) => a.meterFraPunkt - b.meterFraPunkt);
  const preferred = sorted.find((r) => PREFERRED_TYPES.has(r.navneobjekttype));
  const best = preferred ?? sorted[0];
  if (!best) return null;

  const name =
    best.stedsnavn.find((n) => n.navnestatus === "hovednavn")?.skrivemåte ??
    best.stedsnavn[0]?.skrivemåte;
  if (!name) return null;

  return {
    name,
    type: best.navneobjekttype,
    distanceM: best.meterFraPunkt,
  };
}

