import type { ComponentType, ReactNode } from "react";

export type IconName =
  | "close"
  | "menu"
  | "add"
  | "backspace"
  | "locate"
  | "download"
  | "stop"
  | "trash"
  | "cloud-offline"
  | "trending-up"
  | "resize"
  | "cloud-download"
  | "shield"
  | "cog"
  | "compass";

/**
 * Pieces of the "default" UI a tool can opt-in to keep visible while it is
 * the active tool. Anything not listed here is hidden when the tool is active.
 */
export type DefaultUiKey =
  | "compass"
  | "coordsBox"
  | "steepnessButton"
  | "locateButton"
  | "menuButton";

export type ToolDefinition = {
  id: string;
  title: string;
  icon: IconName;
  Provider?: ComponentType<{ children: ReactNode }>;
  MapChildren?: ComponentType;
  Overlay?: ComponentType;
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
