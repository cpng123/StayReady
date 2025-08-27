// utils/mockFlags.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// One place for all hazard mocks so we can grow later
const KEY = "mock:hazards:v1";

// Back-compat with your old single-flag storage
const LEGACY_FLOOD_KEY = "mockFloodEnabled";

const DEFAULT_FLAGS = {
  flood: false,
  haze: false,
  dengue: false,
  wind: false,
  heat: false,
};

export async function getMockFlags() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_FLAGS, ...parsed };
    }
    // fallback: migrate legacy flood flag if present
    const legacyRaw = await AsyncStorage.getItem(LEGACY_FLOOD_KEY);
    const legacy = legacyRaw ? JSON.parse(legacyRaw) === true : false;
    const initial = { ...DEFAULT_FLAGS, flood: legacy };
    await AsyncStorage.setItem(KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

export async function setMockFlags(next) {
  const merged = { ...DEFAULT_FLAGS, ...(next || {}) };
  try { await AsyncStorage.setItem(KEY, JSON.stringify(merged)); } catch {}
  return merged;
}

export async function setMockFlag(kind, value) {
  const flags = await getMockFlags();
  flags[kind] = !!value;
  return setMockFlags(flags);
}

// Convenience per-flag helpers (optional)
export async function getMockFloodEnabled() {
  const f = await getMockFlags(); return !!f.flood;
}
export async function setMockFloodEnabled(v) {
  const f = await getMockFlags(); f.flood = !!v; return setMockFlags(f);
}
