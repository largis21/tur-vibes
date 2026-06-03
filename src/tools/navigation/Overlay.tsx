import { useMap } from "../../lib/MapContext";
import { Icon } from "../../components/Icon";
import { BearingCompass } from "./BearingCompass";
import { useNavigation, type SubToolId } from "./context";

const SUB_TOOLS: { id: SubToolId; title: string }[] = [
  { id: "bearing", title: "Bearing" },
];

export function NavigationOverlay() {
  const { deactivateTool } = useMap();
  const {
    subToolId,
    setSubToolId,
    bearings,
    selectedBearingId,
    selectBearing,
    addBearing,
    removeBearing,
    setBearingHeading,
    clearBearings,
  } = useNavigation();

  const selected = bearings.find((b) => b.id === selectedBearingId) ?? null;

  function handleClose() {
    deactivateTool();
  }

  return (
    <>
      {/* Compass widgets are rendered above the map for each bearing. */}
      {subToolId === "bearing"
        ? bearings.map((b) => (
            <BearingCompass
              key={b.id}
              bearing={b}
              selected={b.id === selectedBearingId}
              onSelect={() => selectBearing(b.id)}
              onChangeHeading={(h) => setBearingHeading(b.id, h)}
            />
          ))
        : null}

      {/* Top bar: sub-tool chips + close. */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          background: "rgba(17, 24, 39, 0.9)",
          borderRadius: 16,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {SUB_TOOLS.map((t) => {
            const active = subToolId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubToolId(t.id)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: active ? "#f97316" : "rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {t.title}
              </button>
            );
          })}
        </div>
        <button
          aria-label="Clear all bearings"
          disabled={bearings.length === 0}
          onClick={clearBearings}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: bearings.length === 0 ? 0.35 : 1,
          }}
        >
          <Icon name="trash" size={18} color="#fff" />
        </button>
        <button
          aria-label="Close"
          onClick={handleClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="close" size={20} color="#fff" />
        </button>
      </div>

      {/* Bottom info row for the selected bearing. */}
      {subToolId === "bearing" && selected ? (
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 110,
            background: "rgba(17, 24, 39, 0.9)",
            borderRadius: 14,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "#9ca3af",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Bearing
            </div>
            <div
              style={{
                color: "#fff",
                fontFamily: "monospace",
                fontSize: 14,
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {Math.round(selected.heading)}°
            </div>
          </div>
          <button
            aria-label="Remove bearing"
            onClick={() => removeBearing(selected.id)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="trash" size={18} color="#fff" />
          </button>
        </div>
      ) : null}

      {/* FAB: add a new bearing at the cursor. */}
      {subToolId === "bearing" ? (
        <button
          aria-label="Place bearing"
          onClick={addBearing}
          style={{
            position: "absolute",
            right: 20,
            bottom: 36,
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "#f97316",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
            zIndex: 20,
          }}
        >
          <Icon name="add" size={32} color="#fff" />
        </button>
      ) : null}
    </>
  );
}
