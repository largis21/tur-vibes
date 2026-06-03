import { Icon } from "./Icon";
import { FabButton } from "./FabButton";
import { useUiState } from "../lib/UiState";

export function MenuButton() {
  const { toggleSidebar } = useUiState();
  return (
    <FabButton aria-label="Open tools" onClick={toggleSidebar}>
      <Icon name="menu" size={26} />
    </FabButton>
  );
}
