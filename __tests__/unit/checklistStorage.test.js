const STORAGE_KEY = "stayready:checklist:v1";

// ---------------- Mocks ----------------
const memoryStore = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k) => Promise.resolve(memoryStore[k] ?? null)),
  setItem: jest.fn((k, v) => {
    memoryStore[k] = v;
    return Promise.resolve();
  }),
  removeItem: jest.fn((k) => {
    delete memoryStore[k];
    return Promise.resolve();
  }),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadChecklistDoneMap,
  saveChecklistDoneMap,
  clearChecklistDoneMap,
  applyDoneToSections,
} from "../../utils/checklistStorage";

const reset = () => {
  Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  jest.clearAllMocks();
};

beforeEach(reset);

// ---------------- Tests ----------------

describe("loadChecklistDoneMap()", () => {
  it("returns {} when storage is empty", async () => {
    const map = await loadChecklistDoneMap();
    expect(map).toEqual({});
  });

  it("returns parsed object when present", async () => {
    const seed = { a: true, b: true };
    memoryStore[STORAGE_KEY] = JSON.stringify(seed);
    const map = await loadChecklistDoneMap();
    expect(map).toEqual(seed);
  });

  it("returns {} on corrupted JSON", async () => {
    memoryStore[STORAGE_KEY] = "{not-json";
    const map = await loadChecklistDoneMap();
    expect(map).toEqual({});
  });
});

describe("saveChecklistDoneMap() + clearChecklistDoneMap()", () => {
  it("persists and then loads the same object", async () => {
    const toSave = { item1: true, item2: true };
    await saveChecklistDoneMap(toSave);

    // Raw storage content is JSON string
    expect(memoryStore[STORAGE_KEY]).toBe(JSON.stringify(toSave));

    const loaded = await loadChecklistDoneMap();
    expect(loaded).toEqual(toSave);
  });

  it("clear removes stored state", async () => {
    await saveChecklistDoneMap({ x: true });
    expect(memoryStore[STORAGE_KEY]).toBeTruthy();

    await clearChecklistDoneMap();
    expect(memoryStore[STORAGE_KEY]).toBeUndefined();

    const loaded = await loadChecklistDoneMap();
    expect(loaded).toEqual({});
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it("save swallows underlying setItem errors (does not throw)", async () => {
    const orig = AsyncStorage.setItem;
    AsyncStorage.setItem = jest.fn(() =>
      Promise.reject(new Error("disk full"))
    );
    await expect(saveChecklistDoneMap({ y: true })).resolves.toBeUndefined();
    AsyncStorage.setItem = orig;
  });
});

describe("applyDoneToSections()", () => {
  it("applies done flags to items by id", () => {
    const sections = [
      {
        id: "sec1",
        title: "Basics",
        items: [
          { id: "water", label: "Water" },
          { id: "food", label: "Food" },
        ],
      },
      {
        id: "sec2",
        title: "Docs",
        items: [{ id: "passport", label: "Passport" }],
      },
    ];
    const doneMap = { water: true, passport: true };

    const out = applyDoneToSections(sections, doneMap);

    // original unchanged
    expect(sections[0].items[0].done).toBeUndefined();

    // mapped copy has done flags
    expect(out[0].items[0]).toMatchObject({ id: "water", done: true });
    expect(out[0].items[1]).toMatchObject({ id: "food", done: false });
    expect(out[1].items[0]).toMatchObject({ id: "passport", done: true });
  });

  it("handles missing/empty arrays gracefully", () => {
    const out1 = applyDoneToSections(null, { a: true });
    expect(out1).toEqual([]);

    const out2 = applyDoneToSections([{ id: "s", items: null }], { a: true });
    expect(out2[0].items).toEqual([]);
  });
});
