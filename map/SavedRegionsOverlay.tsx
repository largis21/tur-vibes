import { Polyline } from "react-native-maps";
import { boundsIntersect, type OfflineRegionBounds } from "./offlineTiles";
import type { SavedOfflineRegion } from "./savedRegions";

export function SavedRegionsOverlay({
  regions,
  selectionBounds,
}: {
  regions: SavedOfflineRegion[];
  selectionBounds?: OfflineRegionBounds | null;
}) {
  return (
    <>
      {regions.map((region) => {
        const { minLat, maxLat, minLon, maxLon } = region.bounds;
        const coords = [
          { latitude: maxLat, longitude: minLon },
          { latitude: maxLat, longitude: maxLon },
          { latitude: minLat, longitude: maxLon },
          { latitude: minLat, longitude: minLon },
          { latitude: maxLat, longitude: minLon },
        ];
        const highlighted =
          !!selectionBounds && boundsIntersect(region.bounds, selectionBounds);
        return (
          <Polyline
            key={region.id}
            coordinates={coords}
            lineDashPattern={[4, 4]}
            strokeColor={highlighted ? "#eab308" : "#22c55e"}
            strokeWidth={highlighted ? 2 : 1}
            zIndex={3}
          />
        );
      })}
    </>
  );
}
