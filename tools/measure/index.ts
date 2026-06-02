import { defineTool } from "../defineTool";
import { MeasureProvider } from "./context";
import { MeasureMapChildren } from "./MapChildren";
import { MeasureOverlay } from "./Overlay";

export const measureTool = defineTool({
  id: "measure",
  title: "Measure distance",
  icon: "resize-outline",
  Provider: MeasureProvider,
  MapChildren: MeasureMapChildren,
  Overlay: MeasureOverlay,
});
