import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const watchDevices = pgTable(
  "watch_devices",
  {
    watchId: text("watch_id").primaryKey(),
    userId: text("user_id").notNull(),
    model: text("model").notNull(),
    displayName: text("display_name").notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    batteryLevel: integer("battery_level").notNull().default(0),
    isCharging: boolean("is_charging").notNull().default(false),
    heartRate: integer("heart_rate"),
    steps: integer("steps"),
    rssi: integer("rssi"),
  },
  (t) => [index("watch_devices_user_id_idx").on(t.userId)],
);

export const watchCommands = pgTable("watch_commands", {
  id: uuid("id").primaryKey().defaultRandom(),
  watchId: text("watch_id")
    .notNull()
    .references(() => watchDevices.watchId, { onDelete: "cascade" }),
  type: text("type").notNull(),
  params: jsonb("params").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ackedAt: timestamp("acked_at", { withTimezone: true }),
});

export type WatchDeviceRow = typeof watchDevices.$inferSelect;
export type WatchCommandRow = typeof watchCommands.$inferSelect;
