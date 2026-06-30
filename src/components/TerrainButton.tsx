import { PiThreeD } from "react-icons/pi";
import { FabButton } from "./FabButton";
import { useUiState } from "../lib/UiState";

export function TerrainButton() {
  const { show3DTerrain, toggle3DTerrain } = useUiState();

  return (
    <FabButton
      aria-label={show3DTerrain ? "Disable 3D terrain" : "Enable 3D terrain"}
      active={show3DTerrain}
      onClick={toggle3DTerrain}
    >
      <PiThreeD size={24} style={{ display: "block", flexShrink: 0 }} />
    </FabButton>
  );
}
