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
    <div
      style={{
        height: "70vh",
        marginTop: "8px",
        marginLeft: "-24px",
        marginRight: "-24px",
      }}
    >
      <iframe
        src={peakfinderUrl.toString()}
        frameBorder="0"
        width="100%"
        height="100%"
        style={{ border: "none", borderRadius: "8px" }}
        title="PeakFinder Panorama"
      />
    </div>
  );
}
