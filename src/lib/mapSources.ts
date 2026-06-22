/** Map source registry with unified definition of basemaps and overlays. */

export type MapSourceKind = "basemap" | "overlay";

export type LngLatBounds = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

export type MapSource = {
  /** Stable identifier for this source. */
  id: string;
  /** "basemap" = mutually exclusive backgrounds; "overlay" = renders on top. */
  kind: MapSourceKind;
  /**
   * Mutually exclusive group for basemaps. Only basemaps belonging to the
   * active group are rendered at any given time. Defaults to "topo".
   */
  group?: "topo" | "satellite";
  /** UI label. */
  label: string;
  /** Attribution text (HTML allowed). */
  attribution: string;
  /** Online (HTTP) tile configuration. */
  online: {
    urlTemplate: string;
    tileSize: number;
    scheme?: "xyz" | "tms"; // defaults to "xyz"
  };
  /** Offline (custom protocol) configuration. */
  offline: {
    protocol: string; // e.g. "offline-topo"
    maxZoom: number;
  };
  /** Minimum zoom level (0-based, defaults to 0). */
  minZoom?: number;
  /** Maximum zoom level for this source. */
  maxZoom: number;
  /** Geographic bounds where this source has coverage. Omit for world coverage. */
  bounds?: LngLatBounds;
};

/**
 * The centralized map source registry.
 * Sources are listed in rendering order: earlier items render first (bottom layer).
 * Basemaps that render later will appear on top of basemaps that render earlier.
 */
export const MAP_SOURCES: MapSource[] = [
  {
    id: "npolars-svalbard",
    kind: "basemap",
    group: "topo",
    label: "Svalbard base map (Norsk Polarinstitutt)",
    attribution: "© Norsk Polarinstitutt (CC BY 4.0)",
    online: {
      urlTemplate:
        "https://geodata.npolar.no/arcgis/rest/services/Basisdata/NP_Basiskart_Svalbard_WMTS_3857/MapServer/tile/{z}/{y}/{x}",
      tileSize: 256,
      scheme: "xyz",
    },
    offline: {
      protocol: "offline-npolars-svalbard",
      maxZoom: 17,
    },
    maxZoom: 17,
    bounds: {
      minLon: 7.46,
      minLat: 73,
      maxLon: 36.04,
      maxLat: 81.4,
    },
  },

  {
    id: "npolars-janmayen",
    kind: "basemap",
    group: "topo",
    label: "Jan Mayen base map (Norsk Polarinstitutt)",
    attribution: "© Norsk Polarinstitutt (CC BY 4.0)",
    online: {
      urlTemplate:
        "https://geodata.npolar.no/arcgis/rest/services/Basisdata/NP_Basiskart_JanMayen_WMTS_3857/MapServer/tile/{z}/{y}/{x}",
      tileSize: 256,
      scheme: "xyz",
    },
    offline: {
      protocol: "offline-npolars-janmayen",
      maxZoom: 16,
    },
    maxZoom: 16,
    bounds: {
      minLon: -11.06,
      minLat: 67.86,
      maxLon: -5.89,
      maxLat: 71.6,
    },
  },

  {
    id: "topo",
    kind: "basemap",
    group: "topo",
    label: "Topographic map (Kartverket)",
    attribution: "© Kartverket",
    online: {
      urlTemplate:
        "https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png",
      tileSize: 256,
    },
    offline: {
      protocol: "offline-topo",
      maxZoom: 18,
    },
    maxZoom: 18,
    bounds: {
      minLon: -5,
      minLat: 57,
      maxLon: 32,
      maxLat: 72,
    },
  },

  {
    id: "satellite",
    kind: "basemap",
    group: "satellite",
    label: "Satellite imagery (Esri)",
    attribution:
      "© Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    online: {
      urlTemplate:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      tileSize: 256,
      scheme: "xyz",
    },
    offline: {
      protocol: "offline-satellite",
      maxZoom: 18,
    },
    maxZoom: 18,
  },

  {
    id: "steepness",
    kind: "overlay",
    label: "Avalanche risk (NVE)",
    attribution: "© NVE",
    online: {
      urlTemplate:
        "https://gis3.nve.no/arcgis/rest/services/wmts/Bratthet_med_utlop_2024/MapServer/tile/{z}/{y}/{x}",
      tileSize: 256,
    },
    offline: {
      protocol: "offline-steepness",
      maxZoom: 16,
    },
    maxZoom: 16,
    // No bounds constraint — Norwegian coverage
  },
];

