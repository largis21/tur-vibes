import { defineTool } from "../defineTool";
import { NavigationProvider } from "./context";
import { NavigationMapChildren } from "./MapChildren";
import { NavigationOverlay } from "./Overlay";

export const navigationTool = defineTool({
  id: "navigation",
  title: "Navigation",
  icon: "compass",
  Provider: NavigationProvider,
  MapChildren: NavigationMapChildren,
  Overlay: NavigationOverlay,
  defaultUi: ["compass"],
});
