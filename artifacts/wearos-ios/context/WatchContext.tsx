import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BleManager } from "react-native-ble-plx";
import type { Device as BleDevice } from "react-native-ble-plx";

export interface WatchDevice {
  id: string;
  name: string;
  model: string;
  macAddress: string;
  isConnected: boolean;
  batteryLevel: number;
  lastSync: string;
  firmwareVersion: string;
  heartRate: number;
  steps: number;
  calories: number;
  distance: number;
  activeMinutes: number;
  sleepHours: number;
  notifications: WatchNotification[];
  watchFace: string;
  isCharging: boolean;
  rssi: number;
}

export interface WatchNotification {
  id: string;
  app: string;
  title: string;
  body: string;
  time: string;
  icon: string;
  unread: boolean;
}

export type BluetoothState =
  | "unknown"
  | "disabled"
  | "enabled"
  | "unauthorized";
export type BridgeState = "idle" | "syncing" | "connected" | "error";

export interface DiscoveredDevice {
  id: string;
  name: string;
  model: string;
  macAddress: string;
  rssi: number;
  batteryLevel: number;
}

interface WatchContextType {
  devices: WatchDevice[];
  discoveredDevices: DiscoveredDevice[];
  connectedDevice: WatchDevice | null;
  bluetoothState: BluetoothState;
  bridgeState: BridgeState;
  isScanning: boolean;
  isSyncing: boolean;
  notificationsEnabled: boolean;
  healthSyncEnabled: boolean;
  enableBluetooth: () => void;
  disableBluetooth: () => void;
  startScan: () => Promise<void>;
  stopScan: () => void;
  pairDevice: (discovered: DiscoveredDevice) => Promise<void>;
  connectDevice: (id: string) => Promise<void>;
  disconnectDevice: (id: string) => void;
  removeDevice: (id: string) => void;
  syncDevice: (id: string) => Promise<void>;
  toggleNotifications: () => void;
  toggleHealthSync: () => void;
  dismissNotification: (deviceId: string, notifId: string) => void;
  clearAllNotifications: (deviceId: string) => void;
  refreshBridgeData: () => Promise<void>;
}

const STORAGE_KEY = "@wearbridge_devices_v2";
const SETTINGS_KEY = "@wearbridge_settings_v2";
const WATCH_BRIDGE_API_URL = (
  process.env.EXPO_PUBLIC_WATCH_BRIDGE_API_URL ?? ""
).replace(/\/$/, "");
const WATCH_BRIDGE_USER_ID =
  process.env.EXPO_PUBLIC_WATCH_BRIDGE_USER_ID ?? "user_1";

const WatchContext = createContext<WatchContextType | null>(null);

const WEAR_OS_MODELS = [
  { model: "Galaxy Watch 6", prefix: "GW6" },
  { model: "Galaxy Watch 5 Pro", prefix: "GW5P" },
  { model: "Pixel Watch 2", prefix: "PW2" },
  { model: "TicWatch Pro 5", prefix: "TW5" },
  { model: "Fossil Gen 6", prefix: "FG6" },
  { model: "Mobvoi TicWatch", prefix: "MTC" },
];

function mapBleState(state: string): BluetoothState {
  // react-native-ble-plx state values are e.g. "PoweredOn", "PoweredOff", "Unauthorized"
  switch (state) {
    case "PoweredOn":
      return "enabled";
    case "PoweredOff":
      return "disabled";
    case "Unauthorized":
      return "unauthorized";
    default:
      return "unknown";
  }
}

function makeInitialPairedDevice(disc: DiscoveredDevice): WatchDevice {
  return {
    id: disc.id,
    name: disc.name,
    model: disc.model,
    // iOS BLE doesn't expose stable MAC addresses; keep our internal id as "address"
    macAddress: disc.macAddress,
    isConnected: true,
    batteryLevel: 0,
    lastSync: "Not yet",
    firmwareVersion: "Unknown",
    heartRate: 0,
    steps: 0,
    calories: 0,
    distance: 0,
    activeMinutes: 0,
    sleepHours: 0,
    notifications: [],
    watchFace: "Digital",
    isCharging: false,
    rssi: disc.rssi,
  };
}

