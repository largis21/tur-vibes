import { PiMapTrifold } from "react-icons/pi";
import { defineTool } from "./defineTool";

/**
 * Pseudo-tool that represents "no tool active". It only exists to centralize
 * the list of default UI items shown on the bare map. It is NOT included in
 * the sidebar tool list.
 */
export const defaultTool = defineTool({
  id: "default",
  title: "Map",
  icon: PiMapTrifold,
  defaultUi: [
    "compass",
    "coordsBox",
    "menuButton",
    "steepnessButton",
    "baseLayerButton",
    "terrainButton",
    "locateButton",
    "searchButton",
  ],
});
