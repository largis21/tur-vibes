import { StyleSheet, View } from "react-native";

export function Crosshair({ visible = true }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.crosshair} pointerEvents="none">
      <View style={styles.hLine} />
      <View style={styles.vLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  crosshair: {
    ...StyleSheet.absoluteFillObject,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  hLine: {
    backgroundColor: "#111827",
    height: 1.5,
    position: "absolute",
    width: 32,
  },
  vLine: {
    backgroundColor: "#111827",
    height: 32,
    position: "absolute",
    width: 1.5,
  },
});
