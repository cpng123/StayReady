const ATTEMPTS_KEY = "quiz:attempts:v1";

// -------------------- AsyncStorage mock (in-memory) --------------------
const memory = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k) => Promise.resolve(memory[k] ?? null)),
  setItem: jest.fn((k, v) => {
    memory[k] = v;
    return Promise.resolve();
  }),
}));

import {
  addQuizAttempt,
  getAllAttempts,
  computeDayStreak,
  getStatsSummary,
} from "../../utils/progressStats";

// -------------------- Time helpers --------------------
const realNow = Date.now;

// freeze “now”
const BASE_NOW = new Date("2025-09-03T12:00:00+08:00").getTime(); // SG time
jest.useFakeTimers();
jest.setSystemTime(new Date("2025-09-03T12:00:00+08:00"));
beforeAll(() => {
  // Keep Date constructor functional; we don't need to fully freeze Date here
});

afterAll(() => {
  jest.useRealTimers();
});

// Small helper to make a local timestamp N days ago (noon SG time)
const daysAgoTs = (n) => {
  const d = new Date(BASE_NOW);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.getTime();
};

// Convenience to read what we stored
const getStoredArray = () =>
  (memory[ATTEMPTS_KEY] ? JSON.parse(memory[ATTEMPTS_KEY]) : []) || [];

// -------------------- Tests --------------------

beforeEach(() => {
  Object.keys(memory).forEach((k) => delete memory[k]);
  jest.clearAllMocks();
});

describe("addQuizAttempt()", () => {
  test("creates correct entry with stable keys and percent", async () => {
    const ts = daysAgoTs(0);
    const entry = await addQuizAttempt({
      type: "set",
      meta: { setTitle: "First Aid Basics", categoryId: "safety" },
      correct: 7,
      total: 10,
      timeTakenSec: 53,
      xpEarned: 120,
      timestamp: ts,
    });

    expect(entry.key).toMatch(/^set:/);
    expect(entry.type).toBe("set");
    expect(entry.percent).toBe(70);
    expect(entry.meta).toEqual({
      setId: "safety:first-aid-basics",
      setTitle: "First Aid Basics",
      categoryId: "safety",
    });
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const stored = getStoredArray();
    expect(stored).toHaveLength(1);
    expect(stored[0].key).toBe(entry.key);
  });

  test("type=daily uses daily:<dayKey> and normalizes numbers", async () => {
    const ts = daysAgoTs(1);
    const saved = await addQuizAttempt({
      type: "daily",
      meta: {
        dayKey: "2025-09-02",
        setTitle: "Daily Challenge",
        categoryId: "daily",
      },
      correct: "5",
      total: "5",
      timeTakenSec: "61",
      xpEarned: "50",
      timestamp: ts,
    });
    expect(saved.key).toBe("daily:2025-09-02");
    expect(saved.percent).toBe(100);
    expect(saved.timeTakenSec).toBe(61);
    expect(saved.xpEarned).toBe(50);
  });

  test("trims to the most recent 500 attempts", async () => {
    // Preload 510 older attempts
    const bulk = [];
    for (let i = 0; i < 510; i++) {
      bulk.push({
        key: `set:mock-${i}`,
        type: "set",
        correct: 1,
        total: 2,
        percent: 50,
        timeTakenSec: 10,
        xpEarned: 1,
        meta: { setId: `mock-${i}`, setTitle: "M", categoryId: "C" },
        date: "2025-09-01",
        ts: daysAgoTs(510 - i), // older first
      });
    }
    memory[ATTEMPTS_KEY] = JSON.stringify(bulk);

    // Add a fresh one now
    const fresh = await addQuizAttempt({
      meta: { setTitle: "Newest", categoryId: "C" },
      correct: 2,
      total: 4,
      timestamp: daysAgoTs(0),
    });

    const stored = getStoredArray();
    expect(stored).toHaveLength(500);
    // Should contain the newest
    expect(stored[0].key).toBe(fresh.key);
    // Oldest 11 should be dropped (510 + 1 → keep last 500)
    const keys = new Set(stored.map((a) => a.key));
    expect(keys.has("set:mock-0")).toBe(false);
  });
});

