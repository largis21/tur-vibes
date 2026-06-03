import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Layer,
  Map,
  Source,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import type { Map as MapLibreMap } from "maplibre-gl";

import { useMap } from "../lib/MapContext";
import {
  BLANK_STYLE,
  regionFromMap,
  zoomFromLongitudeDelta,
} from "../lib/mapHelpers";
import { getOfflineTileTemplate, OFFLINE_LAYERS } from "../lib/offlineTiles";
import { loadLastRegion, saveLastRegion } from "../lib/persistedRegion";
import { usePointInfo } from "../lib/PointInfoContext";
import {
  KARTVERKET_TOPO_TILES,
  STEEPNESS_RUNOUT_TILES,
} from "../lib/tileCache";
import type { Region } from "../lib/types";
import { useUiState } from "../lib/UiState";
import { useOffline } from "../tools/offline/context";
import { SavedRegionsOverlay } from "./SavedRegionsOverlay";
import { PointInfoMapLayer } from "./PointInfoMapLayer";
import { UserLocation } from "./UserLocation";

const DEFAULT_REGION: Region = {
  latitude: 60.3913,
  longitude: 5.3221,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

// Cap zoom for offline topo to what the downloader stores by default.
// Online mode allows the full topo zoom range.
const OFFLINE_TOPO_MAX_ZOOM = 16;

const INITIAL_REGION: Region = loadLastRegion() ?? DEFAULT_REGION;

type MapViewProps = {
  activeToolId: string | null;
  children?: ReactNode;
};

export function MapView({ activeToolId, children }: MapViewProps) {
  const { mapRef, cursorCoordinate, regionListeners } = useMap();
  const { showSteepness, steepnessOpacity } = useUiState();
  const { open: openPointInfo } = usePointInfo();
  const { offlineMode, savedRegions, selectionBounds, downloading } =
    useOffline();
  const [mapReady, setMapReady] = useState(false);

  // Bump on every download finish so the offline raster sources remount.
  const [tilesVersion, setTilesVersion] = useState(0);
  const wasDownloading = useRef(downloading);
  useEffect(() => {
    if (wasDownloading.current && !downloading) {
      setTilesVersion((v) => v + 1);
    }
    wasDownloading.current = downloading;
  }, [downloading]);

  const handleMove = useCallback(
    (event: ViewStateChangeEvent) => {
      const map = event.target;
      mapRef.current = map;
      const region = regionFromMap(map);
      cursorCoordinate.current = {
        latitude: region.latitude,
        longitude: region.longitude,
      };
      regionListeners.current.forEach((listener) => listener(region));
    },
    [mapRef, cursorCoordinate, regionListeners],
  );

  const handleMoveEnd = useCallback((event: ViewStateChangeEvent) => {
    const region = regionFromMap(event.target);
    saveLastRegion(region);
  }, []);

  // Long-press on the map opens the point-info sheet for the touched location.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getCanvasContainer();

    const LONG_PRESS_MS = 500;
    const MOVE_THRESHOLD_PX = 8;
    let timer: number | null = null;
    let startX = 0;
    let startY = 0;
    let activePointerId: number | null = null;

    function clearTimer() {
      if (timer != null) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function onPointerDown(e: PointerEvent) {
      // Only consider primary button / first touch.
      if (e.button !== 0 && e.pointerType === "mouse") return;
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      clearTimer();
      timer = window.setTimeout(() => {
        timer = null;
        const m = mapRef.current;
        if (!m) return;
        const rect = canvas.getBoundingClientRect();
        const px = startX - rect.left;
        const py = startY - rect.top;
        const lngLat = m.unproject([px, py]);
        openPointInfo({
          latitude: lngLat.lat,
          longitude: lngLat.lng,
        });
      }, LONG_PRESS_MS);
    }

    function onPointerMove(e: PointerEvent) {
      if (e.pointerId !== activePointerId) return;
      if (
        Math.abs(e.clientX - startX) > MOVE_THRESHOLD_PX ||
        Math.abs(e.clientY - startY) > MOVE_THRESHOLD_PX
      ) {
        clearTimer();
        activePointerId = null;
      }
    }

    function onPointerEnd(e: PointerEvent) {
      if (e.pointerId !== activePointerId) return;
      clearTimer();
      activePointerId = null;
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerEnd);
    canvas.addEventListener("pointercancel", onPointerEnd);
    canvas.addEventListener("pointerleave", onPointerEnd);
    // Cancel long-press if the map starts moving (pan/zoom kicked in).
    map.on("movestart", clearTimer);
    map.on("zoomstart", clearTimer);

    return () => {
      clearTimer();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
      canvas.removeEventListener("pointerleave", onPointerEnd);
      map.off("movestart", clearTimer);
      map.off("zoomstart", clearTimer);
    };
  }, [mapRef, mapReady, openPointInfo]);

  const handleMapRef = useCallback(
    (instance: MapRef | null) => {
      if (instance) {
        const map = instance.getMap() as unknown as MapLibreMap;
        mapRef.current = map;
        const region = regionFromMap(map);
        cursorCoordinate.current = {
          latitude: region.latitude,
          longitude: region.longitude,
        };
        regionListeners.current.forEach((listener) => listener(region));
        setMapReady(true);
      } else {
        mapRef.current = null;
        setMapReady(false);
      }
    },
    [mapRef, cursorCoordinate, regionListeners],
  );

  return (
    <Map
      ref={handleMapRef}
      initialViewState={{
        longitude: INITIAL_REGION.longitude,
        latitude: INITIAL_REGION.latitude,
        zoom: zoomFromLongitudeDelta(INITIAL_REGION.longitudeDelta),
      }}
      mapStyle={BLANK_STYLE}
      onMove={handleMove}
      onMoveEnd={handleMoveEnd}
      attributionControl={false}
      // maxZoom={15.4}
      style={{ position: "absolute", inset: 0 }}
    >
      {!offlineMode ? (
        <Source
          id="topo-online"
          type="raster"
          tiles={[KARTVERKET_TOPO_TILES]}
          tileSize={256}
          maxzoom={OFFLINE_LAYERS.topo.maxZoom}
        >
          <Layer
            id="topo-online-layer"
            type="raster"
            paint={{ "raster-opacity": 1 }}
          />
        </Source>
      ) : null}

      {!offlineMode ? (
        <Source
          id="steepness-online"
          type="raster"
          tiles={[STEEPNESS_RUNOUT_TILES]}
          tileSize={256}
          maxzoom={OFFLINE_LAYERS.steepness.maxZoom}
        >
          <Layer
            id="steepness-online-layer"
            type="raster"
            paint={{ "raster-opacity": showSteepness ? steepnessOpacity : 0 }}
          />
        </Source>
      ) : null}

      {offlineMode ? (
        <Source
          key={`topo-offline-${tilesVersion}`}
          id="topo-offline"
          type="raster"
          tiles={[getOfflineTileTemplate("topo")]}
          tileSize={256}
          maxzoom={OFFLINE_TOPO_MAX_ZOOM}
        >
          <Layer
            id="topo-offline-layer"
            type="raster"
            paint={{ "raster-opacity": 1 }}
          />
        </Source>
      ) : null}

      {offlineMode && showSteepness ? (
        <Source
          key={`steepness-offline-${tilesVersion}`}
          id="steepness-offline"
          type="raster"
          tiles={[getOfflineTileTemplate("steepness")]}
          tileSize={256}
          maxzoom={OFFLINE_LAYERS.steepness.maxZoom}
        >
          <Layer
            id="steepness-offline-layer"
            type="raster"
            paint={{ "raster-opacity": steepnessOpacity }}
          />
        </Source>
      ) : null}

      <SavedRegionsOverlay
        key={`saved-regions-${offlineMode ? "off" : "on"}-${showSteepness ? "s" : "n"}-${tilesVersion}`}
        regions={savedRegions}
        selectionBounds={activeToolId === "offline" ? selectionBounds : null}
      />
      <UserLocation />
      <PointInfoMapLayer />
      {children}
    </Map>
  );
}
