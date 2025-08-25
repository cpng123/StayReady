// utils/device.js
import * as SecureStore from "expo-secure-store";
import "react-native-get-random-values";
import { v4 as uuid } from "uuid";

const DEVICE_ID_KEY = "device_id_v1";

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
