import { PiCloudSlash } from "react-icons/pi";
import { useOffline } from "../tools/offline/context";
import { useNetworkConnection } from "../lib/useNetworkConnection";

export function OfflineModeBanner() {
  const { setOfflineMode } = useOffline();
  const hasNetworkConnection = useNetworkConnection();

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        background: "rgba(249, 115, 22, 0.95)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        zIndex: 25,
      }}
    >
      <PiCloudSlash
        size={18}
        color="#fff"
        style={{ display: "block", flexShrink: 0 }}
      />
      <span style={{ flex: 1, color: "#fff", fontSize: 14, fontWeight: 700 }}>
        Offline mode
      </span>
      {hasNetworkConnection && (
        <button
          onClick={() => setOfflineMode(false)}
          style={{
            background: "rgba(0,0,0,0.25)",
            borderRadius: 8,
            padding: "6px 10px",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Disable
        </button>
      )}
    </div>
  );
}
