# WearBridge BLE protocol v1

WearBridge uses a local Bluetooth Low Energy connection. The Wear OS companion is the GATT peripheral and the iPhone app is the GATT central. No health data leaves the two devices in the default configuration.

## UUIDs

- Service: `7f510001-1b15-4f0d-9c6e-2d92f1d5c001`
- Device info, read: `7f510002-1b15-4f0d-9c6e-2d92f1d5c001`
- Telemetry, read and notify: `7f510003-1b15-4f0d-9c6e-2d92f1d5c001`
- Command, write with or without response: `7f510004-1b15-4f0d-9c6e-2d92f1d5c001`

All characteristic values are UTF-8 JSON. Field names are deliberately compact so a telemetry update fits inside the negotiated ATT payload.

## Device info

```json
{
  "v": 1,
  "id": "stable-watch-id",
  "m": "Pixel Watch 3",
  "n": "WearBridge Pixel Watch 3",
  "fw": "1.0"
}
```

`v` is the protocol version, `id` is a stable app-generated watch ID, `m` is the model, `n` is the display name, and `fw` is the companion version.

## Telemetry

```json
{
  "v": 1,
  "hr": 72,
  "s": 5312,
  "cal": 340,
  "dm": 4100,
  "am": 28,
  "b": 81,
  "c": false,
  "ts": 1788940800000
}
```

The optional health fields are heart rate (`hr`), daily steps (`s`), daily calories (`cal`), distance in metres (`dm`), and active minutes (`am`). Battery percentage (`b`), charging state (`c`), and capture time in Unix milliseconds (`ts`) accompany every snapshot. An absent metric means the watch or user permission did not provide it; clients must not invent a value.

## Command

```json
{ "v": 1, "id": "1788940800000", "type": "SYNC_NOW" }
```

Version 1 accepts `PING` and `SYNC_NOW`. A successful `SYNC_NOW` write causes the watch to refresh and notify the telemetry characteristic.

Telemetry reads/subscriptions and command writes require an encrypted BLE link. The operating systems own pairing and key storage; WearBridge never implements its own cryptography or transports health data over a remote endpoint.

## Connection flow

1. The watch publishes the GATT service and advertises its service UUID.
2. iOS scans for that UUID, connects, and discovers services.
3. iOS reads and validates device info. A protocol version mismatch fails pairing.
4. iOS reads the current telemetry and enables the standard CCCD notification descriptor.
5. The watch notifies telemetry changes while connected.
6. iOS writes `SYNC_NOW` when the user requests a refresh.

Pairing and live BLE behavior require physical devices. The iOS simulator, Wear OS emulator, Expo Go, and web build do not provide a representative end-to-end BLE test.
