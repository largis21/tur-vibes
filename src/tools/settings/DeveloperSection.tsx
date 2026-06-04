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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SectionHeader
        icon={PiCode}
        title="Developer Info"
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
