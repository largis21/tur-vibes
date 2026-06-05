import { destinationPoint } from "./geoBearing";
import type { LatLng, ElevationGrid } from "./types";

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

/**
 * WCS raster data structure
 */
type RasterData = {
  width: number;
  height: number;
  data: Float32Array;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

/**
 * Fetch elevation raster from Kartverket DTM WCS service
 */
async function fetchWCSDTM(
  bbox: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
  signal?: AbortSignal,
): Promise<RasterData> {
  const WCS_URL = "https://wcs.geonorge.no/skwms1/wcs.hoyde-dtm_somlos";

  // WCS 2.0.1 with correct coverage ID (las_dtm) and axis labels (Lat/Lon)
  const url =
    `${WCS_URL}?service=WCS&version=2.0.1&request=GetCoverage` +
    `&coverageId=las_dtm&format=image/tiff` +
    `&subset=Lat(${bbox.minLat},${bbox.maxLat})` +
    `&subset=Lon(${bbox.minLon},${bbox.maxLon})`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `WCS GetCoverage failed: ${response.status} ${response.statusText} - ${text.slice(0, 200)}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  // Parse GeoTIFF using dynamic import
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geotiff = (await import("geotiff")) as any;
  const tiff = await geotiff.fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();

  const width = image.getWidth();
  const height = image.getHeight();
  const rasterData = await image.readRasters();

  // Extract the first band (elevation values)
  const elevationBand = Array.isArray(rasterData)
    ? rasterData[0]
    : rasterData;
  const data = new Float32Array(elevationBand as ArrayLike<number>);

  return {
    width,
    height,
    data,
    minLat: bbox.minLat,
    maxLat: bbox.maxLat,
    minLon: bbox.minLon,
    maxLon: bbox.maxLon,
  };
}

/**
 * Sample elevation value from raster at a given lat/lon coordinate
 * Uses bilinear interpolation for smooth values
 */
function sampleRasterElevation(
  raster: RasterData,
  lat: number,
  lon: number,
  bbox: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
): number | null {
  // Convert lat/lon to pixel coordinates
  const pixelX = ((lon - bbox.minLon) / (bbox.maxLon - bbox.minLon)) *
    (raster.width - 1);
  const pixelY = ((bbox.maxLat - lat) / (bbox.maxLat - bbox.minLat)) *
    (raster.height - 1);

  // Check bounds
  if (
    pixelX < 0 ||
    pixelX >= raster.width ||
    pixelY < 0 ||
    pixelY >= raster.height
  ) {
    return null;
  }

  // Bilinear interpolation
  const x0 = Math.floor(pixelX);
  const x1 = Math.min(x0 + 1, raster.width - 1);
  const y0 = Math.floor(pixelY);
  const y1 = Math.min(y0 + 1, raster.height - 1);

  const fx = pixelX - x0;
  const fy = pixelY - y0;

  const getPixel = (x: number, y: number): number | null => {
    const idx = y * raster.width + x;
    const val = raster.data[idx];
    // Check for invalid values (nodata often -9999 or similar)
    return !Number.isFinite(val) || val < -9000 ? null : val;
  };

  const v00 = getPixel(x0, y0);
  const v10 = getPixel(x1, y0);
  const v01 = getPixel(x0, y1);
  const v11 = getPixel(x1, y1);

  // If all corners are nodata, return null
  if (v00 === null && v10 === null && v01 === null && v11 === null) {
    return null;
  }

  // Interpolate using available values
  let result = 0;
  let count = 0;

  if (v00 !== null) {
    result += v00 * (1 - fx) * (1 - fy);
    count += (1 - fx) * (1 - fy);
  }
  if (v10 !== null) {
    result += v10 * fx * (1 - fy);
    count += fx * (1 - fy);
  }
  if (v01 !== null) {
    result += v01 * (1 - fx) * fy;
    count += (1 - fx) * fy;
  }
  if (v11 !== null) {
    result += v11 * fx * fy;
    count += fx * fy;
  }

  return count > 0 ? result / count : null;
}

/**
 * Fetch elevation data in a grid pattern around a center point using WCS.
 * Queries the Kartverket DTM WCS service for a raster covering the area,
 * then samples it to create the requested grid.
 *
 * @param center - Center point (lat/lon)
 * @param radiusMeters - Distance from center to edge (in meters)
 * @param gridSize - Number of points per side (e.g., 30 = 900 total points)
 * @param signal - Abort signal
 */
export async function fetchElevationGrid(
  center: LatLng,
  radiusMeters: number = 5000,
  gridSize: number = 30,
  signal?: AbortSignal,
): Promise<ElevationGrid> {
  // Convert center point and radius to a bounding box in WGS84 (EPSG:4326)
  const latDelta = radiusMeters / 111320; // meters to degrees (North-South)
  const lonDelta =
    radiusMeters / (111320 * Math.cos((center.latitude * Math.PI) / 180)); // East-West

  const bbox = {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLon: center.longitude - lonDelta,
    maxLon: center.longitude + lonDelta,
  };

  // Fetch elevation raster from WCS service
  const rasterData = await fetchWCSDTM(bbox, signal);

  // Build output grid by sampling the raster
  const points: (LatLng & { elevation: number | null })[] = [];
  const step = (2 * radiusMeters) / (gridSize - 1);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const offsetNorth = -radiusMeters + i * step;
      const offsetEast = -radiusMeters + j * step;

      const latDelta = offsetNorth / 111320;
      const lonDelta =
        offsetEast / (111320 * Math.cos((center.latitude * Math.PI) / 180));

      const lat = center.latitude + latDelta;
      const lon = center.longitude + lonDelta;

      // Sample elevation from raster
      const elevation = sampleRasterElevation(rasterData, lat, lon, bbox);

      points.push({ latitude: lat, longitude: lon, elevation });
    }
  }

  return { center, radiusMeters, gridSize, points };
}

