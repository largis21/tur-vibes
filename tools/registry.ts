import type { ToolDefinition } from "./defineTool";
import { measureTool } from "./measure";
import { offlineTool } from "./offline";

export const tools: ToolDefinition[] = [measureTool, offlineTool];

export function getToolById(id: string | null): ToolDefinition | null {
  if (!id) return null;
  return tools.find((tool) => tool.id === id) ?? null;
}
