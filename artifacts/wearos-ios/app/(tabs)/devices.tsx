import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";

import { WatchCard } from "@/components/WatchCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import { useWatch } from "@/context/WatchContext";

export default function DevicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { devices, isScanning, startScan, stopScan, removeDevice } = useWatch();
  const [removing, setRemoving] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const connectedDevices = devices.filter((d) => d.isConnected);
  const availableDevices = devices.filter((d) => !d.isConnected);

  const handleScan = async () => {
    if (isScanning) {
      stopScan();
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startScan();
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert("Remove Watch", `Remove ${name} from WearBridge?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          removeDevice(id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, backgroundColor: colors.background },
        ]}
      >
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>My Devices</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {devices.length} watch{devices.length !== 1 ? "es" : ""} paired
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.scanBtn,
            {
              backgroundColor: isScanning
                ? colors.destructive + "15"
                : colors.primary,
            },
          ]}
          onPress={handleScan}
        >
          {isScanning ? (
            <>
              <ActivityIndicator size="small" color={colors.destructive} />
              <Text style={[styles.scanBtnText, { color: colors.destructive }]}>
                Stop
              </Text>
            </>
          ) : (
            <>
              <Feather name="bluetooth" size={16} color="#fff" />
              <Text style={styles.scanBtnText}>Scan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomPad }]}
      >
        {isScanning && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[styles.scanningBanner, { backgroundColor: colors.blueLight }]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.scanningText, { color: colors.primary }]}>
              Scanning for Wear OS devices...
            </Text>
          </Animated.View>
        )}

        {connectedDevices.length > 0 && (
          <Animated.View layout={Layout} style={styles.section}>
            <SectionHeader title="Connected" />
            {connectedDevices.map((d) => (
              <Animated.View key={d.id} entering={FadeIn} exiting={FadeOut} layout={Layout}>
                <WatchCard
                  device={d}
                  onLongPress={() => handleRemove(d.id, d.name)}
                />
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {availableDevices.length > 0 && (
          <Animated.View layout={Layout} style={styles.section}>
            <SectionHeader title="Available" />
            {availableDevices.map((d) => (
              <Animated.View key={d.id} entering={FadeIn} exiting={FadeOut} layout={Layout}>
                <WatchCard
                  device={d}
                  onLongPress={() => handleRemove(d.id, d.name)}
                />
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {devices.length === 0 && !isScanning && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="bluetooth" size={40} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No devices found
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Tap Scan to discover nearby Wear OS watches via Bluetooth
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={handleScan}
            >
              <Feather name="search" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.helpCard, { backgroundColor: colors.card }]}>
          <Feather name="info" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.helpTitle, { color: colors.foreground }]}>
              Setup Instructions
            </Text>
            <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
              Enable Bluetooth on your iPhone and ensure your Wear OS watch has Bluetooth enabled. Keep both devices within 10 meters.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  scanBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  scanningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  scanningText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  section: {
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  helpCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    alignItems: "flex-start",
  },
  helpTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
