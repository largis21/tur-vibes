import { ToggleSwitch } from "../../components/ToggleSwitch";

interface PermissionsSectionProps {
  location: "unknown" | "granted" | "denied";
  orientation: "unknown" | "granted" | "denied";
  onLocationChange: (granted: boolean) => void;
  onOrientationChange: (granted: boolean) => void;
}

export function PermissionsSection({
  location,
  orientation,
  onLocationChange,
  onOrientationChange,
}: PermissionsSectionProps) {
  return (
    <>
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
            Location
          </div>
          <div
            style={{
              color: location === "denied" ? "#fca5a5" : "#9ca3af",
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {location === "denied"
              ? "Denied — re-enable in browser settings if the toggle won't grant."
              : "Show your position on the map."}
          </div>
        </div>
        <ToggleSwitch
          checked={location === "granted"}
          onChange={onLocationChange}
        />
      </div>

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
            Compass
          </div>
          <div
            style={{
              color: orientation === "denied" ? "#fca5a5" : "#9ca3af",
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {orientation === "denied"
              ? "Denied — re-enable in browser settings if the toggle won't grant."
              : "Rotate the map using device orientation sensors."}
          </div>
        </div>
        <ToggleSwitch
          checked={orientation === "granted"}
          onChange={onOrientationChange}
        />
      </div>
    </>
  );
}
