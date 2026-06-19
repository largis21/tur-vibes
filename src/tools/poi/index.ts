import { defineTool } from "../defineTool";
import { PiMapPin } from "react-icons/pi";
import { PoiProvider } from "./context";
import { PoiOverlay } from "./Overlay";

export const poiTool = defineTool({
  id: "poi",
  title: "POIs",
  icon: PiMapPin,
  Provider: PoiProvider,
  Overlay: PoiOverlay,
  cursor: true,
});
