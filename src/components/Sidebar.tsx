import type { ToolDefinition } from "../tools/defineTool";
import { PiX } from "react-icons/pi";
import { LocationSearch } from "./LocationSearch";

type SidebarProps = {
  isOpen: boolean;
  tools: ToolDefinition[];
  activeToolId: string | null;
  onSelectTool: (id: string) => void;
  onClose: () => void;
};

export function Sidebar({
  isOpen,
  tools,
  activeToolId,
  onSelectTool,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-dark-900/20 transition-opacity duration-300 z-backdrop ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`absolute top-0 right-0 bottom-0 w-70 bg-white text-dark-900 shadow-2xl transition-transform duration-300 z-sidebar overflow-hidden flex flex-col pt-8 px-5 pb-5 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black m-0">Tools</h2>
          <button
            aria-label="Close tools"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center"
          >
            <PiX size={22} />
          </button>
        </div>

        {/* Location Search */}
        <LocationSearch onSelectResult={onClose} />

        {/* Tools List */}
        {tools.map((tool) => {
          const isActive = tool.id === activeToolId;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`flex items-center gap-3 w-full rounded-secondary px-4 py-3.5 mb-3 text-left text-base font-bold transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "bg-gray-100 text-dark-900 hover:bg-gray-200"
              }`}
            >
              <tool.icon size={20} />
              <span className="flex-1">{tool.title}</span>
              {tool.Badge ? <tool.Badge /> : null}
            </button>
          );
        })}
      </aside>
    </>
  );
}
