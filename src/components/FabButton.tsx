import type { ButtonHTMLAttributes } from "react";

type FabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function FabButton({
  active,
  className = "",
  children,
  ...rest
}: FabButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
        active
          ? "bg-accent text-white"
          : "bg-white text-black hover:bg-gray-100"
      } ${className}`}
    >
      {children}
    </button>
  );
}
