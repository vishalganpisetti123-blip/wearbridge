import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { WatchNotification } from "@/context/WatchContext";

interface NotificationItemProps {
  notification: WatchNotification;
  onDismiss: () => void;
}

const APP_COLORS: Record<string, string> = {
  Messages: "#34c759",
  Gmail: "#ea4335",
  WhatsApp: "#25d366",
  Slack: "#611f69",
  Calendar: "#0061fe",
  Maps: "#ff9500",
};

export function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const colors = useColors();
  const appColor = APP_COLORS[notification.app] ?? colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: notification.unread ? appColor + "40" : colors.border,
        },
      ]}
    >
      {notification.unread && (
        <View style={[styles.unreadDot, { backgroundColor: appColor }]} />
      )}
      <View style={[styles.appIcon, { backgroundColor: appColor + "20" }]}>
        <Feather name="message-circle" size={16} color={appColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.app, { color: appColor }]}>{notification.app}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {notification.time}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={8}>
        <Feather name="x" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    position: "relative",
    overflow: "hidden",
  },
  unreadDot: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  app: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  body: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  dismissBtn: {
    paddingTop: 2,
  },
});