describe("getAllAttempts()", () => {
  test("normalizes missing percent/date and sorts by ts desc", async () => {
    const a = {
      key: "set:a",
      type: "set",
      correct: 3,
      total: 5,
      // percent missing -> computed 60
      timeTakenSec: 10,
      xpEarned: 5,
      meta: { setId: "a", setTitle: "A", categoryId: "C" },
      ts: daysAgoTs(2),
    };
    const b = {
      key: "set:b",
      type: "set",
      correct: 4,
      total: 4,
      percent: 100,
      timeTakenSec: "7",
      xpEarned: "9",
      meta: { setId: "b", setTitle: "B", categoryId: "C" },
      // date missing -> filled from ts
      ts: daysAgoTs(0),
    };
    memory[ATTEMPTS_KEY] = JSON.stringify([a, b]);

    const list = await getAllAttempts();
    expect(list).toHaveLength(2);
    // sorted newest first
    expect(list[0].key).toBe("set:b");
    // normalization
    expect(list[1].percent).toBe(60);
    expect(typeof list[0].date).toBe("string");
    expect(list[0].timeTakenSec).toBe(7);
    expect(list[0].xpEarned).toBe(9);
  });
});

describe("computeDayStreak()", () => {
  test("counts consecutive days including today", () => {
    // Create attempts on today, yesterday, 2 days ago, and a gap afterwards
    const make = (ts) => ({
      key: `k-${ts}`,
      type: "set",
      correct: 1,
      total: 1,
      percent: 100,
      timeTakenSec: 1,
      xpEarned: 1,
      meta: {},
      date: (() => {
        const d = new Date(ts);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      })(),
      ts,
    });

    const attempts = [0, 1, 2].map((n) => make(daysAgoTs(n)));
    // Add another attempt with a gap (4 days ago) — shouldn't extend the streak
    attempts.push(make(daysAgoTs(4)));

    const streak = computeDayStreak(attempts);
    expect(streak).toBe(3);
  });

  test("zero when no attempt today", () => {
    const attempts = [
      { date: "2025-09-01", ts: daysAgoTs(2) },
      { date: "2025-09-02", ts: daysAgoTs(1) },
    ];
    const streak = computeDayStreak(attempts);
    expect(streak).toBe(0);
  });
});

describe("getStatsSummary()", () => {
  test("returns unique sets taken, accuracy over last 5, and current streak", async () => {
    // Build 6 attempts so accuracy averages last 5
    const mk = (i, { correct, total, ts }) => ({
      key: `set:${i % 2 === 0 ? "A" : "B"}`, // two unique sets
      type: "set",
      correct,
      total,
      percent: Math.round((correct / total) * 100),
      timeTakenSec: 10,
      xpEarned: 10,
      meta: { setId: i % 2 === 0 ? "A" : "B", setTitle: "S", categoryId: "C" },
      date: (() => {
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;
      })(),
      ts,
    });

    const attempts = [
      mk(0, { correct: 5, total: 10, ts: daysAgoTs(5) }), // 50
      mk(1, { correct: 6, total: 10, ts: daysAgoTs(4) }), // 60
      mk(2, { correct: 7, total: 10, ts: daysAgoTs(3) }), // 70
      mk(3, { correct: 8, total: 10, ts: daysAgoTs(2) }), // 80
      mk(4, { correct: 9, total: 10, ts: daysAgoTs(1) }), // 90
      mk(5, { correct: 10, total: 10, ts: daysAgoTs(0) }), // 100
    ];
    memory[ATTEMPTS_KEY] = JSON.stringify(attempts);

    const { taken, accuracy, streak } = await getStatsSummary();
    expect(taken).toBe(2);
    expect(accuracy).toBe(80);
  });
});
