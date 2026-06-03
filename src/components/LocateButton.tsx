import { Icon } from "./Icon";
import { FabButton } from "./FabButton";
import { useMap } from "../lib/MapContext";
import { usePermissions } from "../lib/permissions";

export function LocateButton() {
  const { mapRef } = useMap();
  const { location } = usePermissions();

  function handleClick() {
    if (location !== "granted") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          duration: 500,
        });
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }

  return (
    <FabButton aria-label="Center on my location" onClick={handleClick}>
      <Icon name="locate" size={24} />
    </FabButton>
  );
}
