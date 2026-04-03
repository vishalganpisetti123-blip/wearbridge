import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useWatch, WatchDevice } from "@/context/WatchContext";

interface WatchCardProps {
  device: WatchDevice;
  onLongPress?: () => void;
}

export function WatchCard({ device, onLongPress }: WatchCardProps) {
  const colors = useColors();
  const { connectDevice, syncDevice } = useWatch();
  const [connecting, setConnecting] = useState(false);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleConnect = async () => {
    if (device.isConnected) {
      router.push(`/watch/${device.id}`);
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnecting(true);
    scale.value = withSpring(0.97, { damping: 15 });
    await connectDevice(device.id);
    scale.value = withSpring(1);
    setConnecting(false);
    router.push(`/watch/${device.id}`);
  };

  const batteryColor =
    device.batteryLevel > 50
      ? colors.success
      : device.batteryLevel > 20
        ? colors.warning
        : colors.destructive;

  const batteryIcon =
    device.batteryLevel > 75
      ? "battery"
      : device.batteryLevel > 50
        ? "battery"
        : device.batteryLevel > 25
          ? "battery"
          : "battery";

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleConnect}
        onLongPress={onLongPress}
        style={[
          styles.card,
          {
            backgroundColor: device.isConnected
              ? colors.blueLight
              : colors.card,
            borderColor: device.isConnected ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.watchIconWrap}>
            <View
              style={[
                styles.watchCircle,
                {
                  backgroundColor: device.isConnected
                    ? colors.primary
                    : colors.muted,
                },
              ]}
            >
              <Feather
                name="watch"
                size={22}
                color={device.isConnected ? "#fff" : colors.mutedForeground}
              />
            </View>
            {device.isConnected && (
              <View
                style={[styles.connectedDot, { backgroundColor: colors.success }]}
              />
            )}
          </View>
          <View style={styles.info}>
            <Text
              style={[styles.name, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {device.name}
            </Text>
            <Text style={[styles.model, { color: colors.mutedForeground }]}>
              {device.model}
            </Text>
          </View>
          <View style={styles.batteryWrap}>
            {device.isCharging && (
              <Feather name="zap" size={12} color={colors.warning} style={{ marginBottom: 2 }} />
            )}
            <Text style={[styles.batteryText, { color: batteryColor }]}>
              {device.batteryLevel}%
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.bottomRow}>
          {device.isConnected ? (
            <>
              <View style={styles.metricItem}>
                <Feather name="activity" size={14} color={colors.teal} />
                <Text style={[styles.metricValue, { color: colors.foreground }]}>
                  {device.heartRate}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.mutedForeground }]}>
                  bpm
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metricItem}>
                <Feather name="trending-up" size={14} color={colors.primary} />
                <Text style={[styles.metricValue, { color: colors.foreground }]}>
                  {device.steps.toLocaleString()}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.mutedForeground }]}>
                  steps
                </Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metricItem}>
                <Feather name="clock" size={14} color={colors.mutedForeground} />
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {device.lastSync}
                </Text>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.connectBtn, { backgroundColor: colors.primary }]}
              onPress={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="bluetooth" size={14} color="#fff" />
                  <Text style={styles.connectBtnText}>Connect</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {device.isConnected && (
            <TouchableOpacity
              style={[styles.chevronBtn]}
              onPress={() => router.push(`/watch/${device.id}`)}
            >
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    ...Platform.select({
      web: { boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  watchIconWrap: {
    position: "relative",
  },
  watchCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  connectedDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "white",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  model: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  batteryWrap: {
    alignItems: "center",
  },
  batteryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    height: 1,
    marginHorizontal: -4,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metricItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  metricUnit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  metricDivider: {
    width: 1,
    height: 18,
  },
  connectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  connectBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  chevronBtn: {
    padding: 4,
  },
});
