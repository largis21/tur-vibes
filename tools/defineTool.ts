import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ComponentType, ReactNode } from "react";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type ToolDefinition = {
  id: string;
  title: string;
  icon: IoniconName;
  /**
   * Optional wrapper rendered around the whole app while the tool is active.
   * Use this to provide tool-local React context shared between `MapChildren`
   * and `Overlay`.
   */
  Provider?: ComponentType<{ children: ReactNode }>;
  /**
   * Rendered as a child of the underlying `MapView` while the tool is active.
   * Use for `Polyline`, `Marker`, etc.
   */
  MapChildren?: ComponentType;
  /**
   * Rendered as a screen-space overlay above the map while the tool is active.
   */
  Overlay?: ComponentType;
  /**
   * Whether the center crosshair is visible while this tool is active.
   * Defaults to true.
   */
  cursor?: boolean;
};

export function defineTool(tool: ToolDefinition): ToolDefinition {
  return tool;
}
