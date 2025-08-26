// utils/mockFlags.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "mockFloodEnabled";

export async function setMockFloodEnabled(v) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(!!v)); } catch {}
}

export async function getMockFloodEnabled() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) === true : false;
  } catch { return false; }
}