/**
 * Retrieve a source by ID.
 */
export function getMapSource(id: string): MapSource | undefined {
  return MAP_SOURCES.find((s) => s.id === id);
}

/**
 * All basemap sources.
 */
export function basemaps(): MapSource[] {
  return MAP_SOURCES.filter((s) => s.kind === "basemap");
}

/**
 * All basemaps belonging to the given group.
 */
export function basemapsForGroup(
  group: "topo" | "satellite",
): MapSource[] {
  return MAP_SOURCES.filter(
    (s) => s.kind === "basemap" && (s.group ?? "topo") === group,
  );
}

/**
 * All overlay sources.
 */
export function overlays(): MapSource[] {
  return MAP_SOURCES.filter((s) => s.kind === "overlay");
}

/**
 * Test if two bounding boxes intersect.
 * Handles date-line wrapping for polygonBounds (lon can exceed ±180).
 */
function boundsIntersect(
  b1: { minLon: number; minLat: number; maxLon: number; maxLat: number },
  b2: LngLatBounds,
): boolean {
  // Latitude check is straightforward.
  if (b1.maxLat < b2.minLat || b1.minLat > b2.maxLat) return false;

  // Longitude check. If b1 wraps around the date line (minLon > maxLon),
  // it covers minLon..180, -180..maxLon.
  if (b1.minLon <= b1.maxLon) {
    // No wrapping.
    return b1.maxLon >= b2.minLon && b1.minLon <= b2.maxLon;
  } else {
    // b1 wraps: cover minLon..180 or -180..maxLon.
    return b1.minLon <= b2.maxLon || b1.maxLon >= b2.minLon;
  }
}

/**
 * Compute bounding box of a polygon (as {lng, lat} objects, {longitude, latitude} objects, or [lon, lat] tuples).
 * Returns bounds that may wrap around date line if needed.
 */
function polygonBBox(polygon: PolygonPoint[]): {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
} {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const point of polygon) {
    let lng: number;
    let lat: number;

    if (Array.isArray(point)) {
      [lng, lat] = point;
    } else if ("lng" in point) {
      lng = point.lng;
      lat = point.lat;
    } else {
      lng = point.longitude;
      lat = point.latitude;
    }

    minLon = Math.min(minLon, lng);
    maxLon = Math.max(maxLon, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLon, maxLon, minLat, maxLat };
}

export type PolygonPoint =
  | { lng: number; lat: number }
  | { longitude: number; latitude: number }
  | [number, number];

/**
 * Return all sources whose bounds intersect the given polygon.
 * If a source has no bounds, it's considered world-wide and always included.
 */
export function sourcesIntersecting(polygon: PolygonPoint[]): MapSource[] {
  if (polygon.length === 0) return [];

  const pBounds = polygonBBox(polygon);

  return MAP_SOURCES.filter((source) => {
    if (!source.bounds) return true; // World coverage
    return boundsIntersect(pBounds, source.bounds);
  });
}

/**
 * Test if a tile's bounding box (as Web Mercator x, y, z) overlaps a source's bounds.
 */
export function tileMatchesBounds(
  source: MapSource,
  z: number,
  x: number,
  y: number,
): boolean {
  if (!source.bounds) return true; // World coverage

  // Convert tile to degrees.
  const n = Math.pow(2, z);
  const lon1 = (x / n) * 360 - 180;
  const lon2 = ((x + 1) / n) * 360 - 180;

  // Mercator latitude.
  const lat2 =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const lat1 =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;

  // Check if tile bounds intersect source bounds.
  return boundsIntersect(
    {
      minLon: lon1,
      maxLon: lon2,
      minLat: Math.min(lat1, lat2),
      maxLat: Math.max(lat1, lat2),
    },
    source.bounds,
  );
}

/**
 * Normalize legacy OfflineLayerId type to string for easier migration.
 * @deprecated Use string directly; OfflineLayerId is no longer needed.
 */
export type OfflineLayerId = string;
