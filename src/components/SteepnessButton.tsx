import { useRef, useState } from "react";
import { Icon } from "./Icon";
import { FabButton } from "./FabButton";
import { useUiState } from "../lib/UiState";

/** Pixels of vertical drag that maps to a full 0..1 opacity sweep. */
const DRAG_RANGE_PX = 200;
/** Threshold to distinguish a tap from a drag. */
const DRAG_THRESHOLD_PX = 6;
/** Minimum visible opacity while dragging (so the user can see the change). */
const MIN_OPACITY = 0.05;

export function SteepnessButton() {
  const {
    showSteepness,
    toggleSteepness,
    setShowSteepness,
    steepnessOpacity,
    setSteepnessOpacity,
  } = useUiState();

  const dragStateRef = useRef<{
    startY: number;
    startOpacity: number;
    didDrag: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    dragStateRef.current = {
      startY: e.clientY,
      startOpacity: steepnessOpacity,
      didDrag: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const state = dragStateRef.current;
    if (!state) return;
    const dy = state.startY - e.clientY; // up = positive
    if (!state.didDrag && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
    if (!state.didDrag) {
      state.didDrag = true;
      setDragging(true);
      // Drag implies the user wants the layer visible.
      if (!showSteepness) setShowSteepness(true);
    }
    const next = Math.max(
      MIN_OPACITY,
      Math.min(1, state.startOpacity + dy / DRAG_RANGE_PX),
    );
    setSteepnessOpacity(next);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const state = dragStateRef.current;
    dragStateRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (state && !state.didDrag) {
      toggleSteepness();
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <FabButton
        aria-label="Toggle steepness layer"
        active={showSteepness}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        // Suppress the default click — we handle tap vs. drag manually.
        onClick={(e) => e.preventDefault()}
        style={{ touchAction: "none" }}
      >
        <Icon name="trending-up" size={24} />
      </FabButton>
      {dragging ? <OpacityIndicator opacity={steepnessOpacity} /> : null}
    </div>
  );
}

function OpacityIndicator({ opacity }: { opacity: number }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 60,
        top: "50%",
        transform: "translateY(-50%)",
        background: "rgba(17, 24, 39, 0.92)",
        color: "#fff",
        borderRadius: 10,
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 48,
        alignItems: "center",
        pointerEvents: "none",
        boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          width: 6,
          height: 80,
          background: "rgba(255,255,255,0.18)",
          borderRadius: 3,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${Math.round(opacity * 100)}%`,
            background: "#f97316",
            borderRadius: 3,
          }}
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700 }}>
        {Math.round(opacity * 100)}%
      </div>
    </div>
  );
}
