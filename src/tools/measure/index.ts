import { defineTool } from "../defineTool";
import { PiRuler } from "react-icons/pi";
import { MeasureProvider } from "./context";
import { MeasureMapChildren } from "./MapChildren";
import { MeasureOverlay } from "./Overlay";

export const measureTool = defineTool({
  id: "measure",
  title: "Measure distance",
  icon: PiRuler,
  Provider: MeasureProvider,
  MapChildren: MeasureMapChildren,
  Overlay: MeasureOverlay,
});
