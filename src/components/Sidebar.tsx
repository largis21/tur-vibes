import type { ToolDefinition } from "../tools/defineTool";
import { Icon } from "./Icon";
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
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.2)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.18s ease",
          zIndex: 50,
        }}
      />
      <aside
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 280,
          background: "#fff",
          color: "#111827",
          boxShadow: "-3px 0 12px rgba(0,0,0,0.18)",
          padding: "32px 20px 20px",
          transform: `translateX(${isOpen ? 0 : 280}px)`,
          transition: "transform 0.22s ease",
          zIndex: 51,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Tools</h2>
          <button
            aria-label="Close tools"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={22} />
          </button>
        </div>
        <LocationSearch onSelectResult={onClose} />
        {tools.map((tool) => {
          const isActive = tool.id === activeToolId;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                background: isActive ? "#f97316" : "#f3f4f6",
                color: isActive ? "#fff" : "#111827",
                borderRadius: 14,
                padding: "14px 16px",
                marginBottom: 12,
                fontSize: 16,
                fontWeight: 700,
                textAlign: "left",
              }}
            >
              <Icon name={tool.icon} size={20} />
              <span style={{ flex: 1 }}>{tool.title}</span>
              {tool.Badge ? <tool.Badge /> : null}
            </button>
          );
        })}
      </aside>
    </>
  );
}
