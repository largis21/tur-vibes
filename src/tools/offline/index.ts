import { defineTool } from "../defineTool";
import { PiCloudArrowDown } from "react-icons/pi";
import { OfflineProvider } from "./context";
import { OfflineMapChildren } from "./MapChildren";
import { OfflineDownloadBadge, OfflineOverlay } from "./Overlay";

export const offlineTool = defineTool({
  id: "offline",
  title: "Offline maps",
  icon: PiCloudArrowDown,
  Provider: OfflineProvider,
  MapChildren: OfflineMapChildren,
  Overlay: OfflineOverlay,
  Badge: OfflineDownloadBadge,
});
