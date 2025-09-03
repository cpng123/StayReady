const K_TOKEN = "onemap:token";
const K_TOKEN_EXP = "onemap:tokenExp";
const K_DEMO_LOC = "location:demoEnabled";

// -------------------- AsyncStorage mock --------------------
const memoryStore = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k) => Promise.resolve(memoryStore[k] ?? null)),
  setItem: jest.fn((k, v) => {
    memoryStore[k] = v;
    return Promise.resolve();
  }),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([k, v]) => (memoryStore[k] = v));
    return Promise.resolve();
  }),
  removeItem: jest.fn((k) => {
    delete memoryStore[k];
    return Promise.resolve();
  }),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- Expo Location mock --------------------
const mockReqPerms = jest.fn();
const mockGetPos = jest.fn();
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: () => mockReqPerms(),
  getCurrentPositionAsync: (...a) => mockGetPos(...a),
  Accuracy: { Balanced: 3 },
}));

// -------------------- Module under test --------------------
import {
  getOneMapToken,
  setDemoLocationEnabled,
  getDemoLocationEnabled,
  getCurrentCoords,
  regionFromLatLon,
  reverseGeocode,
  resolveLocationLabel,
} from "../../utils/locationService";

// -------------------- fetch mock helpers --------------------
const realFetch = global.fetch;

function mockFetchOnceJSON(
  json,
  { ok = true, status = 200, statusText = "OK" } = {}
) {
  global.fetch.mockResolvedValueOnce({
    ok,
    status,
    statusText,
    json: async () => json,
    text: async () => JSON.stringify(json),
    headers: { get: () => null },
  });
}

beforeEach(() => {
  Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = realFetch;
});

// Stabilize time for expiry math
const REAL_NOW = Date.now;
beforeAll(() => {
  Date.now = () => 1_725_000_000_000; // fixed epoch
});
afterAll(() => {
  Date.now = REAL_NOW;
});

// -------------------- Tests --------------------

describe("OneMap token management (getOneMapToken)", () => {
  it("returns cached token when not expired", async () => {
    memoryStore[K_TOKEN] = "cached-token";
    memoryStore[K_TOKEN_EXP] = String(Date.now() + 60_000); // +1 min
    const t = await getOneMapToken();
    expect(t).toBe("cached-token");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches token when missing/expired and stores token+exp (expires_in seconds)", async () => {
    // Expired cache
    memoryStore[K_TOKEN] = "old";
    memoryStore[K_TOKEN_EXP] = String(Date.now() - 1);

    // OneMap auth response (expires_in in seconds)
    mockFetchOnceJSON({ access_token: "fresh-abc", expires_in: 3600 });

    const t = await getOneMapToken();
    expect(t).toBe("fresh-abc");

    // multiSet stores both token and expiry
    expect(AsyncStorage.multiSet).toHaveBeenCalledWith(
      expect.arrayContaining([
        [K_TOKEN, "fresh-abc"],
        [K_TOKEN_EXP, expect.any(String)],
      ])
    );
    const exp = Number(memoryStore[K_TOKEN_EXP]);
    expect(exp).toBeGreaterThan(Date.now()); // future
  });

  it("supports expiry as ISO timestamp string", async () => {
    const iso = new Date(Date.now() + 86_400_000).toISOString();
    mockFetchOnceJSON({ token: "iso-token", expires_at: iso });

    const t = await getOneMapToken();
    expect(t).toBe("iso-token");
    expect(Number(memoryStore[K_TOKEN_EXP])).toBeCloseTo(Date.parse(iso), -2);
  });

  it("throws if server returns no token field", async () => {
    mockFetchOnceJSON({ what: "nope" });
    await expect(getOneMapToken()).rejects.toThrow(/token fetch failed/i);
  });
});

