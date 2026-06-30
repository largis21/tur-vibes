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
        mixBlendMode: "difference",
      }}
    >
      <div
        style={{
          position: "absolute",
          backgroundColor: "#ffffff",
          height: 1,
          width: 20,
        }}
      />
      <div
        style={{
          position: "absolute",
          backgroundColor: "#ffffff",
          width: 1,
          height: 20,
        }}
      />
    </div>
  );
}
