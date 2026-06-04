import { useEffect, useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { MapMouseEvent } from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import { useMap } from "../../lib/MapContext";
import { usePoi } from "./context";

const SOURCE = "custom-pois-src";
const CIRCLE_LAYER = "custom-pois-circle";
const LABEL_LAYER = "custom-pois-label";

export function PoiMapChildren() {
  const { mapRef } = useMap();
  const { pois, selectPoi } = usePoi();

  const geojson = useMemo<FeatureCollection<Point>>(
    () => ({
      type: "FeatureCollection",
      features: pois.map((p) => ({
        type: "Feature",
        id: p.id,
        properties: { id: p.id, name: p.name },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      })),
    }),
    [pois],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function handleClick(e: MapMouseEvent) {
      const features = map!.queryRenderedFeatures(e.point, {
        layers: [CIRCLE_LAYER],
      });
      if (features.length === 0) return;
      const id = features[0]!.properties?.["id"] as string;
      selectPoi(id);
    }

    function onEnter() {
      map!.getCanvas().style.cursor = "pointer";
    }
    function onLeave() {
      map!.getCanvas().style.cursor = "";
    }

    map.on("click", CIRCLE_LAYER, handleClick);
    map.on("mouseenter", CIRCLE_LAYER, onEnter);
    map.on("mouseleave", CIRCLE_LAYER, onLeave);
    return () => {
      map.off("click", CIRCLE_LAYER, handleClick);
      map.off("mouseenter", CIRCLE_LAYER, onEnter);
      map.off("mouseleave", CIRCLE_LAYER, onLeave);
    };
  }, [mapRef, selectPoi]);

  return (
    <Source id={SOURCE} type="geojson" data={geojson}>
      <Layer
        id={CIRCLE_LAYER}
        type="circle"
        paint={{
          "circle-radius": 8,
          "circle-color": "#3b82f6",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        }}
      />
      <Layer
        id={LABEL_LAYER}
        type="symbol"
        layout={{
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 12,
          "text-anchor": "top",
          "text-offset": [0, 1],
        }}
        paint={{
          "text-color": "#3b82f6",
          "text-halo-color": "rgba(0,0,0,0.85)",
          "text-halo-width": 1.5,
        }}
      />
    </Source>
  );
}