describe("Demo location toggles + getCurrentCoords()", () => {
  it("set/get demo flag works", async () => {
    expect(await getDemoLocationEnabled()).toBe(false);
    await setDemoLocationEnabled(true);
    expect(await getDemoLocationEnabled()).toBe(true);
    expect(memoryStore[K_DEMO_LOC]).toBe("1");
    await setDemoLocationEnabled(false);
    expect(await getDemoLocationEnabled()).toBe(false);
  });

  it("returns demo coordinates when demo flag enabled (no permission prompt)", async () => {
    await setDemoLocationEnabled(true);
    const pos = await getCurrentCoords();
    expect(pos).toEqual({ latitude: 1.283, longitude: 103.86, mocked: true });
    expect(mockReqPerms).not.toHaveBeenCalled();
  });

  it("requests permission and returns GPS coordinates when granted", async () => {
    await setDemoLocationEnabled(false);
    mockReqPerms.mockResolvedValueOnce({ status: "granted" });
    mockGetPos.mockResolvedValueOnce({
      coords: { latitude: 1.33, longitude: 103.88 },
      mocked: false,
    });
    const pos = await getCurrentCoords();
    expect(pos).toEqual({ latitude: 1.33, longitude: 103.88, mocked: false });
  });

  it("falls back to demo coords when permission denied (and warns)", async () => {
    await setDemoLocationEnabled(false);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockReqPerms.mockResolvedValueOnce({ status: "denied" });

    const pos = await getCurrentCoords();
    expect(pos).toEqual({ latitude: 1.283, longitude: 103.86, mocked: true });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Location permission denied/i)
    );
    warnSpy.mockRestore();
  });
});

describe("regionFromLatLon()", () => {
  it("classifies into quadrants", () => {
    expect(regionFromLatLon(1.4, 103.82)).toBe("North");
    expect(regionFromLatLon(1.27, 103.82)).toBe("South");
    expect(regionFromLatLon(1.33, 103.95)).toBe("East");
    expect(regionFromLatLon(1.33, 103.7)).toBe("West");
    expect(regionFromLatLon(1.33, 103.83)).toBe("Central");
  });
});

describe("reverseGeocode()", () => {
  it("normalizes GeocodeInfo shape", async () => {
    // Auth token
    mockFetchOnceJSON({ access_token: "t1", expires_in: 3600 });
    // revgeocode result
    mockFetchOnceJSON({
      GeocodeInfo: [
        {
          BUILDINGNAME: "Marina Bay Sands",
          BLOCK: "10",
          ROAD: "Bayfront Ave",
          POSTAL: "018956",
        },
      ],
    });

    const out = await reverseGeocode(1.283, 103.86);
    expect(out).toEqual({
      addressLine: "Marina Bay Sands, 10 Bayfront Ave",
      postal: "018956",
      building: "Marina Bay Sands",
      road: "Bayfront Ave",
      block: "10",
    });
  });

  it("normalizes results[] shape", async () => {
    mockFetchOnceJSON({ access_token: "t2", expires_in: 3600 });
    mockFetchOnceJSON({
      results: [
        {
          BUILDING: "ION Orchard",
          BLK_NO: "2",
          ROAD_NAME: "Orchard Turn",
          POSTAL_CODE: "238801",
        },
      ],
    });

    const out = await reverseGeocode(1.303, 103.835);
    expect(out).toEqual({
      addressLine: "ION Orchard, 2 Orchard Turn",
      postal: "238801",
      building: "ION Orchard",
      road: "Orchard Turn",
      block: "2",
    });
  });

  it("returns null when no results", async () => {
    mockFetchOnceJSON({ access_token: "t3", expires_in: 3600 });
    mockFetchOnceJSON({ results: [] });
    const out = await reverseGeocode(1.0, 103.0);
    expect(out).toBeNull();
  });
});

describe("resolveLocationLabel()", () => {
  it("returns coords + region + reverse-geocoded fields when available", async () => {
    // Demo off → will request permission + GPS
    await setDemoLocationEnabled(false);
    mockReqPerms.mockResolvedValueOnce({ status: "granted" });
    mockGetPos.mockResolvedValueOnce({
      coords: { latitude: 1.283, longitude: 103.86 },
      mocked: false,
    });

    // Token + reverse geocode
    mockFetchOnceJSON({ access_token: "t4", expires_in: 3600 });
    mockFetchOnceJSON({
      GeocodeInfo: [
        {
          BUILDINGNAME: "The Float",
          ROAD: "Raffles Ave",
          POSTAL: "039803",
        },
      ],
    });

    const out = await resolveLocationLabel();
    expect(out.region).toBe("South");
    expect(out.mocked).toBe(false);
    expect(out.address).toMatch(/The Float/);
    expect(out.postal).toBe("039803");
    expect(out.coords).toEqual({ latitude: 1.283, longitude: 103.86 });
  });

  it("still returns region + coords if reverse geocode fails", async () => {
    // Use demo on to avoid permission flow
    await setDemoLocationEnabled(true);

    // Make token fetch fail (so reverseGeocode throws)
    global.fetch.mockRejectedValueOnce(new Error("auth down"));

    const out = await resolveLocationLabel();
    expect(out.coords).toEqual({ latitude: 1.283, longitude: 103.86 });
    expect(out.region).toBe("South");
    expect(out.address).toBeNull(); // falls back when reverseGeocode fails
  });
});
