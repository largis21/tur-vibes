import { useMap } from "../../lib/MapContext";
import { Icon } from "../../components/Icon";
import { ToggleSwitch } from "../../components/ToggleSwitch";
import { usePermissions } from "../../lib/permissions";

export function SettingsOverlay() {
  const { deactivateTool } = useMap();
  const { location, orientation, setLocation, setOrientation } =
    usePermissions();

  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 36,
        background: "rgba(17, 24, 39, 0.94)",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>
            Settings
          </div>
        </div>
        <button
          onClick={deactivateTool}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="close" size={20} color="#fff" />
        </button>
      </div>

      <SectionHeader
        icon="shield"
        title="Permissions"
        description="Grant access to device features."
      />

      <PermissionRow
        title="Location"
        description="Show your position on the map."
        status={location}
        onChange={(v) => {
          void setLocation(v);
        }}
      />
      <PermissionRow
        title="Compass"
        description="Rotate the map using device orientation sensors."
        status={orientation}
        onChange={(v) => {
          void setOrientation(v);
        }}
      />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon?: import("../defineTool").IconName;
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
        {icon ? <Icon name={icon} size={14} /> : null}
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

function PermissionRow({
  title,
  description,
  status,
  onChange,
}: {
  title: string;
  description: string;
  status: "unknown" | "granted" | "denied";
  onChange: (granted: boolean) => void;
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
      <ToggleSwitch checked={status === "granted"} onChange={onChange} />
    </div>
  );
}
