import type { ComponentType, ReactNode } from "react";
import type { IconType } from "react-icons";

/**
 * Pieces of the "default" UI a tool can opt-in to keep visible while it is
 * the active tool. Anything not listed here is hidden when the tool is active.
 */
export type DefaultUiKey =
  | "compass"
  | "coordsBox"
  | "steepnessButton"
  | "baseLayerButton"
  | "locateButton"
  | "searchButton"
  | "menuButton";

export type ToolDefinition = {
  id: string;
  title: string;
  icon: IconType;
  Provider?: ComponentType<{ children: ReactNode }>;
  MapChildren?: ComponentType;
  Overlay?: ComponentType;
  /**
   * Optional badge rendered inside the tool's sidebar button. Useful for
   * surfacing background activity (e.g. a download-progress indicator) even
   * when the tool's overlay is not open.
   */
  Badge?: ComponentType;
  /** Whether the centre crosshair is visible while this tool is active. */
  cursor?: boolean;
  /**
   * Default UI items kept visible while this tool is active. Defaults to
   * an empty list (i.e. only the tool's own Overlay is rendered).
   */
  defaultUi?: DefaultUiKey[];
};

export function defineTool(tool: ToolDefinition): ToolDefinition {
  return tool;
}
