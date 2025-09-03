/**
 * File: utils/device.js
 * Purpose: Provide a stable, anonymous per-install device identifier.
 *
 * Responsibilities:
 *  - Read an ID from Expo SecureStore (Keychain/Keystore).
 *  - If absent, generate a UUID v4 and persist it for future runs.
 *  - Fall back gracefully (non-persistent) if SecureStore is unavailable.
 *
 * Notes:
 *  - This is NOT a hardware identifier; it resets if the app is reinstalled
 *    or SecureStore is cleared.
 *  - Keep this ID out of analytics PII—treat as an anonymous install token.
 */

import * as SecureStore from "expo-secure-store";
import "react-native-get-random-values";
import { v4 as uuid } from "uuid";

const DEVICE_ID_KEY = "device_id_v1";

// Return a stable anonymous device ID.
// Reads from SecureStore; if missing, generates and saves a new UUID.
// If SecureStore throws, logs a warning and returns a non-persistent UUID.
export async function getDeviceId() {
  try {
    let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!id) {
      id = uuid();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    }
    return id;
  } catch (e) {
    console.warn("Failed to fetch device ID, generating fallback:", e);
    return uuid(); 
  }
}
