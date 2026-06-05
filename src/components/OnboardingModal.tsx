import { useEffect } from "react";
import { ModalShell } from "./ModalShell";
import { PermissionsSection } from "../tools/settings/PermissionsSection";
import { useOnboarding } from "../lib/OnboardingContext";
import { usePermissions } from "../lib/permissions";
import { useMap } from "../lib/MapContext";

// Debug flag: add ?debug-onboarding=true to the URL to show the modal every time
const DEBUG_ONBOARDING =
  new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  ).get("debug-onboarding") === "true";

export function OnboardingModal() {
  const { isCompleted, markCompleted } = useOnboarding();
  const { location, orientation, setLocation, setOrientation } =
    usePermissions();
  const { mapRef, userPosition } = useMap();

  // Auto-complete onboarding once both permissions are requested
  useEffect(() => {
    if (!isCompleted && location !== "unknown" && orientation !== "unknown") {
      // If location is granted and we have user position, fly to it
      if (location === "granted" && userPosition && mapRef.current) {
        mapRef.current.flyTo({
          center: [userPosition.longitude, userPosition.latitude],
          zoom: 15,
          duration: 1500,
        });
      }
      markCompleted();
    }
  }, [isCompleted, location, orientation, userPosition, mapRef, markCompleted]);

  if (isCompleted && !DEBUG_ONBOARDING) {
    return null;
  }

  const handleLocationChange = async (granted: boolean) => {
    await setLocation(granted);
  };

  const handleOrientationChange = async (granted: boolean) => {
    await setOrientation(granted);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ maxWidth: 400, width: "90%" }}>
        <ModalShell
          title="Welcome to Tur Vibes"
          subtitle="We need a couple of permissions to show you on the map"
          scrollable
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                color: "#d1d5db",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              To get the most out of your hiking experience, we'd like access
              to:
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <PermissionsSection
                location={location}
                orientation={orientation}
                onLocationChange={handleLocationChange}
                onOrientationChange={handleOrientationChange}
              />
            </div>

            <div
              style={{
                color: "#9ca3af",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              You can change these permissions anytime in Settings. Skip for now
              and request them later if you prefer.
            </div>

            <button
              onClick={markCompleted}
              style={{
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2563eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#3b82f6";
              }}
            >
              Let's Get Started
            </button>
          </div>
        </ModalShell>
      </div>
    </div>
  );
}
