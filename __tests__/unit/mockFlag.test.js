import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getMockFlags,
  setMockFlags,
  setMockFlag,
  getMockFloodEnabled,
  setMockFloodEnabled,
} from "../../utils/mockFlags";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const KEY = "mock:hazards:v1";
const DEFAULT_FLAGS = {
  flood: false,
  haze: false,
  dengue: false,
  wind: false,
  heat: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("mockFlags.js", () => {
  test("returns default flags when no data is stored", async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    const result = await getMockFlags();
    expect(result).toEqual(DEFAULT_FLAGS);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      KEY,
      JSON.stringify(DEFAULT_FLAGS)
    );
  });

  test("migrates legacy flood flag when no new storage exists", async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce(null) // no new flags
      .mockResolvedValueOnce("true"); // legacy flag exists

    const result = await getMockFlags();
    expect(result.flood).toBe(true);
    expect(result).toEqual({ ...DEFAULT_FLAGS, flood: true });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      KEY,
      JSON.stringify({ ...DEFAULT_FLAGS, flood: true })
    );
  });

  test("returns merged stored flags if available", async () => {
    const stored = { flood: true, haze: true };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(stored));

    const result = await getMockFlags();
    expect(result).toEqual({ ...DEFAULT_FLAGS, ...stored });
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(KEY);
  });

  test("setMockFlags overwrites and persists merged flags", async () => {
    const next = { haze: true, heat: true };
    const result = await setMockFlags(next);

    expect(result).toEqual({ ...DEFAULT_FLAGS, ...next });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      KEY,
      JSON.stringify({ ...DEFAULT_FLAGS, ...next })
    );
  });

  test("setMockFlag updates a single flag only", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(DEFAULT_FLAGS));

    const result = await setMockFlag("wind", true);
    expect(result.wind).toBe(true);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      KEY,
      JSON.stringify({ ...DEFAULT_FLAGS, wind: true })
    );
  });

  test("getMockFloodEnabled returns correct boolean", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ ...DEFAULT_FLAGS, flood: true })
    );

    const enabled = await getMockFloodEnabled();
    expect(enabled).toBe(true);
  });

  test("setMockFloodEnabled toggles flood flag", async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(DEFAULT_FLAGS));

    const updated = await setMockFloodEnabled(true);
    expect(updated.flood).toBe(true);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      KEY,
      JSON.stringify({ ...DEFAULT_FLAGS, flood: true })
    );
  });

  test("getMockFlags gracefully falls back to defaults on parse error", async () => {
    AsyncStorage.getItem.mockImplementation(() => {
      throw new Error("broken");
    });

    const result = await getMockFlags();
    expect(result).toEqual(DEFAULT_FLAGS);
  });
});
