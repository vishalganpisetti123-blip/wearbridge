import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useWatch } from "@/context/WatchContext";

interface SettingRowProps {
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  description?: string;
  onPress?: () => void;
  showChevron?: boolean;
  valueText?: string;
}

function SettingRow({
  icon,
  iconColor,
  iconBg,
  label,
  description,
  onPress,
  showChevron,
  valueText,
}: SettingRowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.settingRow, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        )}
      </View>
      {valueText && (
        <Text style={[styles.valueText, { color: colors.mutedForeground }]}>
          {valueText}
        </Text>
      )}
      {showChevron && (
        <Feather
          name="chevron-right"
          size={18}
          color={colors.mutedForeground}
        />
      )}
    </TouchableOpacity>
  );
}

function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        {title}
      </Text>
      <View style={[styles.sectionCard, { borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { connectedDevice } = useWatch();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + bottomPad },
        ]}
      >
        {connectedDevice && (
          <View
            style={[styles.watchSummary, { backgroundColor: colors.navyDark }]}
          >
            <View
              style={[styles.watchDot, { backgroundColor: colors.success }]}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.watchSummaryName, { color: "#fff" }]}>
                {connectedDevice.name}
              </Text>
              <Text
                style={[
                  styles.watchSummaryModel,
                  { color: "rgba(255,255,255,0.5)" },
                ]}
              >
                {connectedDevice.model} · v{connectedDevice.firmwareVersion}
              </Text>
            </View>
            <View
              style={[
                styles.batteryBadge,
                { backgroundColor: "rgba(255,255,255,0.12)" },
              ]}
            >
              <Feather name="battery" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.batteryBadgeText}>
                {connectedDevice.batteryLevel === null
                  ? "—"
                  : `${connectedDevice.batteryLevel}%`}
              </Text>
            </View>
          </View>
        )}

        <SettingSection title="SYNC">
          <SettingRow
            icon="bell"
            iconColor={colors.primary}
            iconBg={colors.blueLight}
            label="Notification Sync"
            description="Requires an accessory-side Apple Notification Center Service client; ordinary iOS apps cannot read other apps' notifications"
            valueText="Not available"
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.border }]}
          />
          <SettingRow
            icon="activity"
            iconColor="#22c55e"
            iconBg="#dcfce7"
            label="Health Data Sync"
            description="Supported watch metrics stay on the watch and iPhone"
            valueText="Local BLE"
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.border }]}
          />
          <SettingRow
            icon="refresh-cw"
            iconColor="#8b5cf6"
            iconBg="#ede9fe"
            label="Sync Frequency"
            description="BLE updates arrive while the watch is connected"
            valueText="Live"
          />
        </SettingSection>

        <SettingSection title="ABOUT">
          <SettingRow
            icon="info"
            iconColor={colors.primary}
            iconBg={colors.blueLight}
            label="App Version"
            valueText="1.0.0"
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.border }]}
          />
          <SettingRow
            icon="shield"
            iconColor="#22c55e"
            iconBg="#dcfce7"
            label="Privacy Policy"
            showChevron
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.border }]}
          />
          <SettingRow
            icon="help-circle"
            iconColor="#8b5cf6"
            iconBg="#ede9fe"
            label="Help & Support"
            showChevron
          />
        </SettingSection>
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
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  watchSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  watchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  watchSummaryName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  watchSummaryModel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  batteryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  batteryBadgeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  settingDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  valueText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  rowDivider: {
    height: 0.5,
    marginLeft: 62,
  },
});
