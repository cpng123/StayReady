import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * New, namespaced keys (recommended going forward)
 */
const PREFIX = "@quizverse:";

export const KEYS = {
  // Data
  BOOKMARKS: `${PREFIX}bookmarks_v2`,
  STATS: `${PREFIX}stats_v1`,
  DAILY: `${PREFIX}daily_v1`,

  // Prefs
  PREF_THEME: `${PREFIX}pref:themeKey`,
  PREF_LANG: `${PREFIX}pref:lang`,
  PREF_SFX: `${PREFIX}pref:sfxEnabled`,
  PREF_HAPTICS: `${PREFIX}pref:hapticsEnabled`,
  PREF_NOTIF: `${PREFIX}pref:notificationsEnabled`,
};

/**
 * Legacy keys currently used elsewhere in the app.
 * Keep them here so clearCache/resetAll work even before you migrate all callers.
 */
const LEGACY = {
  // Settings
  K_LANG: "pref:language",
  K_NOTIF: "pref:notificationsEnabled",
  K_SFX: "pref:sfxEnabled",
  K_HAPTIC: "pref:hapticsEnabled",
  THEME_PROVIDER: "@stayready_theme",

  // Bookmarks
  BOOKMARKS_V1: "@bookmarks_v1",

  // Checklist
  CHECKLIST: "stayready:checklist:v1",

  // Daily challenge
  DAILY_SET_KEY: "daily:set:v1",
  DAILY_STATUS_KEY: "daily:status:v1",

  // Emergency contacts
  CONTACTS_KEY: "emergency:contacts",
  TEST_MODE_KEY: "emergency:testMode",

  // Location service
  K_TOKEN: "onemap:token",
  K_TOKEN_EXP: "onemap:tokenExp",
  K_DEMO_LOC: "location:demoEnabled",

  // Progress stats
  ATTEMPTS_KEY: "quiz:attempts:v1",

  // Rewards
  REDEEMED_TOTAL_KEY: "rewards:redeemedTotal",
  REDEEMED_HISTORY_KEY: "rewards:history",
};

/** Convenience sets */
const LEGACY_PREF_KEYS = new Set([
  LEGACY.K_LANG,
  LEGACY.K_NOTIF,
  LEGACY.K_SFX,
  LEGACY.K_HAPTIC,
  LEGACY.THEME_PROVIDER,
]);

const LEGACY_BOOKMARK_KEYS = new Set([LEGACY.BOOKMARKS_V1]);

/** Helper: is this one of “our app” keys (namespaced or legacy)? */
function isOurKey(k) {
  if (k.startsWith(PREFIX)) return true;
  return (
    LEGACY_PREF_KEYS.has(k) ||
    LEGACY_BOOKMARK_KEYS.has(k) ||
    k === LEGACY.CHECKLIST ||
    k === LEGACY.DAILY_SET_KEY ||
    k === LEGACY.DAILY_STATUS_KEY ||
    k === LEGACY.CONTACTS_KEY ||
    k === LEGACY.TEST_MODE_KEY ||
    k === LEGACY.K_TOKEN ||
    k === LEGACY.K_TOKEN_EXP ||
    k === LEGACY.K_DEMO_LOC ||
    k === LEGACY.ATTEMPTS_KEY ||
    k === LEGACY.REDEEMED_TOTAL_KEY ||
    k === LEGACY.REDEEMED_HISTORY_KEY
  );
}

/** Basic JSON helpers */
export async function getItem(key) {
  const raw = await AsyncStorage.getItem(key);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setItem(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key) {
  await AsyncStorage.removeItem(key);
}

/**
 * Clear cached data ONLY.
 * Preserves:
 *  - Bookmarks (new + legacy)
 *  - Preferences (lang, theme, sfx, haptics, notifications; new + legacy)
 *
 * Everything else that belongs to this app is removed.
 */
export async function clearCache() {
  const allKeys = await AsyncStorage.getAllKeys();

  // What to PRESERVE
  const preserve = new Set([
    // namespaced prefs
    KEYS.PREF_LANG,
    KEYS.PREF_THEME,
    KEYS.PREF_SFX,
    KEYS.PREF_HAPTICS,
    KEYS.PREF_NOTIF,
    // namespaced bookmarks
    KEYS.BOOKMARKS,
    // legacy prefs
    ...LEGACY_PREF_KEYS,
    // legacy bookmarks
    ...LEGACY_BOOKMARK_KEYS,
  ]);

  const ours = allKeys.filter(isOurKey);
  const toRemove = ours.filter((k) => !preserve.has(k));
  if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
}

/**
 * Full reset: removes EVERYTHING for this app
 * (both namespaced and legacy keys).
 */
export async function resetAll() {
  const allKeys = await AsyncStorage.getAllKeys();
  const ours = allKeys.filter(isOurKey);
  if (ours.length) await AsyncStorage.multiRemove(ours);
}
