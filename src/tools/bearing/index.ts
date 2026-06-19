import { defineTool } from "../defineTool";
import { PiCompass } from "react-icons/pi";
import { BearingProvider } from "./context";
import { BearingMapChildren } from "./MapChildren";
import { BearingOverlay } from "./Overlay";

export const bearingTool = defineTool({
  id: "bearing",
  title: "Bearing",
  icon: PiCompass,
  Provider: BearingProvider,
  MapChildren: BearingMapChildren,
  Overlay: BearingOverlay,
  defaultUi: ["compass"],
});
