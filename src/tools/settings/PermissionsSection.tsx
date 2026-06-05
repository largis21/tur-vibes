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
      <div className="flex items-center gap-3 justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-bold">Location</div>
          <div
            className={`text-xs mt-0.5 ${
              location === "denied" ? "text-red-300" : "text-gray-400"
            }`}
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

      <div className="flex items-center gap-3 justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-bold">Compass</div>
          <div
            className={`text-xs mt-0.5 ${
              orientation === "denied" ? "text-red-300" : "text-gray-400"
            }`}
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
