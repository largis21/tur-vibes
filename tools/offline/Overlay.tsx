import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useMap } from "../../map/MapContext";
import { boundsIntersect } from "../../map/offlineTiles";
import { DOWNLOAD_BOX_INSETS, useOffline } from "./context";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function OfflineOverlay() {
  const { deactivateTool } = useMap();
  const {
    tileCount,
    downloading,
    progress,
    storageBytes,
    startDownload,
    cancelDownload,
    clearSelection,
    offlineMode,
    setOfflineMode,
    savedRegions,
    selectionBounds,
  } = useOffline();

  const estimatedBytes = tileCount * 30 * 1024;
  const hasSelectionToClear =
    !!selectionBounds &&
    savedRegions.some((r) => boundsIntersect(r.bounds, selectionBounds));

  return (
    <>
      <View pointerEvents="none" style={styles.boxWrapper}>
        <View
          style={[
            styles.dim,
            {
              top: 0,
              left: 0,
              right: 0,
              height: `${DOWNLOAD_BOX_INSETS.top * 100}%`,
            },
          ]}
        />
        <View
          style={[
            styles.dim,
            {
              bottom: 0,
              left: 0,
              right: 0,
              height: `${DOWNLOAD_BOX_INSETS.bottom * 100}%`,
            },
          ]}
        />
        <View
          style={[
            styles.dim,
            {
              top: `${DOWNLOAD_BOX_INSETS.top * 100}%`,
              bottom: `${DOWNLOAD_BOX_INSETS.bottom * 100}%`,
              left: 0,
              width: `${DOWNLOAD_BOX_INSETS.horizontal * 100}%`,
            },
          ]}
        />
        <View
          style={[
            styles.dim,
            {
              top: `${DOWNLOAD_BOX_INSETS.top * 100}%`,
              bottom: `${DOWNLOAD_BOX_INSETS.bottom * 100}%`,
              right: 0,
              width: `${DOWNLOAD_BOX_INSETS.horizontal * 100}%`,
            },
          ]}
        />
        <View
          style={[
            styles.box,
            {
              top: `${DOWNLOAD_BOX_INSETS.top * 100}%`,
              bottom: `${DOWNLOAD_BOX_INSETS.bottom * 100}%`,
              left: `${DOWNLOAD_BOX_INSETS.horizontal * 100}%`,
              right: `${DOWNLOAD_BOX_INSETS.horizontal * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Offline maps</Text>
            <Text style={styles.subtitle}>
              Pan to position the area inside the dashed box.
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={deactivateTool}
            style={styles.closeButton}
          >
            <Ionicons color="#fff" name="close" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Offline mode</Text>
            <Text style={styles.rowSubtitle}>
              Use only downloaded maps. No network requests.
            </Text>
          </View>
          <Switch
            onValueChange={setOfflineMode}
            thumbColor="#fff"
            trackColor={{ false: "#374151", true: "#f97316" }}
            value={offlineMode}
          />
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            {tileCount.toLocaleString()} tiles · ~{formatBytes(estimatedBytes)}
          </Text>
          <Text style={styles.statText}>
            Stored: {formatBytes(storageBytes)}
          </Text>
        </View>

        {progress && downloading ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      progress.total
                        ? Math.min(
                            100,
                            ((progress.completed + progress.failed) /
                              progress.total) *
                              100,
                          )
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.completed + progress.failed}/{progress.total}
              {progress.failed > 0 ? ` (${progress.failed} failed)` : ""}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {downloading ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={cancelDownload}
              style={[styles.button, styles.buttonSecondary]}
            >
              <Ionicons color="#fff" name="stop" size={18} />
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={tileCount === 0}
                onPress={startDownload}
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  tileCount === 0 && styles.buttonDisabled,
                ]}
              >
                <Ionicons color="#fff" name="download" size={18} />
                <Text style={styles.buttonText}>Download</Text>
              </TouchableOpacity>
              {hasSelectionToClear ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={clearSelection}
                  style={[styles.button, styles.buttonSecondary]}
                >
                  <Ionicons color="#fff" name="trash" size={18} />
                  <Text style={styles.buttonText}>Clear selection</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  boxWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  dim: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    position: "absolute",
  },
  box: {
    position: "absolute",
    borderColor: "#f97316",
    borderStyle: "dashed",
    borderWidth: 2,
    borderRadius: 4,
  },
  panel: {
    backgroundColor: "rgba(17, 24, 39, 0.94)",
    borderRadius: 16,
    bottom: 36,
    gap: 12,
    left: 16,
    padding: 16,
    position: "absolute",
    right: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  rowTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statText: {
    color: "#d1d5db",
    fontSize: 12,
  },
  progressContainer: {
    gap: 6,
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 4,
    height: 6,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#f97316",
    height: "100%",
  },
  progressText: {
    color: "#d1d5db",
    fontSize: 12,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 12,
  },
  buttonPrimary: {
    backgroundColor: "#f97316",
  },
  buttonSecondary: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
