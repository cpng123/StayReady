const KEY = "@bookmarks_v1";

// ---------------- Mocks ----------------
const memoryStore = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k) => Promise.resolve(memoryStore[k] ?? null)),
  setItem: jest.fn((k, v) => {
    memoryStore[k] = v;
    return Promise.resolve();
  }),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  subscribeBookmarks,
  getAllBookmarks,
  isBookmarked,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  clearAllBookmarks,
  toBookmarkItem,
} from "../../utils/bookmarks";

// Freeze time for deterministic timestamps
const REAL_NOW = Date.now;
beforeAll(() => {
  Date.now = () => 1_725_000_000_000; // fixed ms epoch
});
afterAll(() => {
  Date.now = REAL_NOW;
});

// Helpers
const resetMemory = () => {
  Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  jest.clearAllMocks();
};

beforeEach(resetMemory);

// ---------------- Tests ----------------

describe("getAllBookmarks()", () => {
  it("returns [] when nothing stored", async () => {
    const list = await getAllBookmarks();
    expect(list).toEqual([]);
  });

  it("recovers from corrupted JSON by resetting to []", async () => {
    memoryStore[KEY] = "not-json 🤖";
    const list = await getAllBookmarks();
    expect(list).toEqual([]);
    // Should have auto-written [] to storage
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(KEY, JSON.stringify([]));
  });

  it("returns parsed array when valid JSON present", async () => {
    const seed = [{ id: "q1" }, { id: "q2" }];
    memoryStore[KEY] = JSON.stringify(seed);
    const list = await getAllBookmarks();
    expect(list).toEqual(seed);
  });
});

describe("subscribeBookmarks() pub/sub", () => {
  it("notifies subscribers on changes", async () => {
    const cb = jest.fn();
    const unsubscribe = subscribeBookmarks(cb);

    // Add
    await addBookmark({ id: "a" });
    expect(cb).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "a" })])
    );

    // Remove
    await removeBookmark("a");
    expect(cb).toHaveBeenLastCalledWith([]);

    // Unsubscribe stops further notifications
    unsubscribe();
    await addBookmark({ id: "b" });
    expect(cb).toHaveBeenCalledTimes(2);
  });
});

describe("addBookmark()", () => {
  it("adds a new bookmark with timestamp, emits change, and is idempotent", async () => {
    const cb = jest.fn();
    const unsub = subscribeBookmarks(cb);

    const item = { id: "q1", text: "What is 2+2?" };
    const ok = await addBookmark(item);
    expect(ok).toBe(true);

    const list1 = await getAllBookmarks();
    expect(list1).toHaveLength(1);
    expect(list1[0]).toEqual(
      expect.objectContaining({
        id: "q1",
        text: "What is 2+2?",
        timestamp: Date.now(),
      })
    );
    expect(cb).toHaveBeenCalledTimes(1);

    // Add same again → no duplicates
    await addBookmark(item);
    const list2 = await getAllBookmarks();
    expect(list2).toHaveLength(1);
    expect(cb).toHaveBeenCalledTimes(1); // no re-emit because content unchanged

    unsub();
  });
});

describe("isBookmarked()", () => {
  it("reflects presence/absence correctly", async () => {
    await addBookmark({ id: "qX" });
    expect(await isBookmarked("qX")).toBe(true);
    expect(await isBookmarked("qY")).toBe(false);
  });
});

describe("removeBookmark()", () => {
  it("removes existing item and returns false", async () => {
    await addBookmark({ id: "r1" });
    const res = await removeBookmark("r1");
    expect(res).toBe(false);
    const list = await getAllBookmarks();
    expect(list).toEqual([]);
  });

  it("is safe if item not present", async () => {
    await addBookmark({ id: "r2" });
    await removeBookmark("nope");
    const list = await getAllBookmarks();
    expect(list).toHaveLength(1);
  });
});

describe("toggleBookmark()", () => {
  it("adds when missing (returns true), then removes on second call (returns false)", async () => {
    const item = { id: "t1", text: "Hello?" };

    const first = await toggleBookmark(item);
    expect(first).toBe(true);
    expect(await isBookmarked("t1")).toBe(true);

    const second = await toggleBookmark(item);
    expect(second).toBe(false);
    expect(await isBookmarked("t1")).toBe(false);
  });
});

describe("clearAllBookmarks()", () => {
  it("empties storage and notifies", async () => {
    const cb = jest.fn();
    const unsub = subscribeBookmarks(cb);

    await addBookmark({ id: "c1" });
    await addBookmark({ id: "c2" });
    expect((await getAllBookmarks()).length).toBe(2);

    await clearAllBookmarks();
    expect(await getAllBookmarks()).toEqual([]);
    expect(cb).toHaveBeenLastCalledWith([]);
    unsub();
  });
});

describe("toBookmarkItem()", () => {
  it("normalizes fields correctly", () => {
    const raw = {
      id: "Q-7",
      categoryId: "hazard",
      categoryLabel: "Flood",
      setId: "set-123",
      setTitle: "Flood Basics",
      question: "What to do during a flash flood?",
      options: ["A", "B"],
      answerIndex: 1,
      selectedIndex: 0,
      timesUp: true,
    };
    const b = toBookmarkItem(raw);
    expect(b).toEqual({
      id: "Q-7",
      categoryId: "hazard",
      categoryLabel: "Flood",
      setId: "set-123",
      setTitle: "Flood Basics",
      text: "What to do during a flash flood?",
      options: ["A", "B"],
      answerIndex: 1,
      selectedIndex: 0,
      timesUp: true,
    });
  });

  it("applies defaults for optional fields", () => {
    const b = toBookmarkItem({
      id: "Q-8",
      categoryId: "hazard",
      categoryLabel: "Haze",
      setId: "set-888",
      setTitle: "Haze 101",
      question: "Mask type?",
      options: ["Cloth", "N95"],
      answerIndex: 1,
      // selectedIndex omitted
      // timesUp omitted
    });
    expect(b.selectedIndex).toBeNull();
    expect(b.timesUp).toBe(false);
  });
});
