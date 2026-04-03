import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useWatch, DiscoveredDevice, WatchDevice } from "@/context/WatchContext";

function SignalBars({ rssi }: { rssi: number }) {
  const colors = useColors();
  // rssi: -50 = strong, -90 = weak
  const strength = rssi > -65 ? 3 : rssi > -75 ? 2 : 1;
  return (
    <View style={sigStyles.row}>
      {[1, 2, 3].map((bar) => (
        <View
          key={bar}
          style={[
            sigStyles.bar,
            { height: bar * 4 + 4 },
            {
              backgroundColor:
                bar <= strength ? colors.success : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

const sigStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { width: 4, borderRadius: 2 },
});

function DiscoveredCard({
  device,
  onPair,
  pairing,
}: {
  device: DiscoveredDevice;
  onPair: () => void;
  pairing: boolean;
}) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} layout={Layout}>
      <View style={[dStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[dStyles.iconBox, { backgroundColor: colors.muted }]}>
          <Feather name="watch" size={20} color={colors.mutedForeground} />
        </View>
        <View style={dStyles.info}>
          <Text style={[dStyles.name, { color: colors.foreground }]}>{device.model}</Text>
          <View style={dStyles.metaRow}>
            <Text style={[dStyles.meta, { color: colors.mutedForeground }]}>
              {device.macAddress}
            </Text>
          </View>
          <View style={dStyles.metaRow}>
            <SignalBars rssi={device.rssi} />
            <Text style={[dStyles.rssi, { color: colors.mutedForeground }]}>
              {device.rssi} dBm
            </Text>
            <Text style={[dStyles.battery, { color: colors.success }]}>
              {device.batteryLevel}%
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            dStyles.pairBtn,
            { backgroundColor: pairing ? colors.muted : colors.primary },
          ]}
          onPress={onPair}
          disabled={pairing}
        >
          {pairing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={dStyles.pairBtnText}>Pair</Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const dStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  rssi: { fontSize: 11, fontFamily: "Inter_400Regular" },
  battery: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  pairBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  pairBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});

function PairedWatchRow({
  device,
  onConnect,
  onRemove,
  connecting,
}: {
  device: WatchDevice;
  onConnect: () => void;
  onRemove: () => void;
  connecting: boolean;
}) {
  const colors = useColors();
  const batteryColor =
    device.batteryLevel > 50
      ? colors.success
      : device.batteryLevel > 20
        ? colors.warning
        : colors.destructive;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} layout={Layout}>
      <View
        style={[
          pStyles.card,
          {
            backgroundColor: device.isConnected ? colors.blueLight : colors.card,
            borderColor: device.isConnected ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={pStyles.left}>
          <View
            style={[
              pStyles.iconBox,
              {
                backgroundColor: device.isConnected ? colors.primary : colors.muted,
              },
            ]}
          >
            <Feather
              name="watch"
              size={20}
              color={device.isConnected ? "#fff" : colors.mutedForeground}
            />
          </View>
          {device.isConnected && (
            <View style={[pStyles.connectedDot, { backgroundColor: colors.success }]} />
          )}
        </View>

        <TouchableOpacity
          style={pStyles.info}
          onPress={() => {
            if (device.isConnected) router.push(`/watch/${device.id}`);
          }}
          activeOpacity={device.isConnected ? 0.7 : 1}
        >
          <Text style={[pStyles.name, { color: colors.foreground }]} numberOfLines={1}>
            {device.name}
          </Text>
          <Text style={[pStyles.model, { color: colors.mutedForeground }]}>
            {device.model}
          </Text>
          <View style={pStyles.statsRow}>
            {device.isConnected ? (
              <>
                <Feather name="activity" size={12} color={colors.teal} />
                <Text style={[pStyles.stat, { color: colors.foreground }]}>
                  {device.heartRate} bpm
                </Text>
                <Text style={[pStyles.dot, { color: colors.border }]}>·</Text>
                <Text style={[pStyles.stat, { color: colors.foreground }]}>
                  {device.steps.toLocaleString()} steps
                </Text>
              </>
            ) : (
              <Text style={[pStyles.stat, { color: colors.mutedForeground }]}>
                Not connected
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={pStyles.actions}>
          <Text style={[pStyles.battery, { color: batteryColor }]}>
            {device.batteryLevel}%
          </Text>

          {!device.isConnected && (
            <TouchableOpacity
              style={[pStyles.connectBtn, { backgroundColor: colors.primary }]}
              onPress={onConnect}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="bluetooth" size={14} color="#fff" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[pStyles.removeBtn, { backgroundColor: colors.destructive + "15" }]}
            onPress={onRemove}
            hitSlop={6}
          >
            <Feather name="trash-2" size={15} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const pStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  left: { position: "relative" },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  connectedDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  model: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  stat: { fontSize: 12, fontFamily: "Inter_400Regular" },
  dot: { fontSize: 12 },
  actions: { alignItems: "center", gap: 8 },
  battery: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  connectBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function DevicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    devices,
    discoveredDevices,
    bluetoothState,
    isScanning,
    enableBluetooth,
    disableBluetooth,
    startScan,
    stopScan,
    pairDevice,
    connectDevice,
    removeDevice,
  } = useWatch();

  const [pairingId, setPairingId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const handleToggleBluetooth = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (bluetoothState === "enabled") {
      disableBluetooth();
    } else {
      enableBluetooth();
    }
  };

  const handleScan = async () => {
    if (isScanning) {
      stopScan();
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startScan();
  };

  const handlePair = async (disc: DiscoveredDevice) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPairingId(disc.id);
    await pairDevice(disc);
    setPairingId(null);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleConnect = async (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConnectingId(id);
    await connectDevice(id);
    setConnectingId(null);
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert(
      "Remove Watch",
      `Remove "${name}" from WearBridge? You'll need to pair it again to reconnect.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web")
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeDevice(id);
          },
        },
      ],
    );
  };

  const isBluetoothOn = bluetoothState === "enabled";
  const connectedDevices = devices.filter((d) => d.isConnected);
  const pairedNotConnected = devices.filter((d) => !d.isConnected);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Devices</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {devices.length} paired · {connectedDevices.length} connected
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 + bottomPad }]}
      >
        {/* Bluetooth toggle */}
        <View
          style={[
            styles.bluetoothCard,
            {
              backgroundColor: isBluetoothOn ? colors.blueLight : colors.card,
              borderColor: isBluetoothOn ? colors.primary : colors.border,
            },
          ]}
        >
          <View style={styles.btLeft}>
            <View
              style={[
                styles.btIcon,
                {
                  backgroundColor: isBluetoothOn ? colors.primary : colors.muted,
                },
              ]}
            >
              <Feather
                name="bluetooth"
                size={20}
                color={isBluetoothOn ? "#fff" : colors.mutedForeground}
              />
            </View>
            <View>
              <Text style={[styles.btTitle, { color: colors.foreground }]}>
                Bluetooth
              </Text>
              <Text style={[styles.btStatus, { color: isBluetoothOn ? colors.primary : colors.mutedForeground }]}>
                {isBluetoothOn ? "Enabled — ready to scan" : "Disabled — turn on to connect"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.btToggle,
              {
                backgroundColor: isBluetoothOn ? colors.primary : colors.muted,
              },
            ]}
            onPress={handleToggleBluetooth}
          >
            <Text style={[styles.btToggleText, { color: isBluetoothOn ? "#fff" : colors.mutedForeground }]}>
              {isBluetoothOn ? "On" : "Off"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scan button — only when BT is on */}
        {isBluetoothOn && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <TouchableOpacity
              style={[
                styles.scanBtn,
                {
                  backgroundColor: isScanning
                    ? colors.destructive + "15"
                    : colors.primary,
                  borderColor: isScanning ? colors.destructive : "transparent",
                },
              ]}
              onPress={handleScan}
            >
              {isScanning ? (
                <>
                  <ActivityIndicator size="small" color={colors.destructive} />
                  <Text style={[styles.scanBtnText, { color: colors.destructive }]}>
                    Stop Scanning
                  </Text>
                </>
              ) : (
                <>
                  <Feather name="search" size={18} color="#fff" />
                  <Text style={[styles.scanBtnText, { color: "#fff" }]}>
                    Scan for Wear OS Watches
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {isScanning && (
              <Animated.View
                entering={FadeIn}
                style={[styles.scanningBanner, { backgroundColor: colors.muted }]}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.scanningText, { color: colors.foreground }]}>
                  Searching nearby Wear OS devices via Bluetooth...
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Discovered devices */}
        {discoveredDevices.length > 0 && (
          <Animated.View layout={Layout} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Found Nearby
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.teal }]}>
                <Text style={styles.badgeText}>{discoveredDevices.length}</Text>
              </View>
            </View>
            {discoveredDevices.map((disc) => (
              <DiscoveredCard
                key={disc.id}
                device={disc}
                pairing={pairingId === disc.id}
                onPair={() => handlePair(disc)}
              />
            ))}
          </Animated.View>
        )}

        {/* Connected watches */}
        {connectedDevices.length > 0 && (
          <Animated.View layout={Layout} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Connected
            </Text>
            {connectedDevices.map((d) => (
              <PairedWatchRow
                key={d.id}
                device={d}
                connecting={connectingId === d.id}
                onConnect={() => handleConnect(d.id)}
                onRemove={() => handleRemove(d.id, d.name)}
              />
            ))}
          </Animated.View>
        )}

        {/* Previously paired — not connected */}
        {pairedNotConnected.length > 0 && (
          <Animated.View layout={Layout} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Saved Watches
            </Text>
            {pairedNotConnected.map((d) => (
              <PairedWatchRow
                key={d.id}
                device={d}
                connecting={connectingId === d.id}
                onConnect={() => handleConnect(d.id)}
                onRemove={() => handleRemove(d.id, d.name)}
              />
            ))}
          </Animated.View>
        )}

        {/* Empty states */}
        {!isBluetoothOn && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="bluetooth-off" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Bluetooth is off
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Turn on Bluetooth above to scan for and connect to your Wear OS watch
            </Text>
          </View>
        )}

        {isBluetoothOn && !isScanning && discoveredDevices.length === 0 && devices.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="watch" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No watches found
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Make sure your Wear OS watch has Bluetooth enabled and is within range, then tap Scan
            </Text>
          </View>
        )}

        {/* Info tip */}
        <View style={[styles.tip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={15} color={colors.mutedForeground} />
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
            Keep your Wear OS watch and iPhone within 10 meters during pairing. On the watch, accept the pairing request when prompted.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  bluetoothCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  btLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  btIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  btTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  btStatus: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  btToggle: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  btToggleText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  scanBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scanningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: -4,
  },
  scanningText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    minWidth: 22,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  tip: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
