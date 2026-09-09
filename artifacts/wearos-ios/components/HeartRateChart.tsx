import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface HeartRateChartProps {
  heartRate: number | null;
}

/** Displays the latest real sample without inventing a historical chart. */
export function HeartRateChart({ heartRate }: HeartRateChartProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.tealLight }]}>
        <Feather name="activity" size={28} color={colors.teal} />
      </View>
      <View style={styles.valueGroup}>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {heartRate ?? "—"}
          </Text>
          {heartRate !== null && (
            <Text style={[styles.unit, { color: colors.teal }]}>bpm</Text>
          )}
        </View>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          {heartRate === null
            ? "Heart rate unavailable"
            : "Latest watch sample"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  valueGroup: { flex: 1, gap: 2 },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  value: { fontSize: 30, fontFamily: "Inter_700Bold" },
  unit: { fontSize: 13, fontFamily: "Inter_500Medium" },
  caption: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
