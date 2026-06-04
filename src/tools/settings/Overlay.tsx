import { useState, useEffect } from "react";
import { useMap } from "../../lib/MapContext";
import { PiX, PiArrowLeft, PiShieldCheck, PiHardDrive } from "react-icons/pi";
import { usePermissions } from "../../lib/permissions";
import { PermissionsSection } from "./PermissionsSection";
import { DataSection } from "./DataSection";
import { DeveloperSection } from "./DeveloperSection";
import {
  SettingsMenuButton,
  SettingsSectionHeader,
} from "./settingsComponents";

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
        maxHeight: "70vh",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {selectedSection && (
          <button
            onClick={() => setSelectedSection(null)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
            }}
          >
            <PiArrowLeft
              size={20}
              color="#fff"
              style={{ display: "block", flexShrink: 0 }}
            />
          </button>
        )}
        <div style={{ flex: 1 }}>
          {selectedSection === "permissions" ? (
            <SettingsSectionHeader
              icon={PiShieldCheck}
              title="Permissions"
              description="Grant access to device features."
            />
          ) : selectedSection === "data" ? (
            <SettingsSectionHeader
              icon={PiHardDrive}
              title="Data"
              description="Manage your app data and storage."
            />
          ) : (
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>
              Settings
            </div>
          )}
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
            border: "none",
            cursor: "pointer",
          }}
        >
          <PiX
            size={20}
            color="#fff"
            style={{ display: "block", flexShrink: 0 }}
          />
        </button>
      </div>

      {/* Content */}
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
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

            <div style={{ marginTop: 8 }}>
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
      </div>
    </div>
  );
}
