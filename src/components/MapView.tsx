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
import { getOfflineTileTemplate } from "../lib/offlineTiles";
import { loadLastRegion, saveLastRegion } from "../lib/persistedRegion";
import { usePointInfo } from "../lib/PointInfoContext";
import { usePoi } from "../tools/poi/context";
import { getMapSource, basemaps } from "../lib/mapSources";
import type { Region } from "../lib/types";
import { useUiState } from "../lib/UiState";
import { useOffline } from "../tools/offline/context";
import { CustomPoiLayer } from "./CustomPoiLayer";
import { PeakLayer } from "./PeakLayer";
import { SavedRegionsOverlay } from "./SavedRegionsOverlay";
import { PointInfoMapLayer } from "./PointInfoMapLayer";
import { UserLocation } from "./UserLocation";

const DEFAULT_REGION: Region = {
  latitude: 60.3913,
  longitude: 5.3221,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const INITIAL_REGION: Region = loadLastRegion() ?? DEFAULT_REGION;

type MapViewProps = {
  activeToolId: string | null;
  children?: ReactNode;
};

export function MapView({ activeToolId, children }: MapViewProps) {
  const { mapRef, cursorCoordinate, regionListeners } = useMap();
  const { showSteepness, steepnessOpacity } = useUiState();
  const {
    open: openPointInfo,
    close: closePointInfo,
    point: pointInfoPoint,
  } = usePointInfo();
  const { selectedPoiId, selectPoi, setManagePanelOpen } = usePoi();
  const { offlineMode, savedRegions, polygon, downloading } = useOffline();
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
  // Short tap closes POI card and Point Info if either is open.
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
    let didMove = false;

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
      didMove = false;
      clearTimer();
      timer = window.setTimeout(() => {
        timer = null;
        const m = mapRef.current;
        if (!m) return;
        const rect = canvas.getBoundingClientRect();
        const px = startX - rect.left;
        const py = startY - rect.top;
        const lngLat = m.unproject([px, py]);
        selectPoi(null);
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
        didMove = true;
        clearTimer();
        activePointerId = null;
      }
    }

    function onPointerEnd(e: PointerEvent) {
      if (e.pointerId !== activePointerId) return;
      const wasTap = timer != null && !didMove;
      clearTimer();
      activePointerId = null;
      if (wasTap) {
        // Short tap on the map — close open panels
        closePointInfo();
        selectPoi(null);
        setManagePanelOpen(false);
      }
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
  }, [
    mapRef,
    mapReady,
    openPointInfo,
    closePointInfo,
    selectPoi,
    setManagePanelOpen,
    pointInfoPoint,
    selectedPoiId,
  ]);

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
        <>
          {/* Render all basemaps (topo, npolars-svalbard, npolars-janmayen, etc.) */}
          {basemaps().map((src) => (
            <Source
              key={`${src.id}-online`}
              id={`${src.id}-online`}
              type="raster"
              tiles={[src.online.urlTemplate]}
              tileSize={src.online.tileSize}
              {...(src.bounds && {
                bounds: [
                  src.bounds.minLon,
                  src.bounds.minLat,
                  src.bounds.maxLon,
                  src.bounds.maxLat,
                ],
              })}
              maxzoom={src.maxZoom}
            >
              <Layer
                id={`${src.id}-online-layer`}
                type="raster"
                paint={{ "raster-opacity": 1 }}
              />
            </Source>
          ))}

          {/* Render overlay sources (steepness) */}
          {showSteepness &&
            (() => {
              const steepnessSrc = getMapSource("steepness");
              if (!steepnessSrc) return null;
              return (
                <Source
                  id="steepness-online"
                  type="raster"
                  tiles={[steepnessSrc.online.urlTemplate]}
                  tileSize={steepnessSrc.online.tileSize}
                  maxzoom={steepnessSrc.maxZoom}
                >
                  <Layer
                    id="steepness-online-layer"
                    type="raster"
                    paint={{
                      "raster-opacity": steepnessOpacity,
                    }}
                  />
                </Source>
              );
            })()}
        </>
      ) : null}

      {offlineMode ? (
        <>
          {/* Render all basemaps in offline mode */}
          {basemaps().map((src) => (
            <Source
              key={`${src.id}-offline-${tilesVersion}`}
              id={`${src.id}-offline`}
              type="raster"
              tiles={[getOfflineTileTemplate(src.id)]}
              tileSize={src.online.tileSize}
              maxzoom={src.offline.maxZoom}
            >
              <Layer
                id={`${src.id}-offline-layer`}
                type="raster"
                paint={{ "raster-opacity": 1 }}
              />
            </Source>
          ))}

          {/* Render overlay sources (steepness) in offline mode if enabled */}
          {showSteepness
            ? (() => {
                const steepnessSrc = getMapSource("steepness");
                if (!steepnessSrc) return null;
                return (
                  <Source
                    key={`steepness-offline-${tilesVersion}`}
                    id="steepness-offline"
                    type="raster"
                    tiles={[getOfflineTileTemplate("steepness")]}
                    tileSize={steepnessSrc.online.tileSize}
                    maxzoom={steepnessSrc.offline.maxZoom}
                  >
                    <Layer
                      id="steepness-offline-layer"
                      type="raster"
                      paint={{ "raster-opacity": steepnessOpacity }}
                    />
                  </Source>
                );
              })()
            : null}
        </>
      ) : null}

      <SavedRegionsOverlay
        key={`saved-regions-${offlineMode ? "off" : "on"}-${showSteepness ? "s" : "n"}-${tilesVersion}`}
        regions={savedRegions}
        selectionPolygon={activeToolId === "offline" ? polygon : null}
      />
      <UserLocation />
      <CustomPoiLayer />
      <PeakLayer />
      <PointInfoMapLayer />
      {children}
    </Map>
  );
}
