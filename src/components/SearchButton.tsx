import { PiMagnifyingGlass } from "react-icons/pi";
import { FabButton } from "./FabButton";
import { useUiState } from "../lib/UiState";

export function SearchButton() {
  const { openSidebar } = useUiState();

  function handleClick() {
    openSidebar();
    document
      .getElementById("location-search-input")
      ?.focus({ preventScroll: true });
  }

  return (
    <FabButton
      aria-label="Search location"
      onClick={handleClick}
      data-testid="search-button"
    >
      <PiMagnifyingGlass
        size={26}
        style={{ display: "block", flexShrink: 0 }}
      />
    </FabButton>
  );
}
