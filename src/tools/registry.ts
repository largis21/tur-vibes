import { defaultTool } from "./default";
import type { ToolDefinition } from "./defineTool";
import { measureTool } from "./measure";
import { offlineTool } from "./offline";
import { poiTool } from "./poi";
import { settingsTool } from "./settings";
import { listsTool } from "./lists";

/** Tools shown in the sidebar. The default tool is intentionally omitted. */
export const tools: ToolDefinition[] = [
  measureTool,
  poiTool,
  offlineTool,
  listsTool,
  settingsTool,
];

export function getToolById(id: string | null): ToolDefinition | null {
  if (!id) return null;
  return tools.find((tool) => tool.id === id) ?? null;
}

/**
 * Returns the active tool, or the default tool when nothing is selected. This
 * is what callers should use when they need a `defaultUi` list.
 */
export function getActiveTool(id: string | null): ToolDefinition {
  return getToolById(id) ?? defaultTool;
}

export { defaultTool };
