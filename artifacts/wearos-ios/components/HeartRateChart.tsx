import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface HeartRateChartProps {
  heartRate: number;
}

const BARS = 12;

export function HeartRateChart({ heartRate }: HeartRateChartProps) {
  const colors = useColors();
  const anims = useRef(
    Array.from({ length: BARS }, () => new Animated.Value(Math.random())),
  ).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.random() * 0.7 + 0.3,
            duration: 400 + i * 80,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: Math.random() * 0.4 + 0.1,
            duration: 400 + i * 80,
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    animations.forEach((a) => a.start());
    pulseAnim.start();
    return () => {
      animations.forEach((a) => a.stop());
      pulseAnim.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {anims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor: colors.teal,
                opacity: 0.5 + i / BARS / 2,
                height: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["10%", "100%"],
                }),
              },
            ]}
          />
        ))}
      </View>
      <Animated.View
        style={[styles.valueOverlay, { transform: [{ scale: pulse }] }]}
      >
        <Text style={[styles.hrValue, { color: colors.foreground }]}>
          {heartRate}
        </Text>
        <Text style={[styles.hrUnit, { color: colors.teal }]}>bpm</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    flexDirection: "row",
    alignItems: "flex-end",
    position: "relative",
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: "100%",
  },
  bar: {
    flex: 1,
    borderRadius: 4,
  },
  valueOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  hrValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  hrUnit: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
