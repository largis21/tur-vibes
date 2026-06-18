import { PiCode } from "react-icons/pi";
import { SettingsSection } from "./settingsComponents";

declare global {
  const __BUILD_INFO__: {
    gitRef: string;
    gitBranch: string;
    buildDate: string;
  };
}

export function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 justify-between">
      <div className="text-white text-xs font-bold">{label}</div>
      <div className="text-gray-400 text-2xs font-mono">{value}</div>
    </div>
  );
}

export function DeveloperSection() {
  return (
    <SettingsSection
      icon={PiCode}
      title="Developer Info"
      description="Build information for this version of the app."
    >
      <div className="flex flex-col gap-1.5 p-3 bg-white/8 rounded-lg">
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
    </SettingsSection>
  );
}
