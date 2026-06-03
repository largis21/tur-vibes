import { defineTool } from "../defineTool";
import { PermissionsOverlay } from "./Overlay";

export const permissionsTool = defineTool({
  id: "permissions",
  title: "Permissions",
  icon: "shield",
  Overlay: PermissionsOverlay,
  cursor: false,
});
