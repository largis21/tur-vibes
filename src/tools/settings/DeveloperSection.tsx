import { PiCode } from "react-icons/pi";
import { SectionHeader, DataRow } from "./settingsComponents";

declare global {
  const __BUILD_INFO__: {
    gitRef: string;
    gitBranch: string;
    buildDate: string;
  };
}

export function DeveloperSection() {
  return (
    <div className="flex flex-col gap-2">
      <SectionHeader
        icon={PiCode}
        title="Developer Info"
        description="Build information for this version of the app."
      />

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
    </div>
  );
}
