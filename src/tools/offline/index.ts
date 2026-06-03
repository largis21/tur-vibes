import { defineTool } from "../defineTool";
import { OfflineProvider } from "./context";
import { OfflineOverlay } from "./Overlay";

export const offlineTool = defineTool({
  id: "offline",
  title: "Offline maps",
  icon: "cloud-download",
  Provider: OfflineProvider,
  Overlay: OfflineOverlay,
  cursor: false,
});
