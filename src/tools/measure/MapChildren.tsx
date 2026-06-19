import type { Feature, LineString, Point, FeatureCollection } from "geojson";
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

  // Points for display
  const pointsFeature = useMemo<FeatureCollection<Point>>(
    () => ({
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Point" as const,
          coordinates: [p.longitude, p.latitude],
        },
      })),
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

  if (points.length < 1 && !previewShape) return null;

  return (
    <>
      {points.length >= 1 && (
        <Source id="measure-points-src" type="geojson" data={pointsFeature}>
          <Layer
            id="measure-points"
            type="circle"
            paint={{
              "circle-radius": 4,
              "circle-color": "#f97316",
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#ffffff",
            }}
          />
        </Source>
      )}
      {points.length >= 2 && (
        <Source id="measure-line-src" type="geojson" data={shape}>
          <Layer
            id="measure-line"
            type="line"
            paint={{
              "line-color": "#f97316",
              "line-width": 2.5,
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
              "line-width": 2,
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
