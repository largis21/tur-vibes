import { useSyncExternalStore } from "react";
import { PiScroll } from "react-icons/pi";
import { SettingsSection } from "./settingsComponents";
import { logger } from "../../lib/logger";

interface LogsSectionProps {
  onView: () => void;
}

export function LogsSection({ onView }: LogsSectionProps) {
  const entries = useSyncExternalStore(logger.subscribe, logger.getSnapshot);
  const errorCount = entries.filter((e) => e.level === "error").length;

  return (
    <SettingsSection
      icon={PiScroll}
      title="Logs"
      description="View and filter app logs."
    >
      <button
        onClick={onView}
        className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-lg text-sm font-bold text-white bg-blue-500/20 border border-blue-500/50 w-full transition-colors duration-150 cursor-pointer hover:bg-blue-500/30"
      >
        <PiScroll size={16} color="#93c5fd" className="block flex-shrink-0" />
        <span>View logs</span>
        {errorCount > 0 && (
          <span className="text-xs text-red-300 bg-red-500/30 px-2 py-0.5 rounded-full">
            {errorCount} {errorCount === 1 ? "error" : "errors"}
          </span>
        )}
      </button>
    </SettingsSection>
  );
}
