import type { IconType } from "react-icons";
import {
  PiX,
  PiList,
  PiPlus,
  PiBackspace,
  PiCrosshair,
  PiDownloadSimple,
  PiStop,
  PiTrash,
  PiCloudSlash,
  PiTrendUp,
  PiArrowsOut,
  PiCloudArrowDown,
  PiShieldCheck,
  PiGear,
  PiCompass,
  PiMagnifyingGlass,
  PiMapPin,
  PiFunnel,
  PiSortAscending,
} from "react-icons/pi";
import type { IconName } from "../tools/defineTool";

const ICONS: Record<IconName, IconType> = {
  close: PiX,
  menu: PiList,
  add: PiPlus,
  backspace: PiBackspace,
  locate: PiCrosshair,
  download: PiDownloadSimple,
  stop: PiStop,
  trash: PiTrash,
  "cloud-offline": PiCloudSlash,
  "trending-up": PiTrendUp,
  resize: PiArrowsOut,
  "cloud-download": PiCloudArrowDown,
  shield: PiShieldCheck,
  cog: PiGear,
  compass: PiCompass,
  search: PiMagnifyingGlass,
  location: PiMapPin,
  filter: PiFunnel,
  sort: PiSortAscending,
};

export function Icon({
  name,
  size = 20,
  color = "currentColor",
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const Component = ICONS[name];
  if (!Component) {
    if (import.meta.env.DEV) console.warn(`Icon: unknown name "${name}"`);
    return null;
  }
  return (
    <Component
      size={size}
      color={color}
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}
