import { useMemo, useRef, useState } from "react";
import type React from "react";
import { Marker } from "react-map-gl/maplibre";
import { useMap, useMapRegion } from "../lib/MapContext";
import { usePoi } from "../tools/poi/context";
import { typeEmoji } from "../lib/poiEmoji";
import type { CustomPoi } from "../tools/poi/context";
import type { Region } from "../lib/types";

// Keep this exported so MapChildren click-deselect can reference it (unused now but kept for safety)
export const CUSTOM_POI_CIRCLE_LAYER = "custom-pois-circle";

function poisInView(pois: CustomPoi[], region: Region) {
  const minLat = region.latitude - region.latitudeDelta / 2;
  const maxLat = region.latitude + region.latitudeDelta / 2;
  const minLng = region.longitude - region.longitudeDelta / 2;
  const maxLng = region.longitude + region.longitudeDelta / 2;
  return pois.filter(
    (p) =>
      p.lat >= minLat && p.lat <= maxLat && p.lng >= minLng && p.lng <= maxLng,
  );
}

import { usePointInfo } from "../lib/PointInfoContext";

const DEFAULT_REGION: Region = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 180,
  longitudeDelta: 360,
};

export function CustomPoiLayer() {
  const { mapRef } = useMap();
  const { pois, selectPoi, poiFilter, movePoiLocation } = usePoi();
  const { point: pointInfoPoint, close: closePointInfo } = usePointInfo();

  // Drag state: poiId → overridden position while dragging
  const [dragPos, setDragPos] = useState<{
    id: string;
    lat: number;
    lng: number;
  } | null>(null);

  const region = useMapRegion<Region>((r) => r ?? DEFAULT_REGION);
  // Zoom isn't carried in Region but the map ref is up-to-date by the time we
  // get a region change; read it on each tick.
  const zoom = useMapRegion<number>(() => mapRef.current?.getZoom() ?? 10);

  const detailed = zoom >= 11;

  const visiblePois = useMemo(() => {
    const inView = poisInView(pois, {
      ...region,
      latitudeDelta: region.latitudeDelta * 1.5,
      longitudeDelta: region.longitudeDelta * 1.5,
    });
    return inView.filter((p) => {
      if (
        poiFilter.types.length > 0 &&
        !poiFilter.types.includes(p.locationType ?? "")
      )
        return false;
      if (
        poiFilter.colors.length > 0 &&
        !poiFilter.colors.includes(p.color ?? "#3b82f6")
      )
        return false;
      return true;
    });
  }, [pois, region, poiFilter]);

  return (
    <>
      {visiblePois.map((p) => {
        const isDragging = dragPos?.id === p.id;
        const lat = isDragging ? dragPos!.lat : p.lat;
        const lng = isDragging ? dragPos!.lng : p.lng;
        return (
          <PoiMarker
            key={p.id}
            poi={p}
            lat={lat}
            lng={lng}
            isDragging={isDragging}
            detailed={detailed}
            onSelect={() => {
              if (pointInfoPoint) closePointInfo();
              selectPoi(p.id);
            }}
            onDragStart={() => setDragPos({ id: p.id, lat: p.lat, lng: p.lng })}
            onDragMove={(newLat, newLng) =>
              setDragPos({ id: p.id, lat: newLat, lng: newLng })
            }
            onDragEnd={(newLat, newLng) => {
              setDragPos(null);
              void movePoiLocation(p.id, newLat, newLng);
            }}
            mapRef={mapRef}
          />
        );
      })}
    </>
  );
}

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD_PX = 8;

function PoiMarker({
  poi,
  lat,
  lng,
  isDragging,
  detailed,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  mapRef,
}: {
  poi: CustomPoi;
  lat: number;
  lng: number;
  isDragging: boolean;
  detailed: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragMove: (lat: number, lng: number) => void;
  onDragEnd: (lat: number, lng: number) => void;
  mapRef: React.RefObject<import("maplibre-gl").Map | null>;
}) {
  const dragRef = useRef<{
    timer: number | null;
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    lastLat: number;
    lastLng: number;
  } | null>(null);

  function unproject(clientX: number, clientY: number) {
    const map = mapRef.current;
    if (!map) return null;
    const rect = map.getCanvasContainer().getBoundingClientRect();
    const ll = map.unproject([clientX - rect.left, clientY - rect.top]);
    return { lat: ll.lat, lng: ll.lng };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.stopPropagation();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    dragRef.current = {
      timer: window.setTimeout(() => {
        if (!dragRef.current) return;
        dragRef.current.active = true;
        dragRef.current.timer = null;
        onDragStart();
        // Prevent map from interpreting further events
        mapRef.current?.dragPan.disable();
      }, LONG_PRESS_MS),
      active: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastLat: lat,
      lastLng: lng,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = Math.abs(e.clientX - state.startX);
    const dy = Math.abs(e.clientY - state.startY);
    if (!state.active && (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX)) {
      // Moved before long-press fired — cancel
      if (state.timer != null) window.clearTimeout(state.timer);
      dragRef.current = null;
      return;
    }
    if (state.active) {
      e.stopPropagation();
      const pos = unproject(e.clientX, e.clientY);
      if (pos) {
        state.lastLat = pos.lat;
        state.lastLng = pos.lng;
        onDragMove(pos.lat, pos.lng);
      }
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    if (state.timer != null) {
      window.clearTimeout(state.timer);
      // Short tap
      onSelect();
    } else if (state.active) {
      e.stopPropagation();
      mapRef.current?.dragPan.enable();
      onDragEnd(state.lastLat, state.lastLng);
    }
    dragRef.current = null;
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    if (state.timer != null) window.clearTimeout(state.timer);
    if (state.active) mapRef.current?.dragPan.enable();
    dragRef.current = null;
  }

  return (
    <Marker longitude={lng} latitude={lat} anchor="center">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ touchAction: "none" }}
      >
        {detailed ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: isDragging ? "grabbing" : "pointer",
              userSelect: "none",
              opacity: isDragging ? 0.85 : 1,
              transform: isDragging ? "scale(1.2)" : undefined,
              transition: isDragging ? "none" : "transform 0.15s",
            }}
          >
            <span
              style={{
                fontSize: 24,
                lineHeight: 1,
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
              }}
            >
              {typeEmoji(poi.locationType)}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: poi.color ?? "#3b82f6",
                  border: "1px solid rgba(0,0,0,0.4)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                  textShadow:
                    "0 0 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)",
                  whiteSpace: "nowrap",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {poi.name}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: poi.color ?? "#3b82f6",
              border: "2px solid #fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.6)",
              cursor: isDragging ? "grabbing" : "pointer",
              transform: isDragging ? "scale(1.5)" : undefined,
            }}
          />
        )}
      </div>
    </Marker>
  );
}
