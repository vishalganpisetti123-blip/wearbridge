# WearBridge

WearBridge is an experimental, privacy-first connection between a Wear OS companion and an iPhone. The working MVP uses a direct BLE GATT link for identity, supported health/activity metrics, battery state, and explicit sync commands.

The iPhone app lives in `artifacts/wearos-ios`. The repository also contains an API prototype and UI mockup sandbox; neither is required for the local BLE connection.

## What works in the MVP

- Service-UUID-filtered discovery of the WearBridge watch companion
- Device-info validation and protocol versioning
- Saved peripheral identity and manual reconnect
- Live GATT telemetry subscription
- Heart rate from Wear OS Health Services when supported and permitted
- Daily steps/calories from passive Health Services updates when supported
- Real watch battery and charging state
- `PING` and `SYNC_NOW` commands
- iOS background Bluetooth-central declaration

## Run the iPhone app

This app uses `react-native-ble-plx`, so it requires a native Expo development build on a physical iPhone. Expo Go, the iOS simulator, and the web preview cannot test the bridge.

```sh
pnpm install
pnpm --filter @workspace/wearos-ios ios
```

Open the Wear OS companion, tap **Start Pairing**, grant the requested Bluetooth and health permissions, then open the iPhone app and use **Devices → Scan for Wear OS Watches**.

## Verify source changes

```sh
pnpm run typecheck
```

The repository-wide `pnpm run build` is currently Linux/Replit-oriented: its workspace configuration excludes native macOS Rollup binaries, so the mockup sandbox build is not a valid macOS verification command. The iPhone package typecheck is included in the command above.

## Product boundary

iOS does not give ordinary apps access to notifications posted by other apps. WearBridge does not claim notification mirroring in this MVP. See [the master implementation prompt](docs/IMPLEMENTATION_PROMPT.md) and [BLE protocol](docs/BLE_PROTOCOL.md) for the production plan and interoperability contract.
