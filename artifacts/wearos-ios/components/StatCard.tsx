import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
  unit?: string;
  color: string;
  bgColor: string;
}

export function StatCard({
  icon,
  value,
  label,
  unit,
  color,
  bgColor,
}: StatCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.card }, animStyle]}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
        {unit ? (
          <Text style={[styles.unit, { color: colors.mutedForeground }]}>{unit}</Text>
        ) : null}
      </View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  unit: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
