import type { CSSProperties } from "react";

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const style: CSSProperties = {
    width: 44,
    height: 26,
    borderRadius: 999,
    background: checked ? "#f97316" : "#374151",
    position: "relative",
    transition: "background 0.15s ease",
    flexShrink: 0,
    opacity: disabled ? 0.4 : 1,
  };
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={style}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: "#fff",
          transition: "left 0.15s ease",
        }}
      />
    </button>
  );
}
