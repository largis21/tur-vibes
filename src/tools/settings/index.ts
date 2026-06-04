import { defineTool } from "../defineTool";
import { PiGear } from "react-icons/pi";
import { SettingsOverlay } from "./Overlay";

export const settingsTool = defineTool({
  id: "settings",
  title: "Settings",
  icon: PiGear,
  Overlay: SettingsOverlay,
  cursor: false,
});
