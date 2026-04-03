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

interface WatchContextType {
  devices: WatchDevice[];
  connectedDevice: WatchDevice | null;
  isScanning: boolean;
  isSyncing: boolean;
  notificationsEnabled: boolean;
  healthSyncEnabled: boolean;
  darkMode: boolean;
  addDevice: (device: WatchDevice) => void;
  removeDevice: (id: string) => void;
  connectDevice: (id: string) => Promise<void>;
  disconnectDevice: (id: string) => void;
  syncDevice: (id: string) => Promise<void>;
  startScan: () => Promise<void>;
  stopScan: () => void;
  toggleNotifications: () => void;
  toggleHealthSync: () => void;
  toggleDarkMode: () => void;
  dismissNotification: (deviceId: string, notifId: string) => void;
  clearAllNotifications: (deviceId: string) => void;
}

const STORAGE_KEY = "@wearbridge_devices";
const SETTINGS_KEY = "@wearbridge_settings";

const WatchContext = createContext<WatchContextType | null>(null);

const MOCK_WATCH_MODELS = [
  "Galaxy Watch 6",
  "Galaxy Watch 5 Pro",
  "Pixel Watch 2",
  "TicWatch Pro 5",
  "Fossil Gen 6",
];

function generateMockDevice(index: number): WatchDevice {
  const model = MOCK_WATCH_MODELS[index % MOCK_WATCH_MODELS.length];
  const apps = ["Messages", "Gmail", "WhatsApp", "Slack", "Calendar", "Maps"];
  const notifications: WatchNotification[] = Array.from({
    length: Math.floor(Math.random() * 4) + 1,
  }).map((_, i) => ({
    id: `notif_${index}_${i}`,
    app: apps[Math.floor(Math.random() * apps.length)],
    title: `New message from ${["Alice", "Bob", "Carol", "David"][i % 4]}`,
    body: "Hey, are you free this afternoon?",
    time: `${Math.floor(Math.random() * 59) + 1}m ago`,
    icon: "message-circle",
    unread: Math.random() > 0.4,
  }));

  return {
    id: `device_${Date.now()}_${index}`,
    name: `My ${model}`,
    model,
    macAddress: Array.from({ length: 6 })
      .map(() =>
        Math.floor(Math.random() * 255)
          .toString(16)
          .padStart(2, "0")
          .toUpperCase(),
      )
      .join(":"),
    isConnected: index === 0,
    batteryLevel: Math.floor(Math.random() * 60) + 40,
    lastSync: "Just now",
    firmwareVersion: `3.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
    heartRate: Math.floor(Math.random() * 30) + 62,
    steps: Math.floor(Math.random() * 5000) + 3000,
    calories: Math.floor(Math.random() * 300) + 200,
    distance: parseFloat((Math.random() * 4 + 1.5).toFixed(1)),
    activeMinutes: Math.floor(Math.random() * 40) + 20,
    sleepHours: parseFloat((Math.random() * 2 + 6).toFixed(1)),
    notifications,
    watchFace: ["Digital", "Analog", "Sport", "Minimal"][index % 4],
    isCharging: Math.random() > 0.8,
  };
}

export function WatchProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<WatchDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [healthSyncEnabled, setHealthSyncEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedDevices, savedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);
      if (savedDevices) {
        setDevices(JSON.parse(savedDevices));
      }
      if (savedSettings) {
        const s = JSON.parse(savedSettings);
        setNotificationsEnabled(s.notificationsEnabled ?? true);
        setHealthSyncEnabled(s.healthSyncEnabled ?? true);
        setDarkMode(s.darkMode ?? false);
      }
    } catch {}
  };

  const saveDevices = async (devs: WatchDevice[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(devs));
    } catch {}
  };

  const saveSettings = async (settings: object) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  };

  const connectedDevice = devices.find((d) => d.isConnected) ?? null;

  const addDevice = useCallback(
    (device: WatchDevice) => {
      const updated = [...devices, device];
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

  const startScan = useCallback(async () => {
    setIsScanning(true);
    await new Promise((r) => setTimeout(r, 3000));
    const newDevice = generateMockDevice(devices.length);
    const updated = [...devices, newDevice];
    setDevices(updated);
    saveDevices(updated);
    setIsScanning(false);
  }, [devices]);

  const stopScan = useCallback(() => {
    setIsScanning(false);
  }, []);

  const toggleNotifications = useCallback(() => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    saveSettings({ notificationsEnabled: next, healthSyncEnabled, darkMode });
  }, [notificationsEnabled, healthSyncEnabled, darkMode]);

  const toggleHealthSync = useCallback(() => {
    const next = !healthSyncEnabled;
    setHealthSyncEnabled(next);
    saveSettings({ notificationsEnabled, healthSyncEnabled: next, darkMode });
  }, [notificationsEnabled, healthSyncEnabled, darkMode]);

  const toggleDarkMode = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    saveSettings({ notificationsEnabled, healthSyncEnabled, darkMode: next });
  }, [notificationsEnabled, healthSyncEnabled, darkMode]);

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
        connectedDevice,
        isScanning,
        isSyncing,
        notificationsEnabled,
        healthSyncEnabled,
        darkMode,
        addDevice,
        removeDevice,
        connectDevice,
        disconnectDevice,
        syncDevice,
        startScan,
        stopScan,
        toggleNotifications,
        toggleHealthSync,
        toggleDarkMode,
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
