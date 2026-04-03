import { randomUUID } from "crypto";
import { Router, type IRouter } from "express";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@workspace/db";
import {
  watchCommands,
  watchDevices,
  type WatchDeviceRow,
} from "@workspace/db/schema";

interface WatchState {
  watchId: string;
  userId: string;
  model: string;
  displayName: string;
  lastSeenAt: string;
  batteryLevel: number;
  isCharging: boolean;
  heartRate: number | null;
  steps: number | null;
  rssi: number | null;
}

type WatchCommandType = "SYNC_NOW" | "SET_DND" | "SET_WATCHFACE";

interface WatchCommandPayload {
  type: WatchCommandType;
  params?: Record<string, unknown>;
}

interface WatchCommand extends WatchCommandPayload {
  id: string;
  watchId: string;
  createdAt: string;
  ackedAt?: string;
}

const watches = new Map<string, WatchState>();
const userIndex = new Map<string, Set<string>>();
const commandQueues = new Map<string, WatchCommand[]>();

const router: IRouter = Router();

function rowToState(row: WatchDeviceRow): WatchState {
  const last = row.lastSeenAt;
  return {
    watchId: row.watchId,
    userId: row.userId,
    model: row.model,
    displayName: row.displayName,
    lastSeenAt: last instanceof Date ? last.toISOString() : String(last),
    batteryLevel: row.batteryLevel,
    isCharging: row.isCharging,
    heartRate: row.heartRate,
    steps: row.steps,
    rssi: row.rssi,
  };
}

function commandRowToApi(row: {
  id: string;
  watchId: string;
  type: string;
  params: Record<string, unknown> | null;
  createdAt: Date;
  ackedAt: Date | null;
}): WatchCommand {
  return {
    id: row.id,
    watchId: row.watchId,
    type: row.type as WatchCommandType,
    params: row.params ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    ackedAt: row.ackedAt
      ? row.ackedAt instanceof Date
        ? row.ackedAt.toISOString()
        : String(row.ackedAt)
      : undefined,
  };
}

// Register or update a watch for a user
router.post("/watch/register", async (req, res) => {
  const { watchId, userId, model, displayName } = req.body ?? {};
  if (!watchId || !userId) {
    return res.status(400).json({ error: "watchId and userId are required" });
  }

  const now = new Date();

  if (db) {
    const [existing] = await db
      .select()
      .from(watchDevices)
      .where(eq(watchDevices.watchId, watchId))
      .limit(1);
    const nextModel = model ?? existing?.model ?? "Wear OS Watch";
    const nextDisplay =
      displayName ?? existing?.displayName ?? model ?? "Wear OS Watch";

    await db
      .insert(watchDevices)
      .values({
        watchId,
        userId,
        model: nextModel,
        displayName: nextDisplay,
        lastSeenAt: now,
        batteryLevel: existing?.batteryLevel ?? 0,
        isCharging: existing?.isCharging ?? false,
        heartRate: existing?.heartRate ?? null,
        steps: existing?.steps ?? null,
        rssi: existing?.rssi ?? null,
      })
      .onConflictDoUpdate({
        target: watchDevices.watchId,
        set: {
          userId,
          model: nextModel,
          displayName: nextDisplay,
          lastSeenAt: now,
        },
      });

    const [row] = await db
      .select()
      .from(watchDevices)
      .where(eq(watchDevices.watchId, watchId))
      .limit(1);
    if (!row) return res.status(500).json({ error: "failed to load watch" });
    return res.json(rowToState(row));
  }

  const existing = watches.get(watchId);
  const next: WatchState = {
    watchId,
    userId,
    model: model ?? existing?.model ?? "Wear OS Watch",
    displayName: displayName ?? existing?.displayName ?? model ?? "Wear OS Watch",
    lastSeenAt: now.toISOString(),
    batteryLevel: existing?.batteryLevel ?? 0,
    isCharging: existing?.isCharging ?? false,
    heartRate: existing?.heartRate ?? null,
    steps: existing?.steps ?? null,
    rssi: existing?.rssi ?? null,
  };

  watches.set(watchId, next);

  let set = userIndex.get(userId);
  if (!set) {
    set = new Set<string>();
    userIndex.set(userId, set);
  }
  set.add(watchId);

  return res.json(next);
});

