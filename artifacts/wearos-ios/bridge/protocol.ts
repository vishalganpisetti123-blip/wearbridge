export const BRIDGE_PROTOCOL_VERSION = 1;

export const WEARBRIDGE_SERVICE_UUID = "7f510001-1b15-4f0d-9c6e-2d92f1d5c001";
export const DEVICE_INFO_CHARACTERISTIC_UUID =
  "7f510002-1b15-4f0d-9c6e-2d92f1d5c001";
export const TELEMETRY_CHARACTERISTIC_UUID =
  "7f510003-1b15-4f0d-9c6e-2d92f1d5c001";
export const COMMAND_CHARACTERISTIC_UUID =
  "7f510004-1b15-4f0d-9c6e-2d92f1d5c001";

export interface BridgeDeviceInfo {
  version: number;
  watchId: string;
  model: string;
  displayName: string;
  firmwareVersion: string;
}

export interface BridgeTelemetry {
  version: number;
  heartRate?: number;
  steps?: number;
  calories?: number;
  distanceMeters?: number;
  activeMinutes?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  capturedAt?: number;
}

export type BridgeCommandType = "PING" | "SYNC_NOW";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("WearBridge sent an invalid JSON object");
  }
  return value as Record<string, unknown>;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function numberInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): number | undefined {
  const number = finiteNumber(value);
  return number !== undefined && number >= minimum && number <= maximum
    ? number
    : undefined;
}

export function parseDeviceInfo(json: string): BridgeDeviceInfo {
  const value = asRecord(JSON.parse(json));
  if (value.v !== BRIDGE_PROTOCOL_VERSION) {
    throw new Error(
      `Unsupported WearBridge protocol version: ${String(value.v)}`,
    );
  }
  if (typeof value.id !== "string" || !value.id.trim()) {
    throw new Error("WearBridge device info is missing its watch ID");
  }

  return {
    version: BRIDGE_PROTOCOL_VERSION,
    watchId: value.id,
    model: typeof value.m === "string" ? value.m : "Wear OS Watch",
    displayName: typeof value.n === "string" ? value.n : "WearBridge Watch",
    firmwareVersion: typeof value.fw === "string" ? value.fw : "Unknown",
  };
}

export function parseTelemetry(json: string): BridgeTelemetry {
  const value = asRecord(JSON.parse(json));
  if (value.v !== BRIDGE_PROTOCOL_VERSION) {
    throw new Error(
      `Unsupported WearBridge protocol version: ${String(value.v)}`,
    );
  }

  return {
    version: BRIDGE_PROTOCOL_VERSION,
    heartRate: numberInRange(value.hr, 20, 300),
    steps: numberInRange(value.s, 0, 1_000_000),
    calories: numberInRange(value.cal, 0, 100_000),
    distanceMeters: numberInRange(value.dm, 0, 1_000_000),
    activeMinutes: numberInRange(value.am, 0, 1_440),
    batteryLevel: numberInRange(value.b, 0, 100),
    isCharging:
      typeof value.c === "boolean"
        ? value.c
        : value.c === 1
          ? true
          : value.c === 0
            ? false
            : undefined,
    capturedAt: numberInRange(value.ts, 1, Number.MAX_SAFE_INTEGER),
  };
}

export function encodeCommand(type: BridgeCommandType, id: string): string {
  return JSON.stringify({ v: BRIDGE_PROTOCOL_VERSION, id, type });
}
