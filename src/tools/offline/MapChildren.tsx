import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Polygon,
} from "geojson";
import { useEffect, useMemo, useRef } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { useMap } from "../../lib/MapContext";
import { useOffline } from "./context";

const VERTEX_LAYER_ID = "offline-polygon-vertices";
/** Half-side of the square used for picking vertices under a tap (px). */
const HIT_TOLERANCE = 14;

export function OfflineMapChildren() {
  const { polygon, updatePolygonPoint, selfIntersecting, downloading } =
    useOffline();
  const { mapRef } = useMap();
  const polygonRef = useRef(polygon);
  polygonRef.current = polygon;
  const downloadingRef = useRef(downloading);
  downloadingRef.current = downloading;

  // Vertex drag handling. Attaches pointer listeners to the map's canvas
  // and disables map panning while a vertex is being moved.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getCanvasContainer();

    let dragIndex: number | null = null;
    let activePointerId: number | null = null;
    let dragStarted = false;

    function pointerOffset(e: PointerEvent): [number, number] {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function onPointerDown(e: PointerEvent) {
      if (downloadingRef.current) return;
      if (polygonRef.current.length === 0) return;
      const m = mapRef.current;
      if (!m) return;
      const [px, py] = pointerOffset(e);
      const features = m.queryRenderedFeatures(
        [
          [px - HIT_TOLERANCE, py - HIT_TOLERANCE],
          [px + HIT_TOLERANCE, py + HIT_TOLERANCE],
        ],
        { layers: [VERTEX_LAYER_ID] },
      );
      if (features.length === 0) return;
      const idx = features[0]!.properties?.index;
      if (typeof idx !== "number") return;
      dragIndex = idx;
      activePointerId = e.pointerId;
      dragStarted = false;
      // Prevent the map's own drag-pan from kicking in.
      m.dragPan.disable();
      // Stop the long-press / map listeners on the same canvas from running.
      e.stopImmediatePropagation();
    }

    function onPointerMove(e: PointerEvent) {
      if (dragIndex === null || e.pointerId !== activePointerId) return;
      const m = mapRef.current;
      if (!m) return;
      dragStarted = true;
      const [px, py] = pointerOffset(e);
      const lngLat = m.unproject([px, py]);
      updatePolygonPoint(dragIndex, {
        latitude: lngLat.lat,
        longitude: lngLat.lng,
      });
      e.stopPropagation();
    }

    function onPointerEnd(e: PointerEvent) {
      if (e.pointerId !== activePointerId) return;
      const m = mapRef.current;
      const wasDragging = dragStarted;
      dragIndex = null;
      activePointerId = null;
      dragStarted = false;
      m?.dragPan.enable();
      if (wasDragging) e.stopPropagation();
    }

    // Register on the canvas in capture phase so we can intercept before
    // MapView's long-press handler. Move/up live on window so the drag
    // continues even if the pointer leaves the canvas.
    canvas.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      } as EventListenerOptions);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      map.dragPan.enable();
    };
  }, [mapRef, updatePolygonPoint]);

  const fillData = useMemo<Feature<Polygon> | null>(() => {
    if (polygon.length < 3) return null;
    const ring = polygon.map(
      (p) => [p.longitude, p.latitude] as [number, number],
    );
    ring.push(ring[0]!);
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [ring] },
    };
  }, [polygon]);

  const lineData = useMemo<Feature<LineString> | null>(() => {
    if (polygon.length < 2) return null;
    const coords = polygon.map(
      (p) => [p.longitude, p.latitude] as [number, number],
    );
    if (polygon.length >= 3) coords.push(coords[0]!);
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: coords },
    };
  }, [polygon]);

  const vertexData = useMemo<FeatureCollection<Point> | null>(() => {
    if (polygon.length === 0) return null;
    return {
      type: "FeatureCollection",
      features: polygon.map((p, i) => ({
        type: "Feature",
        properties: { index: i },
        geometry: {
          type: "Point",
          coordinates: [p.longitude, p.latitude],
        },
      })),
    };
  }, [polygon]);

  const strokeColor = selfIntersecting ? "#dc2626" : "#f97316";
  const fillColor = selfIntersecting ? "#dc2626" : "#f97316";

  return (
    <>
      {fillData ? (
        <Source id="offline-polygon-fill-src" type="geojson" data={fillData}>
          <Layer
            id="offline-polygon-fill"
            type="fill"
            paint={{
              "fill-color": fillColor,
              "fill-opacity": 0.25,
            }}
          />
        </Source>
      ) : null}
      {lineData ? (
        <Source id="offline-polygon-line-src" type="geojson" data={lineData}>
          <Layer
            id="offline-polygon-line"
            type="line"
            paint={{
              "line-color": strokeColor,
              "line-width": 2,
              "line-dasharray": [3, 2],
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />
        </Source>
      ) : null}
      {vertexData ? (
        <Source
          id="offline-polygon-vertices-src"
          type="geojson"
          data={vertexData}
        >
          <Layer
            id={VERTEX_LAYER_ID}
            type="circle"
            paint={{
              "circle-radius": 7,
              "circle-color": strokeColor,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            }}
          />
        </Source>
      ) : null}
    </>
  );
}
