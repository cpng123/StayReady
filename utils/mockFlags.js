/**
 * File: utils/mockFlags.js
 * Purpose: Centralize demo/testing toggles for hazard types (flood, haze,
 * dengue, wind, heat). These flags let the app simulate hazards without live
 * data, so screens and notifications can be tested predictably.
 *
 * Responsibilities:
 *  - Persist a boolean map of hazard mocks in AsyncStorage.
 *  - Provide a single source of truth for reading/updating flags.
 *  - Migrate an older single-flag key (mockFloodEnabled) to the new shape.
 *
 * Storage:
 *  - KEY = "mock:hazards:v1" → { flood, haze, dengue, wind, heat }
 *  - LEGACY_FLOOD_KEY = "mockFloodEnabled" (read once and migrated)
 *
 * Usage:
 *  - await getMockFlags()              // read all flags
 *  - await setMockFlags({ flood: true })
 *  - await setMockFlag('wind', false)
 *  - await getMockFloodEnabled(), setMockFloodEnabled(true)  // convenience
 */

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

// Get all mock flags (with legacy migration on first run)
export async function getMockFlags() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_FLAGS, ...parsed };
    }
    // Fallback: migrate legacy flood flag if present
    const legacyRaw = await AsyncStorage.getItem(LEGACY_FLOOD_KEY);
    const legacy = legacyRaw ? JSON.parse(legacyRaw) === true : false;
    const initial = { ...DEFAULT_FLAGS, flood: legacy };
    await AsyncStorage.setItem(KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

// Save the full flag object (merges with defaults)
export async function setMockFlags(next) {
  const merged = { ...DEFAULT_FLAGS, ...(next || {}) };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  } catch {}
  return merged;
}

// Set a single flag by kind (e.g., "flood", "heat")
export async function setMockFlag(kind, value) {
  const flags = await getMockFlags();
  flags[kind] = !!value;
  return setMockFlags(flags);
}

// Convenience per-flag helpers (optional)
export async function getMockFloodEnabled() {
  const f = await getMockFlags();
  return !!f.flood;
}
export async function setMockFloodEnabled(v) {
  const f = await getMockFlags();
  f.flood = !!v;
  return setMockFlags(f);
}
