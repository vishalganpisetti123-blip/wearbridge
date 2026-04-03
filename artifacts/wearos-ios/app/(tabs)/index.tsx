import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatCard } from "@/components/StatCard";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchCard } from "@/components/WatchCard";
import { HeartRateChart } from "@/components/HeartRateChart";
import { useColors } from "@/hooks/useColors";
import { useWatch } from "@/context/WatchContext";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { devices, connectedDevice, syncDevice, isSyncing } = useWatch();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRefresh = async () => {
    if (connectedDevice) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await syncDevice(connectedDevice.id);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: topPad + 16,
            backgroundColor: colors.background,
            opacity: fadeAnim,
          },
        ]}
      >
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            WearBridge
          </Text>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            {connectedDevice ? connectedDevice.name : "No Watch Connected"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/devices")}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomPad }]}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {connectedDevice ? (
            <>
              <View style={[styles.connectionBanner, { backgroundColor: colors.tealLight }]}>
                <View style={[styles.connectedIndicator, { backgroundColor: colors.success }]} />
                <Text style={[styles.connectedText, { color: colors.teal }]}>
                  Connected to {connectedDevice.name}
                </Text>
                <Text style={[styles.batteryText, { color: colors.teal }]}>
                  {connectedDevice.batteryLevel}%{" "}
                  {connectedDevice.isCharging ? "⚡" : ""}
                </Text>
              </View>

              <View style={[styles.hrCard, { backgroundColor: colors.navyDark }]}>
                <View style={styles.hrHeader}>
                  <View>
                    <Text style={[styles.hrTitle, { color: "rgba(255,255,255,0.6)" }]}>
                      Heart Rate
                    </Text>
                    <Text style={[styles.hrSub, { color: "rgba(255,255,255,0.4)" }]}>
                      Live monitoring
                    </Text>
                  </View>
                  <View style={[styles.liveChip, { backgroundColor: colors.destructive + "30" }]}>
                    <View style={[styles.liveDot, { backgroundColor: colors.destructive }]} />
                    <Text style={[styles.liveText, { color: colors.destructive }]}>LIVE</Text>
                  </View>
                </View>
                <HeartRateChart heartRate={connectedDevice.heartRate} />
              </View>

              <View style={styles.statsGrid}>
                <StatCard
                  icon="trending-up"
                  value={connectedDevice.steps.toLocaleString()}
                  label="Steps"
                  color={colors.primary}
                  bgColor={colors.blueLight}
                />
                <StatCard
                  icon="zap"
                  value={connectedDevice.calories.toString()}
                  unit="kcal"
                  label="Calories"
                  color="#f59e0b"
                  bgColor="#fef3c7"
                />
              </View>

              <View style={styles.statsGrid}>
                <StatCard
                  icon="map-pin"
                  value={connectedDevice.distance.toString()}
                  unit="km"
                  label="Distance"
                  color={colors.success}
                  bgColor="#dcfce7"
                />
                <StatCard
                  icon="moon"
                  value={connectedDevice.sleepHours.toString()}
                  unit="hrs"
                  label="Sleep"
                  color="#8b5cf6"
                  bgColor="#ede9fe"
                />
              </View>

              {connectedDevice.notifications.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title="Watch Notifications"
                    action={`${connectedDevice.notifications.filter((n) => n.unread).length} unread`}
                    onAction={() => router.push(`/watch/${connectedDevice.id}`)}
                  />
                  {connectedDevice.notifications.slice(0, 3).map((n) => (
                    <View key={n.id} style={[styles.notifPreview, { backgroundColor: colors.card }]}>
                      <View style={[styles.notifDot, { backgroundColor: n.unread ? colors.primary : "transparent" }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.notifApp, { color: colors.mutedForeground }]}>
                          {n.app}
                        </Text>
                        <Text style={[styles.notifTitle, { color: colors.foreground }]} numberOfLines={1}>
                          {n.title}
                        </Text>
                      </View>
                      <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                        {n.time}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="watch" size={40} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No watch connected
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Add your Wear OS watch to start syncing health data and notifications
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/devices")}
              >
                <Feather name="bluetooth" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>Find Watches</Text>
              </TouchableOpacity>
            </View>
          )}

          {devices.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="My Watches"
                action="Manage"
                onAction={() => router.push("/devices")}
              />
              {devices.map((d) => (
                <WatchCard key={d.id} device={d} />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  headline: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  connectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  connectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  batteryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  hrCard: {
    borderRadius: 20,
    padding: 18,
    gap: 16,
  },
  hrHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  hrTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  hrSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  section: {
    gap: 10,
  },
  notifPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifApp: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notifTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  notifTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
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
});
