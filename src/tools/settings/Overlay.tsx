import { useState, useEffect } from "react";
import { useMap } from "../../lib/MapContext";
import { PiX, PiShieldCheck, PiTrash, PiCode } from "react-icons/pi";
import type { IconType } from "react-icons";
import { ToggleSwitch } from "../../components/ToggleSwitch";
import { usePermissions } from "../../lib/permissions";
import { deleteOfflineDatabase } from "../../lib/offlineTiles";

declare global {
  const __BUILD_INFO__: {
    gitRef: string;
    gitBranch: string;
    buildDate: string;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

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
  const [deleteState, setDeleteState] = useState<
    "idle" | "confirm" | "deleting" | "done"
  >("idle");

  async function handleDeleteAll() {
    if (deleteState === "idle") {
      setDeleteState("confirm");
      return;
    }
    if (deleteState === "confirm") {
      setDeleteState("deleting");
      try {
        // Delete the entire IndexedDB database.
        await deleteOfflineDatabase();
        // Wipe all Cache Storage (service worker caches).
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        // Wipe all localStorage for this origin.
        localStorage.clear();
      } finally {
        setDeleteState("done");
      }
    }
  }

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
          <PiX
            size={20}
            color="#fff"
            style={{ display: "block", flexShrink: 0 }}
          />
        </button>
      </div>

      <SectionHeader
        icon={PiShieldCheck}
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

      <SectionHeader
        icon={PiTrash}
        title="Data"
        description="Permanently remove all app data from this device."
      />

      {storageEstimate && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "12px 14px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: 12,
          }}
        >
          <div>
            <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 2 }}>
              Used Storage
            </div>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
              {formatBytes(storageEstimate.usage)} /{" "}
              {formatBytes(storageEstimate.quota)}
            </div>
          </div>
          <div
            style={{
              height: 6,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "#10b981",
                width: `${Math.min((storageEstimate.usage / storageEstimate.quota) * 100, 100)}%`,
                transition: "width 0.2s",
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={() => void handleDeleteAll()}
        disabled={deleteState === "deleting" || deleteState === "done"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "12px 14px",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          color: "#fff",
          background:
            deleteState === "confirm"
              ? "#dc2626"
              : deleteState === "done"
                ? "rgba(255,255,255,0.08)"
                : "rgba(220, 38, 38, 0.2)",
          border:
            deleteState === "confirm"
              ? "none"
              : "1px solid rgba(220, 38, 38, 0.5)",
          width: "100%",
          transition: "background 0.15s",
        }}
      >
        <PiTrash
          size={16}
          color={deleteState === "done" ? "#9ca3af" : "#fca5a5"}
          style={{ display: "block", flexShrink: 0 }}
        />
        {deleteState === "idle" && "Delete all data"}
        {deleteState === "confirm" &&
          "Tap again to confirm — this cannot be undone"}
        {deleteState === "deleting" && "Deleting…"}
        {deleteState === "done" && "All data deleted — reload the app"}
      </button>

      <SectionHeader
        icon={PiCode}
        title="Developer"
        description="Build information for this version of the app."
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "12px 14px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}
      >
        <DataRow label="Git Ref" value={__BUILD_INFO__.gitRef} />
        <DataRow label="Branch" value={__BUILD_INFO__.gitBranch} />
        <DataRow
          label="Build Date"
          value={new Date(__BUILD_INFO__.buildDate).toLocaleDateString(
            undefined,
            {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          )}
        />
      </div>
    </div>
  );
}

function SectionHeader({
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

function DataRow({ label, value }: { label: string; value: string }) {
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
