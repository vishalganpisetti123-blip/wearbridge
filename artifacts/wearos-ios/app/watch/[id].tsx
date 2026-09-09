import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
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

import { HeartRateChart } from "@/components/HeartRateChart";
import { StatCard } from "@/components/StatCard";
import { useColors } from "@/hooks/useColors";
import { useWatch } from "@/context/WatchContext";

export default function WatchDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { devices, syncDevice, disconnectDevice } = useWatch();
  const [syncing, setSyncing] = useState(false);

  const device = devices.find((d) => d.id === id);
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  if (!device) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text
            style={[styles.notFoundText, { color: colors.mutedForeground }]}
          >
            Watch not found
          </Text>
        </View>
      </View>
    );
  }

  const handleSync = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSyncing(true);
    try {
      await syncDevice(device.id);
    } catch (error) {
      Alert.alert(
        "Sync failed",
        error instanceof Error ? error.message : "Unable to sync the watch.",
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert("Disconnect Watch", `Disconnect ${device.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: () => {
          disconnectDevice(device.id);
          router.back();
        },
      },
    ]);
  };

  const batteryColor =
    device.batteryLevel === null
      ? colors.mutedForeground
      : device.batteryLevel > 50
        ? colors.success
        : device.batteryLevel > 20
          ? colors.warning
          : colors.destructive;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text
            style={[styles.headerTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {device.name}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: device.isConnected
                    ? colors.success
                    : colors.mutedForeground,
                },
              ]}
            />
            <Text
              style={[styles.statusText, { color: colors.mutedForeground }]}
            >
              {device.isConnected ? "Connected" : "Disconnected"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSync}
          style={[styles.syncBtn, { backgroundColor: colors.muted }]}
          disabled={syncing || !device.isConnected}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="refresh-cw" size={18} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 + bottomPad },
        ]}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.navyDark }]}>
          <View style={styles.heroTop}>
            <View
              style={[
                styles.watchIconLarge,
                { backgroundColor: "rgba(255,255,255,0.1)" },
              ]}
            >
              <Feather name="watch" size={28} color="rgba(255,255,255,0.8)" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroModel}>{device.model}</Text>
              <Text style={styles.heroFirmware}>
                Firmware v{device.firmwareVersion}
              </Text>
            </View>
            <View>
              <Text style={[styles.heroBattery, { color: batteryColor }]}>
                {device.batteryLevel === null ? "—" : `${device.batteryLevel}%`}
              </Text>
              {device.isCharging && (
                <Text style={styles.heroCharging}>Charging</Text>
              )}
            </View>
          </View>
          <View style={styles.heroHr}>
            <HeartRateChart heartRate={device.heartRate} />
          </View>
          <View style={styles.heroFooter}>
            <Text style={styles.heroSync}>Last sync: {device.lastSync}</Text>
            <Text style={styles.heroMac}>{device.macAddress}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="trending-up"
            value={device.steps === null ? "—" : device.steps.toLocaleString()}
            label="Steps"
            color={colors.primary}
            bgColor={colors.blueLight}
          />
          <StatCard
            icon="zap"
            value={device.calories?.toString() ?? "—"}
            unit="kcal"
            label="Calories"
            color="#f59e0b"
            bgColor="#fef3c7"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="map-pin"
            value={device.distance?.toString() ?? "—"}
            unit="km"
            label="Distance"
            color={colors.success}
            bgColor="#dcfce7"
          />
          <StatCard
            icon="clock"
            value={device.activeMinutes?.toString() ?? "—"}
            unit="min"
            label="Active"
            color="#8b5cf6"
            bgColor="#ede9fe"
          />
        </View>

        {device.isConnected && (
          <TouchableOpacity
            style={[styles.disconnectBtn, { borderColor: colors.destructive }]}
            onPress={handleDisconnect}
          >
            <Feather name="bluetooth" size={18} color={colors.destructive} />
            <Text
              style={[styles.disconnectBtnText, { color: colors.destructive }]}
            >
              Disconnect Watch
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  syncBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  watchIconLarge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  heroModel: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  heroFirmware: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  heroBattery: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  heroCharging: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  heroHr: {},
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroSync: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  heroMac: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  section: {
    gap: 10,
  },
  emptyNotifs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    justifyContent: "center",
  },
  emptyNotifsText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  disconnectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 4,
  },
  disconnectBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
});