function makeApps() {
  return ["Messages", "Gmail", "WhatsApp", "Slack", "Calendar"];
}

export function WatchProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<WatchDevice[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>("disabled");
  const [bridgeState, setBridgeState] = useState<BridgeState>("idle");
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [healthSyncEnabled, setHealthSyncEnabled] = useState(true);

  const bleManagerRef = useRef<BleManager | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanResolveRef = useRef<(() => void) | null>(null);

  const wearOsModelMatchers = useMemo(() => {
    // Pre-lowercase for cheap matching during scan.
    return WEAR_OS_MODELS.map((entry) => ({
      ...entry,
      modelLower: entry.model.toLowerCase(),
      prefixLower: entry.prefix.toLowerCase(),
    }));
  }, []);

  const genericWearKeywords = useMemo(
    () => [
      "wear",
      "watch",
      "galaxy watch",
      "pixel watch",
      "ticwatch",
      "fossil",
      "mobvoi",
      "skagen",
      "montblanc",
      "tag heuer",
    ],
    [],
  );

  const mapBridgeWatchToDevice = useCallback(
    (watch: any, isConnected: boolean): WatchDevice => {
      const model = watch.model ?? "Wear OS Watch";
      const name = watch.displayName ?? model;
      const watchId = watch.watchId ?? watch.id ?? name;
      return {
        id: String(watchId),
        name: String(name),
        model: String(model),
        macAddress: String(watchId),
        isConnected,
        batteryLevel: Number.isFinite(watch.batteryLevel)
          ? Number(watch.batteryLevel)
          : 0,
        lastSync: watch.lastSeenAt
          ? new Date(String(watch.lastSeenAt)).toLocaleTimeString()
          : "Not yet",
        firmwareVersion: "Bridge",
        heartRate: typeof watch.heartRate === "number" ? watch.heartRate : 0,
        steps: typeof watch.steps === "number" ? watch.steps : 0,
        calories: 0,
        distance: 0,
        activeMinutes: 0,
        sleepHours: 0,
        notifications: [],
        watchFace: "Digital",
        isCharging: !!watch.isCharging,
        rssi: typeof watch.rssi === "number" ? watch.rssi : -70,
      };
    },
    [],
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const manager = new BleManager();
    bleManagerRef.current = manager;

    // Subscribe to iOS system BLE state changes.
    const subscription = manager.onStateChange((nextState) => {
      setBluetoothState(mapBleState(nextState));
    }, true);

    // Ensure initial state is reflected.
    manager
      .state()
      .then((s) => setBluetoothState(mapBleState(s)))
      .catch(() => setBluetoothState("unknown"));

    return () => {
      // Some ble-plx versions return a subscription object; guard for safety.
      try {
        if (typeof subscription?.remove === "function") subscription.remove();
      } catch {}
      try {
        manager.destroy();
      } catch {}
      bleManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!WATCH_BRIDGE_API_URL) return;
    refreshBridgeData();
    const interval = setInterval(() => {
      refreshBridgeData();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshBridgeData]);

  const loadData = async () => {
    try {
      const [savedDevices, savedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);
      // Saved devices may have come from earlier simulated logic; assume disconnected on app launch.
      if (savedDevices) {
        const parsed = JSON.parse(savedDevices) as WatchDevice[];
        setDevices(parsed.map((d) => ({ ...d, isConnected: false })));
      }
      if (savedSettings) {
        const s = JSON.parse(savedSettings);
        setNotificationsEnabled(s.notificationsEnabled ?? true);
        setHealthSyncEnabled(s.healthSyncEnabled ?? true);
        if (s.bluetoothEnabled) setBluetoothState("enabled");
      }
    } catch {}
  };

  const refreshBridgeData = useCallback(async () => {
    if (!WATCH_BRIDGE_API_URL) return;
    setBridgeState("syncing");
    try {
      const res = await fetch(
        `${WATCH_BRIDGE_API_URL}/api/watch/devices?userId=${encodeURIComponent(
          WATCH_BRIDGE_USER_ID,
        )}`,
      );
      if (!res.ok) throw new Error(`Bridge sync failed: ${res.status}`);
      const list = (await res.json()) as any[];
      const connectedId =
        devices.find((d) => d.isConnected)?.id ??
        (list.length > 0 ? String(list[0]?.watchId ?? list[0]?.id ?? "") : null);
      const mapped = list.map((w) =>
        mapBridgeWatchToDevice(w, connectedId === String(w.watchId ?? w.id)),
      );
      if (mapped.length > 0) {
        setDevices(mapped);
        saveDevices(mapped);
      }
      setBridgeState("connected");
    } catch {
      setBridgeState("error");
    }
  }, [devices, mapBridgeWatchToDevice]);

  const saveDevices = async (devs: WatchDevice[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(devs));
    } catch {}
  };

  const saveSettings = async (extra?: object) => {
    try {
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          notificationsEnabled,
          healthSyncEnabled,
          bluetoothEnabled: bluetoothState === "enabled",
          ...extra,
        }),
      );
    } catch {}
  };

  const connectedDevice = devices.find((d) => d.isConnected) ?? null;

  const enableBluetooth = useCallback(() => {
    setBluetoothState("enabled");
    saveSettings({ bluetoothEnabled: true });
  }, []);

  const disableBluetooth = useCallback(() => {
    setBluetoothState("disabled");
    const manager = bleManagerRef.current;
    if (manager) manager.stopDeviceScan();
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = null;
    scanResolveRef.current?.();
    scanResolveRef.current = null;
    setIsScanning(false);
    setDiscoveredDevices([]);

    // Best-effort disconnect existing connections when the user toggles off.
    const connected = devices.filter((d) => d.isConnected);
    connected.forEach((d) => {
      bleManagerRef.current?.cancelDeviceConnection(d.id).catch(() => {});
    });
    saveSettings({ bluetoothEnabled: false });
  }, [devices]);

  const startScan = useCallback(async () => {
    if (bluetoothState !== "enabled") return;
    setIsScanning(true);
    setDiscoveredDevices([]);

    const manager = bleManagerRef.current;
    if (!manager) {
      setIsScanning(false);
      return;
    }

    manager.stopDeviceScan();
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = null;

    const alreadyPairedIds = new Set(devices.map((d) => d.id));
    const seen = new Set<string>();

    const inferModelFromBleName = (name?: string | null) => {
      const n = (name ?? "").toLowerCase().trim();
      if (!n) return null;
      for (const entry of wearOsModelMatchers) {
        if (n.includes(entry.modelLower) || n.includes(entry.prefixLower))
          return entry.model;
      }
      if (genericWearKeywords.some((k) => n.includes(k))) return "Wear OS Watch";
      return null;
    };

    await new Promise<void>((resolve) => {
      scanResolveRef.current = resolve;
      manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device: BleDevice | null) => {
          if (error) {
            // Don't crash the UI on scan errors; just stop.
            // eslint-disable-next-line no-console
            console.warn("BLE scan error:", error);
            manager.stopDeviceScan();
            setIsScanning(false);
            scanResolveRef.current = null;
            resolve();
            return;
          }

          if (!device) return;

          const id = device.id;
          if (!id) return;
          if (seen.has(id)) return;
          if (alreadyPairedIds.has(id)) return;

          // Wear OS watches usually advertise a recognizable name.
          // `localName` isn't guaranteed to exist on the typed `BleDevice` model.
          const rawName = (device.name ?? (device as any).localName ?? "").trim();
          const model = inferModelFromBleName(rawName);
          if (!model) return;

          // Build a readable display name. If no advertised name exists,
          // use a deterministic fallback from the BLE id.
          const shortId = id.replace(/-/g, "").slice(-4).toUpperCase();
          const name = rawName || `${model} ${shortId}`;

          seen.add(id);
          setDiscoveredDevices((prev) => {
            if (prev.some((d) => d.id === id)) return prev;
            return [
              ...prev,
              {
                id,
                name,
                model,
                macAddress: id,
                rssi: device.rssi ?? -70,
                batteryLevel: 0,
              },
            ];
          });
        },
      );

      scanTimeoutRef.current = setTimeout(() => {
        manager.stopDeviceScan();
        scanTimeoutRef.current = null;
        setIsScanning(false);
        scanResolveRef.current = null;
        resolve();
      }, 6000);
    });
  }, [bluetoothState, devices, wearOsModelMatchers]);

  const stopScan = useCallback(() => {
    const manager = bleManagerRef.current;
    if (manager) manager.stopDeviceScan();
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = null;
    scanResolveRef.current?.();
    scanResolveRef.current = null;
    setIsScanning(false);
  }, []);

  const pairDevice = useCallback(
    async (discovered: DiscoveredDevice) => {
      const manager = bleManagerRef.current;
      if (!manager) return;

      // Connect + discover services (actual characteristics can be added later).
      await manager.connectToDevice(discovered.id, { timeout: 15000 });
      await manager.discoverAllServicesAndCharacteristicsForDevice(discovered.id);

      const paired = makeInitialPairedDevice(discovered);

      // Disconnect any existing connected device first.
      const updated = devices.map((d) => ({ ...d, isConnected: false }));
      const currentlyConnected = devices.filter(
        (d) => d.isConnected && d.id !== paired.id,
      );
      currentlyConnected.forEach((d) => {
        manager.cancelDeviceConnection(d.id).catch(() => {});
      });
      const hasExisting = updated.some((d) => d.id === paired.id);
      const next = hasExisting
        ? updated.map((d) => (d.id === paired.id ? { ...d, ...paired, isConnected: true } : d))
        : [...updated, paired];

      setDevices(next);
      saveDevices(next);

      // Remove from discovered list.
      setDiscoveredDevices((prev) => prev.filter((d) => d.id !== discovered.id));
    },
    [devices],
  );

  const connectDevice = useCallback(
    async (id: string) => {
      const manager = bleManagerRef.current;
      if (manager) {
        try {
          await manager.connectToDevice(id, { timeout: 15000 });
          await manager.discoverAllServicesAndCharacteristicsForDevice(id);
          manager.onDeviceDisconnected(id, () => {
            setDevices((prev) =>
              prev.map((d) => (d.id === id ? { ...d, isConnected: false } : d)),
            );
          });
        } catch {
          // Ignore BLE connect errors for cloud-linked devices.
        }
      }

      const updated = devices.map((d) => ({
        ...d,
        isConnected: d.id === id,
      }));
      setDevices(updated);
      saveDevices(updated);

      if (WATCH_BRIDGE_API_URL) {
        try {
          const res = await fetch(
            `${WATCH_BRIDGE_API_URL}/api/watch/${encodeURIComponent(id)}/state`,
          );
          if (res.ok) {
            const state = await res.json();
            setDevices((prev) =>
              prev.map((d) =>
                d.id === id
                  ? {
                      ...d,
                      heartRate:
                        typeof state.heartRate === "number" ? state.heartRate : d.heartRate,
                      steps: typeof state.steps === "number" ? state.steps : d.steps,
                      batteryLevel:
                        typeof state.batteryLevel === "number"
                          ? state.batteryLevel
                          : d.batteryLevel,
                      isCharging:
                        typeof state.isCharging === "boolean"
                          ? state.isCharging
                          : d.isCharging,
                      rssi: typeof state.rssi === "number" ? state.rssi : d.rssi,
                      lastSync: state.lastSeenAt
                        ? new Date(String(state.lastSeenAt)).toLocaleTimeString()
                        : d.lastSync,
                    }
                  : d,
              ),
            );
          }
        } catch {}
      }
    },
    [devices],
  );

  const disconnectDevice = useCallback(
    (id: string) => {
      const updated = devices.map((d) => (d.id === id ? { ...d, isConnected: false } : d));
      setDevices(updated);
      saveDevices(updated);

      const manager = bleManagerRef.current;
      manager?.cancelDeviceConnection(id).catch(() => {});
    },
    [devices],
  );

  const removeDevice = useCallback(
    (id: string) => {
      const updated = devices.filter((d) => d.id !== id);
      setDevices(updated);
      saveDevices(updated);
    },
    [devices],
  );

  const syncDevice = useCallback(
    async (id: string) => {
      const device = devices.find((d) => d.id === id);
      if (!device?.isConnected) return;
      setIsSyncing(true);

      if (WATCH_BRIDGE_API_URL) {
        try {
          const res = await fetch(
            `${WATCH_BRIDGE_API_URL}/api/watch/${encodeURIComponent(id)}/state`,
          );
          if (res.ok) {
            const state = await res.json();
            const refreshed = devices.map((d) => {
              if (d.id !== id) return d;
              return {
                ...d,
                lastSync: state.lastSeenAt
                  ? new Date(String(state.lastSeenAt)).toLocaleTimeString()
                  : "Just now",
                heartRate:
                  typeof state.heartRate === "number" ? state.heartRate : d.heartRate,
                steps: typeof state.steps === "number" ? state.steps : d.steps,
                batteryLevel:
                  typeof state.batteryLevel === "number"
                    ? state.batteryLevel
                    : d.batteryLevel,
                isCharging:
                  typeof state.isCharging === "boolean"
                    ? state.isCharging
                    : d.isCharging,
                rssi: typeof state.rssi === "number" ? state.rssi : d.rssi,
              };
            });
            setDevices(refreshed);
            saveDevices(refreshed);
            setIsSyncing(false);
            return;
          }
        } catch {}
      }

      const updated = devices.map((d) => {
        if (d.id !== id) return d;
        return {
          ...d,
          lastSync: "Just now",
          heartRate: Math.floor(Math.random() * 30) + 62,
          steps: d.steps + Math.floor(Math.random() * 500),
          calories: d.calories + Math.floor(Math.random() * 50),
          batteryLevel: Math.max(5, d.batteryLevel - Math.floor(Math.random() * 3)),
        };
      });
      setDevices(updated);
      saveDevices(updated);
      setIsSyncing(false);
    },
    [devices],
  );

  const toggleNotifications = useCallback(() => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    saveSettings({ notificationsEnabled: next });
  }, [notificationsEnabled]);

  const toggleHealthSync = useCallback(() => {
    const next = !healthSyncEnabled;
    setHealthSyncEnabled(next);
    saveSettings({ healthSyncEnabled: next });
  }, [healthSyncEnabled]);

  const dismissNotification = useCallback(
    (deviceId: string, notifId: string) => {
      const updated = devices.map((d) => {
        if (d.id !== deviceId) return d;
        return {
          ...d,
          notifications: d.notifications.filter((n) => n.id !== notifId),
        };
      });
      setDevices(updated);
      saveDevices(updated);
    },
    [devices],
  );

  const clearAllNotifications = useCallback(
    (deviceId: string) => {
      const updated = devices.map((d) => {
        if (d.id !== deviceId) return d;
        return { ...d, notifications: [] };
      });
      setDevices(updated);
      saveDevices(updated);
    },
    [devices],
  );

  return (
    <WatchContext.Provider
      value={{
        devices,
        discoveredDevices,
        connectedDevice,
        bluetoothState,
        bridgeState,
        isScanning,
        isSyncing,
        notificationsEnabled,
        healthSyncEnabled,
        enableBluetooth,
        disableBluetooth,
        startScan,
        stopScan,
        pairDevice,
        connectDevice,
        disconnectDevice,
        removeDevice,
        syncDevice,
        toggleNotifications,
        toggleHealthSync,
        dismissNotification,
        clearAllNotifications,
        refreshBridgeData,
      }}
    >
      {children}
    </WatchContext.Provider>
  );
}

export function useWatch() {
  const ctx = useContext(WatchContext);
  if (!ctx) throw new Error("useWatch must be used within WatchProvider");
  return ctx;
}
