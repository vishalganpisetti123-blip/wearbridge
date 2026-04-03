import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
}

const STORAGE_KEY = "@wearbridge_devices_v2";
const SETTINGS_KEY = "@wearbridge_settings_v2";

const WatchContext = createContext<WatchContextType | null>(null);

const WEAR_OS_MODELS = [
  { model: "Galaxy Watch 6", prefix: "GW6" },
  { model: "Galaxy Watch 5 Pro", prefix: "GW5P" },
  { model: "Pixel Watch 2", prefix: "PW2" },
  { model: "TicWatch Pro 5", prefix: "TW5" },
  { model: "Fossil Gen 6", prefix: "FG6" },
  { model: "Mobvoi TicWatch", prefix: "MTC" },
];

function makeMac(): string {
  return Array.from({ length: 6 })
    .map(() =>
      Math.floor(Math.random() * 255)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase(),
    )
    .join(":");
}

function makeDiscovered(index: number): DiscoveredDevice {
  const entry = WEAR_OS_MODELS[index % WEAR_OS_MODELS.length];
  return {
    id: `disc_${Date.now()}_${index}`,
    name: `${entry.prefix}-${Math.floor(Math.random() * 9000) + 1000}`,
    model: entry.model,
    macAddress: makeMac(),
    rssi: -(Math.floor(Math.random() * 40) + 50),
    batteryLevel: Math.floor(Math.random() * 50) + 40,
  };
}

function makeApps() {
  return ["Messages", "Gmail", "WhatsApp", "Slack", "Calendar"];
}

function makePairedDevice(disc: DiscoveredDevice): WatchDevice {
  const apps = makeApps();
  const notifications: WatchNotification[] = Array.from({
    length: Math.floor(Math.random() * 4) + 1,
  }).map((_, i) => ({
    id: `notif_${disc.id}_${i}`,
    app: apps[Math.floor(Math.random() * apps.length)],
    title: `New message from ${["Alice", "Bob", "Carol", "David"][i % 4]}`,
    body: "Hey, are you free this afternoon for a quick call?",
    time: `${Math.floor(Math.random() * 59) + 1}m ago`,
    icon: "message-circle",
    unread: Math.random() > 0.4,
  }));

  return {
    id: disc.id,
    name: disc.model,
    model: disc.model,
    macAddress: disc.macAddress,
    isConnected: true,
    batteryLevel: disc.batteryLevel,
    lastSync: "Just now",
    firmwareVersion: `3.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
    heartRate: Math.floor(Math.random() * 30) + 62,
    steps: Math.floor(Math.random() * 5000) + 3000,
    calories: Math.floor(Math.random() * 300) + 200,
    distance: parseFloat((Math.random() * 4 + 1.5).toFixed(1)),
    activeMinutes: Math.floor(Math.random() * 40) + 20,
    sleepHours: parseFloat((Math.random() * 2 + 6).toFixed(1)),
    notifications,
    watchFace: ["Digital", "Analog", "Sport", "Minimal"][
      Math.floor(Math.random() * 4)
    ],
    isCharging: Math.random() > 0.8,
    rssi: disc.rssi,
  };
}

export function WatchProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<WatchDevice[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>("disabled");
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [healthSyncEnabled, setHealthSyncEnabled] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedDevices, savedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);
      if (savedDevices) setDevices(JSON.parse(savedDevices));
      if (savedSettings) {
        const s = JSON.parse(savedSettings);
        setNotificationsEnabled(s.notificationsEnabled ?? true);
        setHealthSyncEnabled(s.healthSyncEnabled ?? true);
        if (s.bluetoothEnabled) setBluetoothState("enabled");
      }
    } catch {}
  };

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
    setIsScanning(false);
    setDiscoveredDevices([]);
    saveSettings({ bluetoothEnabled: false });
  }, []);

  const startScan = useCallback(async () => {
    if (bluetoothState !== "enabled") return;
    setIsScanning(true);
    setDiscoveredDevices([]);

    // Simulate BLE discovery — devices appear one-by-one over ~4 seconds
    // In a production build with react-native-ble-plx this would be real BLE
    const alreadyPairedIds = new Set(devices.map((d) => d.macAddress));
    const count = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < count; i++) {
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
      const disc = makeDiscovered(i);
      // Don't rediscover already paired watches
      if (!alreadyPairedIds.has(disc.macAddress)) {
        setDiscoveredDevices((prev) => {
          const exists = prev.some((d) => d.id === disc.id);
          return exists ? prev : [...prev, disc];
        });
      }
    }
    setIsScanning(false);
  }, [bluetoothState, devices]);

  const stopScan = useCallback(() => {
    setIsScanning(false);
  }, []);

  const pairDevice = useCallback(
    async (discovered: DiscoveredDevice) => {
      // Simulate BLE pairing handshake
      await new Promise((r) => setTimeout(r, 2000));
      const paired = makePairedDevice(discovered);
      // Disconnect any existing connected device first
      const updated = [
        ...devices.map((d) => ({ ...d, isConnected: false })),
        paired,
      ];
      setDevices(updated);
      saveDevices(updated);
      // Remove from discovered list
      setDiscoveredDevices((prev) => prev.filter((d) => d.id !== discovered.id));
    },
    [devices],
  );

  const connectDevice = useCallback(
    async (id: string) => {
      await new Promise((r) => setTimeout(r, 1500));
      const updated = devices.map((d) => ({
        ...d,
        isConnected: d.id === id,
      }));
      setDevices(updated);
      saveDevices(updated);
    },
    [devices],
  );

  const disconnectDevice = useCallback(
    (id: string) => {
      const updated = devices.map((d) =>
        d.id === id ? { ...d, isConnected: false } : d,
      );
      setDevices(updated);
      saveDevices(updated);
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
      setIsSyncing(true);
      await new Promise((r) => setTimeout(r, 2000));
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
