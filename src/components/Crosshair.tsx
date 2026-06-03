export function Crosshair({ visible = true }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <div
        style={{
          position: "absolute",
          backgroundColor: "#111827",
          height: 1.5,
          width: 32,
        }}
      />
      <div
        style={{
          position: "absolute",
          backgroundColor: "#111827",
          width: 1.5,
          height: 32,
        }}
      />
    </div>
  );
}
