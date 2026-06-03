import type { ButtonHTMLAttributes, CSSProperties } from "react";

type FabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

const baseStyle: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 16,
  background: "#fff",
  color: "#111827",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
};

const activeStyle: CSSProperties = {
  background: "#f97316",
  color: "#fff",
};

export function FabButton({
  active,
  style,
  children,
  ...rest
}: FabButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      style={{
        ...baseStyle,
        ...(active ? activeStyle : null),
        ...style,
      }}
    >
      {children}
    </button>
  );
}
