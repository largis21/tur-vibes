import { Compass } from "./Compass";
import { CoordsBox } from "./CoordsBox";
import { FabButton } from "./FabButton";
import { LocateButton } from "./LocateButton";
import { MenuButton } from "./MenuButton";
import { SteepnessButton } from "./SteepnessButton";
import { PiFunnel } from "react-icons/pi";
import { usePointInfo } from "../lib/PointInfoContext";
import { usePoi } from "../tools/poi/context";
import type { DefaultUiKey } from "../tools/defineTool";

/**
 * Composes the "default UI" overlays. A tool decides which of these are
 * visible while it is active by listing them in its `defaultUi` array.
 *
 * The right-side FAB stack collapses naturally — if no buttons are enabled
 * the stack itself is omitted.
 */
export function DefaultUi({
  keys,
  bannerVisible = false,
  compassTopOffset,
  onOpenPoiTool,
}: {
  keys: readonly DefaultUiKey[];
  /** When true, the offline banner is occupying the top of the screen. */
  bannerVisible?: boolean;
  /** Optional override for the compass top offset (e.g. tool with a header). */
  compassTopOffset?: number;
  onOpenPoiTool?: () => void;
}) {
  const has = (key: DefaultUiKey) =>
    (keys as readonly DefaultUiKey[]).includes(key);
  const { point: pointInfoPoint } = usePointInfo();
  const { selectedPoiId, poiFilter, setFilterPanelOpen } = usePoi();
  const hasActivePoiFilter =
    onOpenPoiTool != null &&
    (poiFilter.types.length > 0 || poiFilter.colors.length > 0);
  // While the point-info sheet or a POI card is open, hide other UI but keep the compass.
  const hideNonCompass = pointInfoPoint != null || selectedPoiId != null;

  const fabButtons = (
    [
      ["steepnessButton", <SteepnessButton key="steepness" />],
      ["locateButton", <LocateButton key="locate" />],
      ["menuButton", <MenuButton key="menu" />],
    ] as const
  )
    .filter(([key]) => has(key))
    .map(([, node]) => node);

  return (
    <>
      {has("compass") ? (
        <Compass topOffset={compassTopOffset ?? (bannerVisible ? 72 : 16)} />
      ) : null}
      {has("coordsBox") && !hideNonCompass ? <CoordsBox /> : null}
      {(fabButtons.length > 0 || hasActivePoiFilter) && !hideNonCompass ? (
        <div className="absolute right-5 bottom-10 flex flex-col gap-3 z-30">
          {hasActivePoiFilter && (
            <FabButton
              aria-label="Active POI filters — tap to manage"
              onClick={() => {
                setFilterPanelOpen(true);
                onOpenPoiTool?.();
              }}
              active
            >
              <PiFunnel size={20} className="flex-shrink-0" />
            </FabButton>
          )}
          {fabButtons}
        </div>
      ) : null}
    </>
  );
}
