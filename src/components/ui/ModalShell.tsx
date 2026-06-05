import type { ReactNode } from "react";
import { PiX, PiArrowLeft } from "react-icons/pi";

export interface ModalShellProps {
  children: ReactNode;
  /** Large title shown with full opacity. */
  title: string;
  /** Optional secondary line with reduced opacity. */
  subtitle?: ReactNode;
  onClose?: () => void;
  /** Called when back button is clicked. If set, renders a back button. */
  onBack?: () => void;
  ariaLabel?: string;
  /** Render a darkened backdrop; clicking it calls onClose. */
  backdrop?: boolean;
  /** Allow the card body to scroll vertically. */
  scrollable?: boolean;
  zIndex?: number;
  margin?: boolean;
}

export function ModalShell({
  children,
  title,
  subtitle,
  onClose,
  onBack,
  ariaLabel,
  backdrop = false,
  scrollable = false,
  zIndex = 90,
}: ModalShellProps) {
  const card = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
      style={{
        width: "100%",
        background: "rgba(17, 24, 39, 0.96)",
        color: "#fff",
        borderRadius: "16px 16px 48px 48px",
        padding: 24,
        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        ...(scrollable ? { maxHeight: "70vh", overflowY: "auto" } : {}),
      }}
      onClick={backdrop ? (e) => e.stopPropagation() : undefined}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {onBack && (
          <button
            aria-label="Back"
            onClick={onBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "none",
              cursor: "pointer",
            }}
          >
            <PiArrowLeft
              size={18}
              color="#fff"
              style={{ display: "block", flexShrink: 0 }}
            />
          </button>
        )}
        <div style={{ flex: 1, lineHeight: 1.2 }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 18,
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
                fontSize: 14,
                fontWeight: 400,
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {onClose && (
          <button
            aria-label="Close"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "none",
              cursor: "pointer",
            }}
          >
            <PiX
              size={18}
              color="#fff"
              style={{ display: "block", flexShrink: 0 }}
            />
          </button>
        )}
      </div>

      {children}
    </div>
  );

  if (backdrop) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: 16,
          zIndex,
        }}
        onClick={onClose}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>{card}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        padding: 8,
        zIndex,
        pointerEvents: "none",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, pointerEvents: "auto" }}>
        {card}
      </div>
    </div>
  );
}
