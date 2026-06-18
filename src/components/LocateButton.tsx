import { PiCrosshair } from "react-icons/pi";
import { FabButton } from "./FabButton";
import { useMap } from "../lib/MapContext";
import { useGeoLocation } from "../state/geoLocation/useGeoLocation";

export function LocateButton() {
  const { mapRef } = useMap();
  const getUserPosition = useGeoLocation((state) => state.getUserPosition);

  async function handleClick() {
    const userPosition = await getUserPosition().catch((err) => {
      console.error("Cannot fly to user location", err);
    });

    if (!userPosition) return;

    mapRef.current?.flyTo({
      center: [userPosition.longitude, userPosition.latitude],
      duration: 500,
    });
  }

  return (
    <FabButton aria-label="Center on my location" onClick={handleClick}>
      <PiCrosshair size={24} style={{ display: "block", flexShrink: 0 }} />
    </FabButton>
  );
}
