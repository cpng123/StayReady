/**
 * Unit tests for utils/rewards.js
 *
 * - Stubs image requires (.jpg)
 * - Mocks AsyncStorage with an in-memory KV
 */

//// ---------- stub image requires so Node/Jest can import the module ----------
/* eslint-disable no-underscore-dangle */
if (!require.extensions[".jpg"]) {
  require.extensions[".jpg"] = function (module /*, filename*/) {
    module.exports = 1; // any placeholder
  };
}
/* eslint-enable no-underscore-dangle */

//// ---------- AsyncStorage in-memory mock ----------
const mem = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k) => Promise.resolve(mem[k] ?? null)),
  setItem: jest.fn((k, v) => {
    mem[k] = v;
    return Promise.resolve();
  }),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";

// Import after stubbing/mocking above
import {
  REWARDS_DATA,
  getRewards,
  getRedeemedTotal,
  computeAvailablePoints,
  redeemItem,
} from "../../utils/rewards";

// Keys from the source (copied to keep tests readable)
const KEY_TOTAL = "rewards:redeemedTotal";
const KEY_HISTORY = "rewards:history";

// Helper to read raw history array from the mock store
const readHistory = () => {
  const raw = mem[KEY_HISTORY];
  return raw ? JSON.parse(raw) : [];
};

beforeEach(() => {
  // reset memory + mocks
  for (const k of Object.keys(mem)) delete mem[k];
  jest.clearAllMocks();
  // stabilize time
  jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000); // fixed ms
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getRewards()", () => {
  test("returns English defaults when no translator provided", () => {
    const items = getRewards();
    expect(items.length).toBeGreaterThan(0);
    // sample fields from first entry
    expect(items[0]).toHaveProperty("id");
    expect(typeof items[0].title).toBe("string");
    expect(typeof items[0].desc).toBe("string");
    expect(Array.isArray(items[0].details)).toBe(true);
  });

  test("applies i18n titles/descriptions and respects returnObjects for details", () => {
    const fakeT = (key, opts = {}) => {
      if (key.endsWith(".details") && opts.returnObjects) {
        // prove we can replace the whole details array
        return ["D1", "D2", "D3"];
      }
      // otherwise, wrap defaultValue to signal it was passed through i18n
      if (opts && Object.prototype.hasOwnProperty.call(opts, "defaultValue")) {
        return `T:${opts.defaultValue}`;
      }
      return `T:${key}`;
    };

    const items = getRewards(fakeT);
    expect(items.length).toBeGreaterThan(0);

    const sample = items.find((r) => r.id === "r3"); // Reusable Face Masks
    expect(sample.title.startsWith("T:")).toBe(true);
    expect(sample.desc.startsWith("T:")).toBe(true);
    expect(sample.longDesc.startsWith("T:")).toBe(true);
    expect(sample.details).toEqual(["D1", "D2", "D3"]);
  });
});

describe("getRedeemedTotal()", () => {
  test("returns 0 when nothing stored or storage errors", async () => {
    expect(await getRedeemedTotal()).toBe(0);
  });

  test("returns numeric when stored", async () => {
    await AsyncStorage.setItem(KEY_TOTAL, "1200");
    expect(await getRedeemedTotal()).toBe(1200);
  });
});

describe("computeAvailablePoints()", () => {
  test("clamps at zero and handles non-numeric inputs", () => {
    expect(computeAvailablePoints(5000, 1200)).toBe(3800);
    expect(computeAvailablePoints(1000, 5000)).toBe(0);
    expect(computeAvailablePoints("1000", "200")).toBe(800);
    expect(computeAvailablePoints(null, undefined)).toBe(0);
  });
});

describe("redeemItem()", () => {
  test("no-op when item points <= 0", async () => {
    const res = await redeemItem({ id: "x", title: "X", points: 0 });
    expect(res.ok).toBe(false);
    expect(res.redeemedTotal).toBe(0);
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
      KEY_TOTAL,
      expect.any(String)
    );
  });

  test("increments total and prepends to history (most recent first)", async () => {
    // prime with previous total/history
    await AsyncStorage.setItem(KEY_TOTAL, "600");
    await AsyncStorage.setItem(
      KEY_HISTORY,
      JSON.stringify([{ id: "old", title: "Old", points: 100, ts: 1 }])
    );

    const item = { id: "r1", title: "Mini First Aid Kit", points: 2000 };
    const out = await redeemItem(item);

    expect(out.ok).toBe(true);
    expect(out.redeemedTotal).toBe(2600);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(KEY_TOTAL, "2600");

    const hist = readHistory();
    expect(hist).toHaveLength(2);
    // newest first
    expect(hist[0]).toMatchObject({
      id: "r1",
      title: "Mini First Aid Kit",
      points: 2000,
    });
    expect(typeof hist[0].ts).toBe("number");
    expect(hist[1]).toMatchObject({ id: "old", points: 100 });
  });

  test("accumulates across multiple redemptions", async () => {
    const a = await redeemItem({
      id: "don-src-1",
      title: "$1 SRC",
      points: 100,
    });
    expect(a.ok).toBe(true);
    expect(a.redeemedTotal).toBe(100);

    const b = await redeemItem({
      id: "don-src-5",
      title: "$5 SRC",
      points: 500,
    });
    expect(b.ok).toBe(true);
    expect(b.redeemedTotal).toBe(600);

    const c = await redeemItem({
      id: "r5",
      title: "Survival Blanket",
      points: 1200,
    });
    expect(c.ok).toBe(true);
    expect(c.redeemedTotal).toBe(1800);

    const hist = readHistory();
    expect(hist.map((h) => h.id)).toEqual(["r5", "don-src-5", "don-src-1"]);
  });

  test("returns current total on storage failure (graceful)", async () => {
    // 1) Prime total to 300 (this must succeed)
    await AsyncStorage.setItem(KEY_TOTAL, "300");

    // 2) Make the *next* setItem call fail (the one inside redeemItem)
    const orig = AsyncStorage.setItem;
    AsyncStorage.setItem.mockImplementationOnce(() =>
      Promise.reject(new Error("fail"))
    );

    // 3) Attempt a redemption; internal storage write fails
    const out = await redeemItem({ id: "r3", title: "Mask", points: 600 });

    expect(out.ok).toBe(false);
    expect(out.redeemedTotal).toBe(300); // unchanged current total returned on failure
    AsyncStorage.setItem.mockImplementation(orig);
  });
});
