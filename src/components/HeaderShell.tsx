import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface HeaderShellProps {
  children: ReactNode;
  onClose: () => void;
  ariaLabel?: string;
}

/**
 * Reusable top-bar shell for active tool overlays.
 * Renders a fixed dark pill anchored to the top of the map with a close
 * button appended on the right. Place action buttons and a centered title
 * section as children.
 */
export function HeaderShell({
  children,
  onClose,
  ariaLabel,
}: HeaderShellProps) {
  return (
    <div
      aria-label={ariaLabel}
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        background: "rgba(17, 24, 39, 0.9)",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 16px",
        zIndex: 20,
      }}
    >
      {children}
      <button
        aria-label="Close"
        onClick={onClose}
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: "rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="close" size={20} color="#fff" />
      </button>
    </div>
  );
}
