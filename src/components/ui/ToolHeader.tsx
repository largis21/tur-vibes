import type { ReactNode } from "react";
import { HeaderShell } from "./HeaderShell";

export interface ToolHeaderProps {
  title: string;
  subtitle?: ReactNode;
  buttons?: ReactNode[];
  onClose: () => void;
  ariaLabel?: string;
}

/**
 * Specialized header for tool overlays.
 * Renders title and subtitle on the left, with action buttons.
 * Uses HeaderShell internally for consistent styling and close button.
 */
export function ToolHeader({
  title,
  subtitle,
  buttons = [],
  onClose,
  ariaLabel,
}: ToolHeaderProps) {
  return (
    <HeaderShell onClose={onClose} ariaLabel={ariaLabel}>
      {/* Title and subtitle on the left */}
      <div style={{ lineHeight: 1.2 }}>
        <div
          style={{
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 700,
            marginTop: 0,
            marginBottom: 0,
          }}
        >
          {title}
        </div>
        {subtitle != null && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Spacer to push buttons to the right */}
      <div style={{ flex: 1 }} />

      {/* Action buttons on the right */}
      <div style={{ display: "flex", gap: 8 }}>
        {buttons.map((button, idx) => (
          <div key={idx}>{button}</div>
        ))}
      </div>
    </HeaderShell>
  );
}
