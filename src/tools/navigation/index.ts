import { defineTool } from "../defineTool";
import { PiCompass } from "react-icons/pi";
import { NavigationProvider } from "./context";
import { NavigationMapChildren } from "./MapChildren";
import { NavigationOverlay } from "./Overlay";

export const navigationTool = defineTool({
  id: "navigation",
  title: "Navigation",
  icon: PiCompass,
  Provider: NavigationProvider,
  MapChildren: NavigationMapChildren,
  Overlay: NavigationOverlay,
  defaultUi: ["compass"],
});
