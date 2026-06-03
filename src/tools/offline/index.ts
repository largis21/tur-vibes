import { defineTool } from "../defineTool";
import { OfflineProvider } from "./context";
import { OfflineMapChildren } from "./MapChildren";
import { OfflineDownloadBadge, OfflineOverlay } from "./Overlay";

export const offlineTool = defineTool({
  id: "offline",
  title: "Offline maps",
  icon: "cloud-download",
  Provider: OfflineProvider,
  MapChildren: OfflineMapChildren,
  Overlay: OfflineOverlay,
  Badge: OfflineDownloadBadge,
});
