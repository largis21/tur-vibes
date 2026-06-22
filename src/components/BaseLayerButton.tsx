import { PiGlobe, PiMapTrifold } from "react-icons/pi";
import { FabButton } from "./FabButton";
import { useUiState } from "../lib/UiState";

export function BaseLayerButton() {
  const { baseLayer, toggleBaseLayer } = useUiState();
  const isSatellite = baseLayer === "satellite";

  return (
    <FabButton
      aria-label={
        isSatellite ? "Switch to topographic map" : "Switch to satellite imagery"
      }
      active={isSatellite}
      onClick={toggleBaseLayer}
    >
      {isSatellite ? (
        <PiGlobe size={24} style={{ display: "block", flexShrink: 0 }} />
      ) : (
        <PiMapTrifold size={24} style={{ display: "block", flexShrink: 0 }} />
      )}
    </FabButton>
  );
}
