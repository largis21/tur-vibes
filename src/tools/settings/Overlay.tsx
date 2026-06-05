import { useState, useEffect } from "react";
import { useMap } from "../../lib/MapContext";
import { PiShieldCheck, PiHardDrive } from "react-icons/pi";
import { ModalShell } from "../../components/ui/ModalShell";
import { usePermissions } from "../../lib/permissions";
import { PermissionsSection } from "./PermissionsSection";
import { DataSection } from "./DataSection";
import { DeveloperSection } from "./DeveloperSection";
import { SettingsMenuButton } from "./settingsComponents";

export function SettingsOverlay() {
  const { deactivateTool } = useMap();
  const {
    location,
    orientation,
    setLocation,
    setOrientation,
    refreshPermissions,
  } = usePermissions();
  const [storageEstimate, setStorageEstimate] = useState<{
    usage: number;
    quota: number;
  } | null>(null);
  const [selectedSection, setSelectedSection] = useState<
    "permissions" | "data" | null
  >(null);

  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    async function getStorageEstimate() {
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          setStorageEstimate({
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
          });
        } catch (err) {
          console.error("Failed to get storage estimate:", err);
        }
      }
    }
    void getStorageEstimate();
  }, []);

  const getTitle = () => {
    if (selectedSection === "permissions") return "Permissions";
    if (selectedSection === "data") return "Data";
    return "Settings";
  };

  const getSubtitle = () => {
    if (selectedSection === "permissions")
      return "Grant access to device features.";
    if (selectedSection === "data") return "Manage your app data and storage.";
    return undefined;
  };

  return (
    <ModalShell
      title={getTitle()}
      subtitle={getSubtitle()}
      onClose={deactivateTool}
      onBack={selectedSection ? () => setSelectedSection(null) : undefined}
      scrollable
      zIndex={20}
    >
      {!selectedSection ? (
        // Menu View
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SettingsMenuButton
            icon={PiShieldCheck}
            label="Permissions"
            onClick={() => setSelectedSection("permissions")}
          />

          <SettingsMenuButton
            icon={PiHardDrive}
            label="Data"
            onClick={() => setSelectedSection("data")}
          />

          <div style={{ marginTop: 12 }}>
            <DeveloperSection />
          </div>
        </div>
      ) : selectedSection === "permissions" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <PermissionsSection
            location={location}
            orientation={orientation}
            onLocationChange={(v) => void setLocation(v)}
            onOrientationChange={(v) => void setOrientation(v)}
          />
        </div>
      ) : selectedSection === "data" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <DataSection storageEstimate={storageEstimate} />
        </div>
      ) : null}
    </ModalShell>
  );
}
