import { PiTrash, PiDownload, PiUpload, PiDatabase } from "react-icons/pi";
import { SettingsSection } from "./settingsComponents";
import { useDataSection } from "./useDataSection";

interface DataSectionProps {
  storageEstimate: { usage: number; quota: number } | null;
}

export function DataSection({ storageEstimate }: DataSectionProps) {
  const {
    deleteState,
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
  } = useDataSection();

  return (
    <SettingsSection
      icon={PiDatabase}
      title="Data"
      description="Manage your saved data and offline regions."
    >
      {storageEstimate && (
        <div className="flex flex-col gap-2 px-3.5 py-3 bg-white/8 rounded-lg">
          <div>
            <div className="text-gray-400 text-xs mb-0.5 font-semibold uppercase tracking-wider">
              Used Storage
            </div>
            <div className="text-white text-sm font-bold">
              {formatBytes(storageEstimate.usage)} /{" "}
              {formatBytes(storageEstimate.quota)}
            </div>
          </div>
          <div className="h-1.5 bg-white/15 rounded overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{
                width: `${Math.min((storageEstimate.usage / storageEstimate.quota) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {exportState === "idle" && (
        <button
          onClick={() => setExportState("selecting")}
          className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-lg text-sm font-bold text-white bg-blue-500/20 border border-blue-500/50 w-full transition-colors duration-150 cursor-pointer hover:bg-blue-500/30"
        >
          <PiDownload
            size={16}
            color="#93c5fd"
            className="block flex-shrink-0"
          />
          Export data
        </button>
      )}

      {exportState === "selecting" && (
        <div className="flex flex-col gap-2 px-3.5 py-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <div className="text-blue-300 text-xs font-semibold">
            Select data to export:
          </div>

          <label className="flex items-center gap-2.5 py-0.5 cursor-pointer text-xs text-white">
            <input
              type="checkbox"
              checked={exportSelection.pois}
              onChange={(e) =>
                setExportSelection({
                  ...exportSelection,
                  pois: e.target.checked,
                })
              }
              className="w-4.5 h-4.5 cursor-pointer"
            />
            Custom POIs
          </label>

          <label className="flex items-center gap-2.5 py-0.5 cursor-pointer text-xs text-white">
            <input
              type="checkbox"
              checked={exportSelection.lists}
              onChange={(e) =>
                setExportSelection({
                  ...exportSelection,
                  lists: e.target.checked,
                })
              }
              className="w-4.5 h-4.5 cursor-pointer"
            />
            Lists
          </label>

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setExportState("idle")}
              className="flex-1 px-3 py-2.5 rounded-lg text-xs font-bold text-white bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleExportData}
              disabled={!exportSelection.pois && !exportSelection.lists}
              className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-bold text-white transition-colors duration-150 ${
                exportSelection.pois || exportSelection.lists
                  ? "bg-blue-500/30 border border-blue-500/60 cursor-pointer hover:bg-blue-500/40"
                  : "bg-white/8 border border-white/20 cursor-not-allowed opacity-50"
              }`}
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
          className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-lg text-sm font-bold text-white w-full transition-colors duration-150 ${
            importState === "success"
              ? "bg-emerald-500/20 border border-emerald-500/50"
              : importState === "error"
                ? "bg-red-500/20 border border-red-500/50"
                : "bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30"
          } ${
            importState === "importing" || importState === "selecting"
              ? "cursor-default opacity-60"
              : "cursor-pointer"
          }`}
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
            className="block flex-shrink-0"
          />
          {importState === "idle" && "Import data"}
          {importState === "importing" && "Importing…"}
          {importState === "success" && "Data imported"}
          {importState === "error" && "Import failed"}
        </button>
      )}

      {importState === "confirm" && (
        <div className="flex flex-col gap-2 px-3.5 py-3 bg-orange-500/10 border border-orange-500/50 rounded-lg">
          <div className="text-orange-300 text-xs font-semibold">
            This will overwrite your current data. Continue?
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancelImportConfirm}
              className="flex-1 px-3 py-2.5 rounded-lg text-xs font-bold text-white bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleOpenFilePickerForImport}
              className="flex-1 px-3 py-2.5 rounded-lg text-xs font-bold text-white bg-orange-500/30 border border-orange-500/60 cursor-pointer hover:bg-orange-500/40 transition-colors duration-150"
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
        className="hidden"
      />

      {importState === "error" && importError && (
        <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-xs">
          {importError}
        </div>
      )}

      <button
        onClick={() => void handleDeleteAll()}
        disabled={deleteState === "deleting" || deleteState === "done"}
        className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-lg text-sm font-bold text-white w-full transition-colors duration-150 ${
          deleteState === "confirm"
            ? "bg-red-600 border-none cursor-pointer hover:bg-red-700"
            : deleteState === "done"
              ? "bg-white/8 border border-red-500/50 cursor-not-allowed"
              : "bg-red-500/20 border border-red-500/50 cursor-pointer hover:bg-red-500/30"
        }`}
      >
        <PiTrash
          size={16}
          color={deleteState === "done" ? "#9ca3af" : "#fca5a5"}
          className="block flex-shrink-0"
        />
        {deleteState === "idle" && "Delete all data"}
        {deleteState === "confirm" &&
          "Tap again to confirm — this cannot be undone"}
        {deleteState === "deleting" && "Deleting…"}
        {deleteState === "done" && "All data deleted — reload the app"}
      </button>
    </SettingsSection>
  );
}
