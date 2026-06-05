import { usePeak } from "../lib/PeakContext";
import { ModalShell } from "./ui/ModalShell";

export function PeakInfoModal() {
  const { selectedPeak, selectPeak } = usePeak();

  if (!selectedPeak) return null;

  const name = selectedPeak.name ?? "Unnamed peak";

  return (
    <ModalShell
      title="Mountain peak"
      subtitle={name}
      onClose={() => selectPeak(null)}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Stat
          label="Elevation"
          value={selectedPeak.ele != null ? `${selectedPeak.ele} m` : "–"}
        />
        <Stat
          label="Prominence"
          value={
            selectedPeak.prominence != null
              ? `${selectedPeak.prominence} m`
              : "–"
          }
        />
      </div>
    </ModalShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          color: "#9ca3af",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}
