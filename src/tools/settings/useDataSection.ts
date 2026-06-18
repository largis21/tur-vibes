import { useState, useRef } from "react";
import { z } from "zod";
import { deleteOfflineDatabase } from "../../lib/offlineTiles";
import { STORAGE_KEYS } from "../../lib/storage";

export function useDataSection() {
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
      const poisRaw = localStorage.getItem(STORAGE_KEYS.customPois);
      if (poisRaw) {
        data[STORAGE_KEYS.customPois] = poisRaw;
      }
    }

    if (exportSelection.lists) {
      const listsRaw = localStorage.getItem(STORAGE_KEYS.lists);
      if (listsRaw) {
        data[STORAGE_KEYS.lists] = listsRaw;
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

  return {
    deleteState,
    setDeleteState,
    importState,
    setImportState,
    importError,
    exportState,
    setExportState,
    exportSelection,
    setExportSelection,
    fileInputRef,
    formatBytes,
    handleExportData,
    handleImportData,
    handleOpenFilePickerForImport,
    handleCancelImportConfirm,
    handleDeleteAll,
  };
}
