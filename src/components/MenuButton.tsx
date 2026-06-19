import { PiList } from "react-icons/pi";
import { FabButton } from "./FabButton";
import { useUiState } from "../lib/UiState";

export function MenuButton() {
  const { openSidebar } = useUiState();
  return (
    <FabButton
      aria-label="Open tools"
      onClick={openSidebar}
      data-testid="menu-button"
    >
      <PiList size={26} style={{ display: "block", flexShrink: 0 }} />
    </FabButton>
  );
}
