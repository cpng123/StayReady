const mockStore = {};

jest.mock("@react-native-async-storage/async-storage", () => {
  const api = {
    getItem: jest.fn((k) => Promise.resolve(mockStore[k] ?? null)),
    setItem: jest.fn((k, v) => {
      mockStore[k] = v;
      return Promise.resolve();
    }),
    removeItem: jest.fn((k) => {
      delete mockStore[k];
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStore))),
    multiRemove: jest.fn((keys) => {
      (keys || []).forEach((k) => delete mockStore[k]);
      return Promise.resolve();
    }),
  };
  // Make it work with `import AsyncStorage from ...`
  return { __esModule: true, default: api, ...api };
});

//// -------------------- Import after mock --------------------
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  KEYS,
  getItem,
  setItem,
  removeItem,
  clearCache,
  resetAll,
} from "../../utils/storage";

//// -------------------- Helpers --------------------
const setRaw = (k, v) => {
  mockStore[k] = v;
};
const getRaw = (k) => mockStore[k];
const rawKeys = () => Object.keys(mockStore).sort();

beforeEach(() => {
  for (const k of Object.keys(mockStore)) delete mockStore[k];
  jest.clearAllMocks();
});

describe("JSON helpers", () => {
  test("setItem/getItem roundtrips JSON; getItem returns null on bad JSON", async () => {
    await setItem(KEYS.STATS, { a: 1, b: "x" });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      KEYS.STATS,
      JSON.stringify({ a: 1, b: "x" })
    );

    const val = await getItem(KEYS.STATS);
    expect(val).toEqual({ a: 1, b: "x" });

    // Corrupt the stored value and ensure getItem() → null
    setRaw(KEYS.STATS, "{not-json");
    const bad = await getItem(KEYS.STATS);
    expect(bad).toBeNull();

    // removeItem deletes key
    await removeItem(KEYS.STATS);
    expect(getRaw(KEYS.STATS)).toBeUndefined();
  });
});

describe("clearCache()", () => {
  test("keeps prefs + bookmarks (new + legacy) but removes cached data and other internal keys", async () => {
    // --- New namespaced keys
    setRaw(KEYS.BOOKMARKS, JSON.stringify([{ id: "b1" }])); // preserve
    setRaw(KEYS.STATS, JSON.stringify({ taken: 3 })); // remove
    setRaw(KEYS.DAILY, JSON.stringify({ dayKey: "2025-09-03" })); // remove
    setRaw(KEYS.PREF_LANG, JSON.stringify("en")); // preserve
    setRaw(KEYS.PREF_THEME, JSON.stringify("dark")); // preserve
    setRaw(KEYS.PREF_SFX, JSON.stringify(true)); // preserve
    setRaw(KEYS.PREF_HAPTICS, JSON.stringify(true)); // preserve
    setRaw(KEYS.PREF_NOTIF, JSON.stringify(true)); // preserve

    // --- Legacy prefs (preserve)
    setRaw("pref:language", JSON.stringify("en"));
    setRaw("pref:notificationsEnabled", JSON.stringify(true));
    setRaw("pref:sfxEnabled", JSON.stringify(true));
    setRaw("pref:hapticsEnabled", JSON.stringify(true));
    setRaw("@stayready_theme", JSON.stringify("dark"));

    // --- Legacy bookmarks (preserve)
    setRaw("@bookmarks_v1", JSON.stringify([{ id: "legacy-b" }]));

    // --- Legacy data (should be removed by clearCache)
    setRaw("stayready:checklist:v1", JSON.stringify({ x: 1 }));
    setRaw("daily:set:v1", JSON.stringify({}));
    setRaw("daily:status:v1", JSON.stringify({}));
    setRaw("emergency:contacts", JSON.stringify([]));
    setRaw("emergency:testMode", JSON.stringify("0"));
    setRaw("onemap:token", "tok");
    setRaw("onemap:tokenExp", String(Date.now() + 100000));
    setRaw("location:demoEnabled", "0");
    setRaw("quiz:attempts:v1", JSON.stringify([]));
    setRaw("rewards:redeemedTotal", "600");
    setRaw("rewards:history", JSON.stringify([]));

    // --- Foreign key (should be ignored by our cleanup)
    setRaw("some-other-app:key", "keep me");

    await clearCache();

    const keys = rawKeys();

    // Preserved new prefs + bookmarks
    expect(keys).toEqual(
      expect.arrayContaining([
        KEYS.BOOKMARKS,
        KEYS.PREF_LANG,
        KEYS.PREF_THEME,
        KEYS.PREF_SFX,
        KEYS.PREF_HAPTICS,
        KEYS.PREF_NOTIF,
      ])
    );

    // Preserved legacy prefs + bookmarks
    expect(keys).toEqual(
      expect.arrayContaining([
        "pref:language",
        "pref:notificationsEnabled",
        "pref:sfxEnabled",
        "pref:hapticsEnabled",
        "@stayready_theme",
        "@bookmarks_v1",
      ])
    );

    // Removed cached new data
    expect(keys).not.toEqual(expect.arrayContaining([KEYS.STATS, KEYS.DAILY]));

    // Removed legacy data-ish keys
    expect(keys).not.toContain("stayready:checklist:v1");
    expect(keys).not.toContain("daily:set:v1");
    expect(keys).not.toContain("daily:status:v1");
    expect(keys).not.toContain("emergency:contacts");
    expect(keys).not.toContain("emergency:testMode");
    expect(keys).not.toContain("onemap:token");
    expect(keys).not.toContain("onemap:tokenExp");
    expect(keys).not.toContain("location:demoEnabled");
    expect(keys).not.toContain("quiz:attempts:v1");
    expect(keys).not.toContain("rewards:redeemedTotal");
    expect(keys).not.toContain("rewards:history");

    // Foreign key untouched
    expect(getRaw("some-other-app:key")).toBe("keep me");

    // multiRemove should have been invoked at least once if there were removals
    expect(AsyncStorage.multiRemove).toHaveBeenCalled();
  });
});

describe("resetAll()", () => {
  test("removes ALL app keys (new + legacy) and leaves foreign keys alone", async () => {
    // Seed a representative mix of keys again (lighter set)
    setRaw(KEYS.BOOKMARKS, "x");
    setRaw(KEYS.STATS, "x");
    setRaw(KEYS.DAILY, "x");
    setRaw(KEYS.PREF_LANG, "x");
    setRaw("@bookmarks_v1", "x");
    setRaw("pref:language", "x");
    setRaw("stayready:checklist:v1", "x");
    setRaw("rewards:redeemedTotal", "600");
    setRaw("rewards:history", "[]");

    // Foreign
    setRaw("another:app", "keep");

    await resetAll();

    const keys = rawKeys();
    // All our keys should be gone
    expect(keys).not.toEqual(
      expect.arrayContaining([
        KEYS.BOOKMARKS,
        KEYS.STATS,
        KEYS.DAILY,
        KEYS.PREF_LANG,
        "@bookmarks_v1",
        "pref:language",
        "stayready:checklist:v1",
        "rewards:redeemedTotal",
        "rewards:history",
      ])
    );

    // Foreign key remains
    expect(getRaw("another:app")).toBe("keep");

    expect(AsyncStorage.multiRemove).toHaveBeenCalled();
  });
});
