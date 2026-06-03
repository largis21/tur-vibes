import { defineTool } from "../defineTool";
import { SettingsOverlay } from "./Overlay";

export const settingsTool = defineTool({
  id: "settings",
  title: "Settings",
  icon: "cog",
  Overlay: SettingsOverlay,
  cursor: false,
});
