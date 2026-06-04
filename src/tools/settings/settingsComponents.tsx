import type { IconType } from "react-icons";
import { PiCaretRight } from "react-icons/pi";

export function SectionHeader({
  icon,
  title,
  description,
}: {
  icon?: IconType;
  title: string;
  description?: string;
}) {
  return (
    <div style={{ marginTop: 4 }}>
      <div
        style={{
          color: "#9ca3af",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon
          ? (() => {
              const I = icon;
              return (
                <I size={14} style={{ display: "block", flexShrink: 0 }} />
              );
            })()
          : null}
        {title}
      </div>
      {description ? (
        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}

export function PermissionRow({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: "unknown" | "granted" | "denied";
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: "space-between",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
          {title}
        </div>
        <div
          style={{
            color: status === "denied" ? "#fca5a5" : "#9ca3af",
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {status === "denied"
            ? "Denied — re-enable in browser settings if the toggle won't grant."
            : description}
        </div>
      </div>
    </div>
  );
}

export function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: "space-between",
      }}
    >
      <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
        {label}
      </div>
      <div
        style={{
          color: "#9ca3af",
          fontSize: 12,
          fontFamily: "monospace",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export interface SettingsMenuButtonProps {
  icon: IconType;
  label: string;
  onClick: () => void;
}

export function SettingsMenuButton({
  icon: Icon,
  label,
  onClick,
}: SettingsMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        color: "#fff",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        width: "100%",
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.12)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
      }}
    >
      <Icon size={20} color="#93c5fd" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      <PiCaretRight
        size={18}
        color="rgba(255,255,255,0.5)"
        style={{ flexShrink: 0 }}
      />
    </button>
  );
}

export interface SettingsSectionHeaderProps {
  icon: IconType;
  title: string;
  description: string;
}

export function SettingsSectionHeader({
  icon: Icon,
  title,
  description,
}: SettingsSectionHeaderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <Icon size={16} color="#fff" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>
          {title}
        </div>
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
        }}
      >
        {description}
      </div>
    </div>
  );
}
