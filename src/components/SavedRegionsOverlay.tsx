import type { FeatureCollection, LineString } from "geojson";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { boundsIntersect, type OfflineRegionBounds } from "../lib/offlineTiles";
import type { SavedOfflineRegion } from "../lib/savedRegions";

type FeatureProps = { color: string; width: number };

export function SavedRegionsOverlay({
  regions,
  selectionBounds,
}: {
  regions: SavedOfflineRegion[];
  selectionBounds?: OfflineRegionBounds | null;
}) {
  const fc = useMemo<FeatureCollection<LineString, FeatureProps>>(() => {
    return {
      type: "FeatureCollection",
      features: regions.map((region) => {
        const { minLat, maxLat, minLon, maxLon } = region.bounds;
        const highlighted =
          !!selectionBounds && boundsIntersect(region.bounds, selectionBounds);
        return {
          type: "Feature",
          id: region.id,
          properties: {
            color: highlighted ? "#eab308" : "#22c55e",
            width: highlighted ? 2 : 1,
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [minLon, maxLat],
              [maxLon, maxLat],
              [maxLon, minLat],
              [minLon, minLat],
              [minLon, maxLat],
            ],
          },
        };
      }),
    };
  }, [regions, selectionBounds]);

  if (regions.length === 0) return null;

  return (
    <Source id="saved-regions-src" type="geojson" data={fc}>
      <Layer
        id="saved-regions-line"
        type="line"
        paint={{
          "line-color": ["get", "color"],
          "line-width": ["get", "width"],
          "line-dasharray": [4, 4],
        }}
      />
    </Source>
  );
}
