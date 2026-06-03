import type { Feature, LineString } from "geojson";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { useMeasure } from "./context";

export function MeasureMapChildren() {
  const { points } = useMeasure();

  const shape = useMemo<Feature<LineString>>(
    () => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: points.map((p) => [p.longitude, p.latitude]),
      },
    }),
    [points],
  );

  if (points.length < 2) return null;

  return (
    <Source id="measure-line-src" type="geojson" data={shape}>
      <Layer
        id="measure-line"
        type="line"
        paint={{
          "line-color": "#f97316",
          "line-width": 4,
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
        }}
      />
    </Source>
  );
}
