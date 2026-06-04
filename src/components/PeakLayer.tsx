import { useEffect } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { MapMouseEvent } from "maplibre-gl";
import { useMap } from "../lib/MapContext";
import { usePeak, type Peak } from "../lib/PeakContext";

const PEAKS_SOURCE = "peaks-source";
const PEAKS_CIRCLE_LAYER = "peaks-circle";
const PEAKS_LABEL_LAYER = "peaks-label";
const GEOJSON_URL = "/pois/norway-peaks.geojson";

export function PeakLayer() {
  const { mapRef } = useMap();
  const { selectPeak } = usePeak();

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function handleClick(e: MapMouseEvent) {
      const features = map!.queryRenderedFeatures(e.point, {
        layers: [PEAKS_CIRCLE_LAYER],
      });
      if (features.length === 0) return;
      const f = features[0]!;
      const props = f.properties as Record<string, unknown>;
      const geom = f.geometry as GeoJSON.Point;
      const peak: Peak = {
        id: f.id ?? String(props["name"]),
        name: typeof props["name"] === "string" ? props["name"] : null,
        ele: typeof props["ele"] === "number" ? props["ele"] : null,
        prominence:
          typeof props["prominence"] === "number" ? props["prominence"] : null,
        lng: geom.coordinates[0]!,
        lat: geom.coordinates[1]!,
      };
      selectPeak(peak);
    }

    function handleMouseEnter() {
      map!.getCanvas().style.cursor = "pointer";
    }

    function handleMouseLeave() {
      map!.getCanvas().style.cursor = "";
    }

    map.on("click", PEAKS_CIRCLE_LAYER, handleClick);
    map.on("mouseenter", PEAKS_CIRCLE_LAYER, handleMouseEnter);
    map.on("mouseleave", PEAKS_CIRCLE_LAYER, handleMouseLeave);

    return () => {
      map.off("click", PEAKS_CIRCLE_LAYER, handleClick);
      map.off("mouseenter", PEAKS_CIRCLE_LAYER, handleMouseEnter);
      map.off("mouseleave", PEAKS_CIRCLE_LAYER, handleMouseLeave);
    };
  }, [mapRef, selectPeak]);

  return (
    <Source id={PEAKS_SOURCE} type="geojson" data={GEOJSON_URL}>
      <Layer
        id={PEAKS_CIRCLE_LAYER}
        type="circle"
        minzoom={8}
        paint={{
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 12, 5],
          "circle-color": "#f97316",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.5,
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            0.7,
            11,
            1,
          ],
        }}
      />
      <Layer
        id={PEAKS_LABEL_LAYER}
        type="symbol"
        minzoom={11}
        layout={{
          "text-field": [
            "concat",
            ["coalesce", ["get", "name"], "Peak"],
            "\n",
            ["concat", ["to-string", ["coalesce", ["get", "ele"], ""]], " m"],
          ],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 11,
          "text-anchor": "top",
          "text-offset": [0, 0.8],
          "text-max-width": 8,
          "symbol-placement": "point",
        }}
        paint={{
          "text-color": "#f97316",
          "text-halo-color": "rgba(0,0,0,0.8)",
          "text-halo-width": 1.5,
        }}
      />
    </Source>
  );
}