// Ingest telemetry from watch
router.post("/watch/telemetry", async (req, res) => {
  const {
    watchId,
    userId,
    model,
    displayName,
    heartRate,
    steps,
    batteryLevel,
    isCharging,
    rssi,
  } = req.body ?? {};

  if (!watchId || !userId) {
    return res.status(400).json({ error: "watchId and userId are required" });
  }

  const now = new Date();

  if (db) {
    const [existing] = await db
      .select()
      .from(watchDevices)
      .where(eq(watchDevices.watchId, watchId))
      .limit(1);
    if (!existing) {
      return res.status(404).json({ error: "watch not registered" });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ error: "watch does not belong to this user" });
    }

    await db
      .update(watchDevices)
      .set({
        model: model ?? existing.model,
        displayName: displayName ?? existing.displayName,
        lastSeenAt: now,
        batteryLevel:
          typeof batteryLevel === "number" ? batteryLevel : existing.batteryLevel,
        isCharging:
          typeof isCharging === "boolean" ? isCharging : existing.isCharging,
        heartRate: typeof heartRate === "number" ? heartRate : existing.heartRate,
        steps: typeof steps === "number" ? steps : existing.steps,
        rssi: typeof rssi === "number" ? rssi : existing.rssi,
      })
      .where(eq(watchDevices.watchId, watchId));

    const [row] = await db
      .select()
      .from(watchDevices)
      .where(eq(watchDevices.watchId, watchId))
      .limit(1);
    if (!row) return res.status(500).json({ error: "failed to load watch" });
    return res.json(rowToState(row));
  }

  const existing = watches.get(watchId);
  if (!existing) {
    return res.status(404).json({ error: "watch not registered" });
  }
  if (existing.userId !== userId) {
    return res.status(403).json({ error: "watch does not belong to this user" });
  }

  const updated: WatchState = {
    ...existing,
    model: model ?? existing.model,
    displayName: displayName ?? existing.displayName,
    lastSeenAt: now.toISOString(),
    batteryLevel: typeof batteryLevel === "number" ? batteryLevel : existing.batteryLevel,
    isCharging: typeof isCharging === "boolean" ? isCharging : existing.isCharging,
    heartRate: typeof heartRate === "number" ? heartRate : existing.heartRate,
    steps: typeof steps === "number" ? steps : existing.steps,
    rssi: typeof rssi === "number" ? rssi : existing.rssi,
  };

  watches.set(watchId, updated);
  return res.json(updated);
});

// List watches for a user
router.get("/watch/devices", async (req, res) => {
  const userId = req.query["userId"];
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId query param is required" });
  }

  if (db) {
    const rows = await db
      .select()
      .from(watchDevices)
      .where(eq(watchDevices.userId, userId));
    return res.json(rows.map(rowToState));
  }

  const ids = userIndex.get(userId);
  if (!ids) return res.json([]);

  const result = Array.from(ids)
    .map((id) => watches.get(id))
    .filter((w): w is WatchState => !!w);

  return res.json(result);
});

// Get latest state for a specific watch
router.get("/watch/:watchId/state", async (req, res) => {
  const { watchId } = req.params;

  if (db) {
    const [row] = await db
      .select()
      .from(watchDevices)
      .where(eq(watchDevices.watchId, watchId))
      .limit(1);
    if (!row) return res.status(404).json({ error: "watch not found" });
    return res.json(rowToState(row));
  }

  const state = watches.get(watchId);
  if (!state) return res.status(404).json({ error: "watch not found" });
  return res.json(state);
});

// Enqueue a command from iOS → watch
router.post("/watch/:watchId/commands", async (req, res) => {
  const { watchId } = req.params;
  const { type, params, userId } = req.body ?? {};

  if (!type) {
    return res.status(400).json({ error: "type is required" });
  }

  if (db) {
    const [state] = await db
      .select()
      .from(watchDevices)
      .where(eq(watchDevices.watchId, watchId))
      .limit(1);
    if (!state) return res.status(404).json({ error: "watch not found" });
    if (userId && state.userId !== userId) {
      return res.status(403).json({ error: "watch does not belong to this user" });
    }

    const [inserted] = await db
      .insert(watchCommands)
      .values({
        watchId,
        type,
        params: params ?? null,
      })
      .returning();

    if (!inserted) return res.status(500).json({ error: "failed to create command" });
    return res.status(201).json(commandRowToApi(inserted));
  }

  const state = watches.get(watchId);
  if (!state) return res.status(404).json({ error: "watch not found" });
  if (userId && state.userId !== userId) {
    return res.status(403).json({ error: "watch does not belong to this user" });
  }

  const cmd: WatchCommand = {
    id: randomUUID(),
    watchId,
    type,
    params,
    createdAt: new Date().toISOString(),
  };

  const queue = commandQueues.get(watchId) ?? [];
  queue.push(cmd);
  commandQueues.set(watchId, queue);

  return res.status(201).json(cmd);
});

// Wear OS app polls for pending commands
router.get("/watch/:watchId/commands/pending", async (req, res) => {
  const { watchId } = req.params;

  if (db) {
    const rows = await db
      .select()
      .from(watchCommands)
      .where(and(eq(watchCommands.watchId, watchId), isNull(watchCommands.ackedAt)));
    return res.json(rows.map(commandRowToApi));
  }

  const queue = commandQueues.get(watchId) ?? [];
  const pending = queue.filter((c) => !c.ackedAt);
  return res.json(pending);
});

// Wear OS app acknowledges a command
router.post("/watch/:watchId/commands/:commandId/ack", async (req, res) => {
  const { watchId, commandId } = req.params;
  const ackTime = new Date();

  if (db) {
    const updated = await db
      .update(watchCommands)
      .set({ ackedAt: ackTime })
      .where(
        and(eq(watchCommands.id, commandId), eq(watchCommands.watchId, watchId)),
      )
      .returning();

    const row = updated[0];
    if (!row) return res.status(404).json({ error: "command not found" });
    return res.json(commandRowToApi(row));
  }

  const queue = commandQueues.get(watchId) ?? [];
  const idx = queue.findIndex((c) => c.id === commandId && c.watchId === watchId);
  if (idx === -1) return res.status(404).json({ error: "command not found" });

  const existing = queue[idx]!;
  const next: WatchCommand = { ...existing, ackedAt: ackTime.toISOString() };
  queue[idx] = next;
  commandQueues.set(watchId, queue);

  return res.json(next);
});

export default router;
