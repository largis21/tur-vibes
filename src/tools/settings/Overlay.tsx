import { useState, useEffect } from "react";
import { useActiveTool } from "../../lib/ActiveToolContext";
import { ModalShell } from "../../components/ui/ModalShell";

import { DataSection } from "./DataSection";
import { DeveloperSection } from "./DeveloperSection";
import { LogsSection } from "./LogsSection";
import { LogsView } from "./LogsView";

export function SettingsOverlay() {
  const { deactivateTool } = useActiveTool();
  const [storageEstimate, setStorageEstimate] = useState<{
    usage: number;
    quota: number;
  } | null>(null);
  const [selectedSection, setSelectedSection] = useState<
    "permissions" | "data" | "logs" | null
  >(null);

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
    if (selectedSection === "logs") return "Logs";
    return "Settings";
  };

  const getSubtitle = () => {
    if (selectedSection === "permissions")
      return "Grant access to device features.";
    if (selectedSection === "data") return "Manage your app data and storage.";
    if (selectedSection === "logs") return "App diagnostics and events.";
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
      {selectedSection === "logs" ? (
        <LogsView />
      ) : (
        <>
          <DataSection storageEstimate={storageEstimate} />
          <LogsSection onView={() => setSelectedSection("logs")} />
          <DeveloperSection />
        </>
      )}
    </ModalShell>
  );
}
