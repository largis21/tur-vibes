import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { ToolDefinition } from "./defineTool";

type SidebarProps = {
  isOpen: boolean;
  tools: ToolDefinition[];
  activeToolId: string | null;
  onSelectTool: (id: string) => void;
  onClose: () => void;
};

export function Sidebar({
  isOpen,
  tools,
  activeToolId,
  onSelectTool,
  onClose,
}: SidebarProps) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animation, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [animation, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <Animated.View
        pointerEvents="auto"
        style={[styles.backdrop, { opacity: animation }]}
      >
        <Pressable
          accessibilityLabel="Close tools"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [
              {
                translateX: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [280, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tools</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons color="#111827" name="close" size={22} />
          </TouchableOpacity>
        </View>
        {tools.map((tool) => {
          const isActive = tool.id === activeToolId;
          return (
            <TouchableOpacity
              key={tool.id}
              accessibilityRole="button"
              onPress={() => onSelectTool(tool.id)}
              style={[styles.toolButton, isActive && styles.toolButtonActive]}
            >
              <Ionicons
                color={isActive ? "#fff" : "#111827"}
                name={tool.icon}
                size={20}
              />
              <Text
                style={[
                  styles.toolButtonText,
                  isActive && styles.toolButtonTextActive,
                ]}
              >
                {tool.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.2)",
  },
  sidebar: {
    backgroundColor: "#fff",
    bottom: 0,
    elevation: 7,
    paddingHorizontal: 20,
    paddingTop: 56,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { height: 0, width: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    top: 0,
    width: 280,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  toolButton: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toolButtonActive: {
    backgroundColor: "#f97316",
  },
  toolButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  toolButtonTextActive: {
    color: "#fff",
  },
});
