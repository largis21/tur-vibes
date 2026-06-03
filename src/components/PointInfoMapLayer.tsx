import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import { useEffect, useMemo, useState } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { metersPerPixel } from "../lib/geo";
import { destinationPoint } from "../lib/geoBearing";
import { useMap } from "../lib/MapContext";
import { usePointInfo } from "../lib/PointInfoContext";

export function PointInfoMapLayer() {
  const { point, info } = usePointInfo();
  const { mapRef } = useMap();
  const [zoom, setZoom] = useState<number>(
    () => mapRef.current?.getZoom() ?? 12,
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onZoom = () => setZoom(map.getZoom());
    onZoom();
    map.on("zoom", onZoom);
    return () => {
      map.off("zoom", onZoom);
    };
  }, [mapRef, point]);

  const markerData = useMemo<FeatureCollection<Point> | null>(() => {
    if (!point) return null;
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [point.longitude, point.latitude],
          },
        },
      ],
    };
  }, [point]);

  const arrowData = useMemo<{
    line: FeatureCollection<LineString>;
  } | null>(() => {
    if (!point) return null;
    if (info?.aspectDeg == null || info.slopeDeg == null) return null;
    const mpp = metersPerPixel(point.latitude, zoom);
    const length = 10 * mpp;
    const headLen = 3 * mpp;
    const headAngle = 35; // degrees off the shaft
    const bearing = info.aspectDeg;
    const tip = destinationPoint(point, length, bearing);
    // Chevron legs point back from the tip toward the shaft.
    const left = destinationPoint(tip, headLen, bearing + 180 - headAngle);
    const right = destinationPoint(tip, headLen, bearing + 180 + headAngle);
    const shaft: Feature<LineString> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [point.longitude, point.latitude],
          [tip.longitude, tip.latitude],
        ],
      },
    };
    const head: Feature<LineString> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [left.longitude, left.latitude],
          [tip.longitude, tip.latitude],
          [right.longitude, right.latitude],
        ],
      },
    };
    return {
      line: { type: "FeatureCollection", features: [shaft, head] },
    };
  }, [point, info, zoom]);

  if (!markerData) return null;

  return (
    <>
      {arrowData ? (
        <Source id="point-info-arrow-line" type="geojson" data={arrowData.line}>
          <Layer
            id="point-info-arrow-line-layer"
            type="line"
            paint={{
              "line-color": "#dc2626",
              "line-width": 2.5,
              "line-opacity": 1,
            }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        </Source>
      ) : null}
      <Source id="point-info-marker" type="geojson" data={markerData}>
        <Layer
          id="point-info-marker-outline"
          type="circle"
          paint={{
            "circle-radius": 8,
            "circle-color": "#ffffff",
          }}
        />
        <Layer
          id="point-info-marker-fill"
          type="circle"
          paint={{
            "circle-radius": 5,
            "circle-color": "#dc2626",
          }}
        />
      </Source>
    </>
  );
}
