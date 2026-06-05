import type { Feature, LineString } from "geojson";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { useMeasure } from "./context";

export function MeasureMapChildren() {
  const { points, cursorPosition } = useMeasure();

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

  // Preview line from last point to cursor
  const previewShape = useMemo<Feature<LineString> | null>(() => {
    if (points.length === 0) return null;
    const lastPoint = points[points.length - 1];
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [lastPoint.longitude, lastPoint.latitude],
          [cursorPosition.longitude, cursorPosition.latitude],
        ],
      },
    };
  }, [points, cursorPosition]);

  if (points.length < 2 && !previewShape) return null;

  return (
    <>
      {points.length >= 2 && (
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
      )}
      {previewShape && (
        <Source id="measure-preview-src" type="geojson" data={previewShape}>
          <Layer
            id="measure-preview"
            type="line"
            paint={{
              "line-color": "#f97316",
              "line-width": 3,
              "line-dasharray": [0.5, 2],
              "line-opacity": 0.6,
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />
        </Source>
      )}
    </>
  );
}
