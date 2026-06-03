import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { destinationPoint } from "../../lib/geoBearing";
import { useNavigation } from "./context";

/** Long enough to span the visible map at any reasonable zoom. */
const PROJECTION_DISTANCE_METERS = 500_000;

export function NavigationMapChildren() {
  const { bearings, selectedBearingId, tracking, deviceHeading, userPosition } =
    useNavigation();

  const lines = useMemo<FeatureCollection<LineString>>(() => {
    const features: Feature<LineString>[] = bearings.map((b) => {
      const end = destinationPoint(
        b.point,
        PROJECTION_DISTANCE_METERS,
        b.heading,
      );
      return {
        type: "Feature",
        properties: { id: b.id, selected: b.id === selectedBearingId },
        geometry: {
          type: "LineString",
          coordinates: [
            [b.point.longitude, b.point.latitude],
            [end.longitude, end.latitude],
          ],
        },
      };
    });
    return { type: "FeatureCollection", features };
  }, [bearings, selectedBearingId]);

  const points = useMemo<FeatureCollection<Point>>(() => {
    const features: Feature<Point>[] = bearings.map((b) => ({
      type: "Feature",
      properties: { id: b.id, selected: b.id === selectedBearingId },
      geometry: {
        type: "Point",
        coordinates: [b.point.longitude, b.point.latitude],
      },
    }));
    return { type: "FeatureCollection", features };
  }, [bearings, selectedBearingId]);

  const trackingLine = useMemo<Feature<LineString> | null>(() => {
    if (!tracking || deviceHeading === null || !userPosition) return null;
    const end = destinationPoint(
      userPosition,
      PROJECTION_DISTANCE_METERS,
      deviceHeading,
    );
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [userPosition.longitude, userPosition.latitude],
          [end.longitude, end.latitude],
        ],
      },
    };
  }, [tracking, deviceHeading, userPosition]);

  if (bearings.length === 0 && !trackingLine) return null;

  return (
    <>
      {trackingLine && (
        <Source
          id="nav-tracking-line"
          type="geojson"
          data={trackingLine}
        >
          <Layer
            id="nav-tracking-line-layer"
            type="line"
            paint={{
              "line-color": "#3b82f6",
              "line-width": 3,
              "line-opacity": 0.85,
              "line-dasharray": [2, 3],
            }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        </Source>
      )}
      <Source id="nav-bearing-lines" type="geojson" data={lines}>
        <Layer
          id="nav-bearing-lines-layer"
          type="line"
          paint={{
            "line-color": ["case", ["get", "selected"], "#f97316", "#fb923c"],
            "line-width": ["case", ["get", "selected"], 3, 2],
            "line-opacity": 0.9,
          }}
          layout={{ "line-cap": "round", "line-join": "round" }}
        />
      </Source>
      <Source id="nav-bearing-points" type="geojson" data={points}>
        <Layer
          id="nav-bearing-points-outline"
          type="circle"
          paint={{
            "circle-radius": 7,
            "circle-color": "#ffffff",
          }}
        />
        <Layer
          id="nav-bearing-points-fill"
          type="circle"
          paint={{
            "circle-radius": 4,
            "circle-color": ["case", ["get", "selected"], "#dc2626", "#f97316"],
          }}
        />
      </Source>
    </>
  );
}
