import { useState, useRef } from "react";
import { PiTrash, PiDownload, PiUpload } from "react-icons/pi";
import { z } from "zod";
import { deleteOfflineDatabase } from "../../lib/offlineTiles";

interface DataSectionProps {
  storageEstimate: { usage: number; quota: number } | null;
}

export function DataSection({ storageEstimate }: DataSectionProps) {
  const [deleteState, setDeleteState] = useState<
    "idle" | "confirm" | "deleting" | "done"
  >("idle");
  const [importState, setImportState] = useState<
    "idle" | "confirm" | "selecting" | "importing" | "error" | "success"
  >("idle");
  const [importError, setImportError] = useState<string>("");
  const [exportState, setExportState] = useState<"idle" | "selecting">("idle");
  const [exportSelection, setExportSelection] = useState({
    pois: true,
    lists: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dataSchema = z.record(z.string(), z.string());

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function handleExportData() {
    const data: Record<string, string> = {};

    if (exportSelection.pois) {
      const poisRaw = localStorage.getItem("tur-vibes:custom-pois");
      if (poisRaw) {
        data["tur-vibes:custom-pois"] = poisRaw;
      }
    }

    if (exportSelection.lists) {
      const listsRaw = localStorage.getItem("tur-vibes:lists");
      if (listsRaw) {
        data["tur-vibes:lists"] = listsRaw;
      }
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tur-vibes-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportState("idle");
  }

  async function handleImportData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportState("importing");
    setImportError("");

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validatedData = dataSchema.parse(parsed);

      for (const [key, value] of Object.entries(validatedData)) {
        localStorage.setItem(key, value);
      }

      setImportState("success");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      const errorMsg =
        err instanceof z.ZodError
          ? `Invalid data format: ${err.issues.map((e: z.ZodIssue) => e.message).join(", ")}`
          : err instanceof SyntaxError
            ? "Invalid JSON file"
            : "Failed to import data";
      setImportError(errorMsg);
      setImportState("error");
      setTimeout(() => {
        setImportState("idle");
      }, 3000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleOpenFilePickerForImport() {
    setImportState("selecting");
    fileInputRef.current?.click();
  }

  function handleCancelImportConfirm() {
    setImportState("idle");
  }

  async function handleDeleteAll() {
    if (deleteState === "idle") {
      setDeleteState("confirm");
      return;
    }
    if (deleteState === "confirm") {
      setDeleteState("deleting");
      try {
        await deleteOfflineDatabase();
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        localStorage.clear();
      } finally {
        setDeleteState("done");
      }
    }
  }

  return (
    <>
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

      {exportState === "idle" && (
        <button
          onClick={() => setExportState("selecting")}
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
            background: "rgba(59, 130, 246, 0.2)",
            border: "1px solid rgba(59, 130, 246, 0.5)",
            width: "100%",
            transition: "background 0.15s",
            cursor: "pointer",
          }}
        >
          <PiDownload
            size={16}
            color="#93c5fd"
            style={{ display: "block", flexShrink: 0 }}
          />
          Export data
        </button>
      )}

      {exportState === "selecting" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "12px 14px",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.5)",
            borderRadius: 12,
          }}
        >
          <div style={{ color: "#93c5fd", fontSize: 13, fontWeight: 600 }}>
            Select data to export:
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "2px 0",
              cursor: "pointer",
              fontSize: 13,
              color: "#fff",
            }}
          >
            <input
              type="checkbox"
              checked={exportSelection.pois}
              onChange={(e) =>
                setExportSelection({
                  ...exportSelection,
                  pois: e.target.checked,
                })
              }
              style={{
                width: 18,
                height: 18,
                cursor: "pointer",
              }}
            />
            Custom POIs
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "2px 0",
              cursor: "pointer",
              fontSize: 13,
              color: "#fff",
            }}
          >
            <input
              type="checkbox"
              checked={exportSelection.lists}
              onChange={(e) =>
                setExportSelection({
                  ...exportSelection,
                  lists: e.target.checked,
                })
              }
              style={{
                width: 18,
                height: 18,
                cursor: "pointer",
              }}
            />
            Lists
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={() => setExportState("idle")}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleExportData}
              disabled={!exportSelection.pois && !exportSelection.lists}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background:
                  exportSelection.pois || exportSelection.lists
                    ? "rgba(59, 130, 246, 0.3)"
                    : "rgba(255,255,255,0.08)",
                border:
                  exportSelection.pois || exportSelection.lists
                    ? "1px solid rgba(59, 130, 246, 0.6)"
                    : "1px solid rgba(255,255,255,0.2)",
                cursor:
                  exportSelection.pois || exportSelection.lists
                    ? "pointer"
                    : "not-allowed",
                opacity:
                  exportSelection.pois || exportSelection.lists ? 1 : 0.5,
              }}
            >
              Export
            </button>
          </div>
        </div>
      )}

      {importState !== "confirm" && (
        <button
          onClick={() => setImportState("confirm")}
          disabled={importState === "importing" || importState === "selecting"}
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
              importState === "success"
                ? "rgba(16, 185, 129, 0.2)"
                : importState === "error"
                  ? "rgba(239, 68, 68, 0.2)"
                  : "rgba(59, 130, 246, 0.2)",
            border:
              importState === "success"
                ? "1px solid rgba(16, 185, 129, 0.5)"
                : importState === "error"
                  ? "1px solid rgba(239, 68, 68, 0.5)"
                  : "1px solid rgba(59, 130, 246, 0.5)",
            width: "100%",
            transition: "background 0.15s, border 0.15s",
            cursor:
              importState === "importing" || importState === "selecting"
                ? "default"
                : "pointer",
            opacity: importState === "selecting" ? 0.6 : 1,
          }}
        >
          <PiUpload
            size={16}
            color={
              importState === "success"
                ? "#86efac"
                : importState === "error"
                  ? "#fca5a5"
                  : "#93c5fd"
            }
            style={{ display: "block", flexShrink: 0 }}
          />
          {importState === "idle" && "Import data"}
          {importState === "importing" && "Importing…"}
          {importState === "success" && "Data imported"}
          {importState === "error" && "Import failed"}
        </button>
      )}

      {importState === "confirm" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "12px 14px",
            background: "rgba(251, 146, 60, 0.1)",
            border: "1px solid rgba(251, 146, 60, 0.5)",
            borderRadius: 12,
          }}
        >
          <div style={{ color: "#fed7aa", fontSize: 13, fontWeight: 600 }}>
            This will overwrite your current data. Continue?
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleCancelImportConfirm}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleOpenFilePickerForImport}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background: "rgba(251, 146, 60, 0.3)",
                border: "1px solid rgba(251, 146, 60, 0.6)",
                cursor: "pointer",
              }}
            >
              Overwrite
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={(e) => void handleImportData(e)}
        style={{ display: "none" }}
      />

      {importState === "error" && importError && (
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 8,
            color: "#fca5a5",
            fontSize: 12,
          }}
        >
          {importError}
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
    </>
  );
}
