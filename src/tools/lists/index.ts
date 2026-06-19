import { defineTool } from "../defineTool";
import { PiList } from "react-icons/pi";
import { ListsProvider } from "./context";
import { ListsOverlay } from "./Overlay";

export const listsTool = defineTool({
  id: "lists",
  title: "Lists",
  icon: PiList,
  Provider: ListsProvider,
  Overlay: ListsOverlay,
  cursor: false,
});
