import { Compass } from "./Compass";
import { CoordsBox } from "./CoordsBox";
import { LocateButton } from "./LocateButton";
import { MenuButton } from "./MenuButton";
import { SteepnessButton } from "./SteepnessButton";
import { usePointInfo } from "../lib/PointInfoContext";
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
}: {
  keys: readonly DefaultUiKey[];
  /** When true, the offline banner is occupying the top of the screen. */
  bannerVisible?: boolean;
  /** Optional override for the compass top offset (e.g. tool with a header). */
  compassTopOffset?: number;
}) {
  const has = (key: DefaultUiKey) => keys.includes(key);
  const { point: pointInfoPoint } = usePointInfo();
  // While the point-info sheet is open, hide other UI but keep the compass.
  const hideNonCompass = pointInfoPoint != null;

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
      {fabButtons.length > 0 && !hideNonCompass ? (
        <div
          style={{
            position: "absolute",
            right: 20,
            bottom: 40,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            zIndex: 30,
          }}
        >
          {fabButtons}
        </div>
      ) : null}
    </>
  );
}
