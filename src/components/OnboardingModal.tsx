import { useEffect } from "react";
import { ModalShell } from "./ui/ModalShell";
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-1000">
      <div className="max-w-sm w-[90%]">
        <ModalShell
          title="Welcome to Tur Vibes"
          subtitle="We need a couple of permissions to show you on the map"
          scrollable
        >
          <div className="flex flex-col gap-6">
            <div className="text-gray-300 text-sm leading-relaxed">
              To get the most out of your hiking experience, we'd like access
              to:
            </div>

            <div className="flex flex-col gap-4">
              <PermissionsSection
                location={location}
                orientation={orientation}
                onLocationChange={handleLocationChange}
                onOrientationChange={handleOrientationChange}
              />
            </div>

            <div className="text-gray-400 text-xs leading-relaxed">
              You can change these permissions anytime in Settings. Skip for now
              and request them later if you prefer.
            </div>

            <button
              onClick={markCompleted}
              className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer w-full transition-colors duration-200"
            >
              Let's Get Started
            </button>
          </div>
        </ModalShell>
      </div>
    </div>
  );
}
