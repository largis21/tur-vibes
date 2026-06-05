import type { LatLng } from "../lib/types";

interface TerrainViewModalContentProps {
  point: LatLng;
}

export function TerrainViewModalContent({
  point,
}: TerrainViewModalContentProps) {
  const peakfinderUrl = new URL("https://www.peakfinder.com/embed/");
  peakfinderUrl.searchParams.set("lat", point.latitude.toString());
  peakfinderUrl.searchParams.set("lng", point.longitude.toString());

  return (
    <div className="h-[70vh] mt-2 -mx-6">
      <iframe
        src={peakfinderUrl.toString()}
        frameBorder="0"
        width="100%"
        height="100%"
        className="border-0 rounded-lg"
        title="PeakFinder Panorama"
      />
    </div>
  );
}
