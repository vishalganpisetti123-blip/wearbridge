# Master implementation prompt

Use this prompt for the next production-hardening pass on WearBridge.

---

You are the senior mobile and Bluetooth engineer responsible for finishing WearBridge, a privacy-first bridge between a Wear OS watch and an iPhone. Work in both repositories:

- iPhone app and supporting monorepo: `vishalganpisetti123-blip/wearbridge`
- Wear OS companion: `vishalganpisetti123-blip/wearbridge-android`

Start by reading both repositories and `docs/BLE_PROTOCOL.md`. Preserve protocol version 1 unless you introduce backward-compatible version negotiation. Do not use simulated devices, random health values, placeholder telemetry, hardcoded users, or hidden cloud uploads.

The shippable core must work as follows:

1. The Wear OS app runs as a foreground connected-device service, publishes the custom WearBridge GATT service, and advertises the exact service UUID.
2. The iOS app scans only for the WearBridge service UUID, connects as a BLE central, validates the device-info characteristic, reads current telemetry, subscribes to telemetry notifications, detects disconnects, and reconnects a previously saved CoreBluetooth identifier.
3. Heart rate comes from Wear OS Health Services only after contextual permission. Daily activity metrics use passive monitoring only when the device supports them. Missing or denied metrics remain unavailable rather than being fabricated.
4. Battery and charging state come from Android system APIs. The iPhone UI distinguishes unavailable, stale, disconnected, and live values.
5. `PING` and `SYNC_NOW` writes are validated by protocol version and command type. Invalid or oversized payloads receive a GATT failure response and never crash the service.
6. Health data stays local by default. Any future remote sync must be opt-in, name the destination to the user, authenticate per user and device, encrypt in transit, support deletion, and include a documented retention policy. Never embed a shared production secret in a mobile binary.
7. Request only permissions used by implemented features. Do not request contacts, SMS, phone state, location, or Bluetooth scan permission when operating solely as a BLE advertiser.
8. Add automated tests for JSON parsing, protocol-version rejection, telemetry merging, malformed commands, permission-denied states, and reconnect state transitions. Add an on-device interoperability checklist for at least one Pixel Watch, one Galaxy Watch, and two supported iPhone/iOS versions.
9. Add release CI for TypeScript typecheck, Expo config validation, Android unit tests, lint, debug assembly, and signed release builds. Keep signing credentials outside Git.
10. Improve accessibility, localization, empty/error states, privacy disclosures, app icons, bundle/application identifiers, semantic versioning, and store metadata. Do not claim features that are not operating on real hardware.

Platform constraint: an ordinary iOS app cannot read notifications posted by other apps. Do not implement a fake “notification sync” toggle. Cross-app notification mirroring would require an accessory-side Apple Notification Center Service client plus system authorization and substantial compatibility testing; treat that as a separate research milestone and clearly label unsupported devices.

Before changing code, report the current behavior and gaps. Then implement the smallest complete vertical slice, run all available checks, and summarize exact files changed, real-device steps, unresolved hardware dependencies, security implications, and rollback instructions. Completion means the two physical-device apps interoperate; a green simulator-only build is not sufficient evidence.

---

## Acceptance gate for the current BLE milestone

- The TypeScript workspace typecheck passes.
- The Wear OS `testDebugUnitTest`, `lintDebug`, and `assembleDebug` tasks pass.
- The watch advertises the documented UUID after permission is granted.
- The iPhone finds only WearBridge companions, reads device identity, and shows a live battery snapshot.
- A heart-rate update on a supported watch produces a telemetry notification and UI update on iPhone.
- Disconnecting either radio moves the UI to a disconnected state without deleting the saved watch.
- No Android manifest permission grants SMS, contacts, phone-state, or location access.
- No watch code contains a hardcoded remote API endpoint or background health upload.
