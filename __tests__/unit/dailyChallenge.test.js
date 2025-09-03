const DAILY_SET_KEY = "daily:set:v2";
const DAILY_STATUS_KEY = "daily:status:v1";
const DAILY_COUNT = 10;

// ---------------- AsyncStorage mock ----------------
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
  getOrCreateDailySet,
  getDailyStatus,
  markDailyCompleted,
  getDailyToday,
} from "../../utils/dailyChallenge";

// --------------- Time helpers (mock Date) ---------------
const RealDate = Date;
let currentISO = "2025-09-03T09:00:00.000"; // default 9:00 (after rollover)

function setMockDate(isoLocalNoZ) {
  // isoLocalNoZ = "YYYY-MM-DDTHH:mm:ss.sss"
  currentISO = isoLocalNoZ;
  const asUTC = new Date(isoLocalNoZ).toISOString();
  // Replace global Date so that `new Date()` and `Date.now()` return our time
  // while still allowing constructed Dates with args to work.
  // Note: Using local time in test runner's TZ; by passing a string without 'Z'
  // we simulate local clock at given hour for getHours().
  // eslint-disable-next-line no-global-assign
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) return new RealDate(asUTC);
      return new RealDate(...args);
    }
    static now() {
      return new RealDate(asUTC).getTime();
    }
    static parse = RealDate.parse;
    static UTC = RealDate.UTC;
  };
}
function resetDate() {
  // eslint-disable-next-line no-global-assign
  global.Date = RealDate;
}

beforeEach(() => {
  Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  jest.clearAllMocks();
  setMockDate("2025-09-03T09:00:00.000"); // 9am local by default (today)
});
afterAll(() => resetDate());

// --------------- Quiz data fixture ---------------
/**
 * Build quizData with N categories, each having 2 sets and 3 questions
 * with mixed option shapes to exercise normalization.
 */
function buildQuizData(nCats = 12) {
  const categories = [];
  for (let c = 1; c <= nCats; c++) {
    const catId = `cat-${c}`;
    categories.push({
      id: catId,
      title: `Category ${c}`,
      sets: [
        {
          id: `set-${c}-1`,
          title: `Set A ${c}`,
          questions: [
            {
              id: `Q-${c}-A1`,
              text: `Question A1 of ${c}`,
              options: ["A1", "B1", "C1"],
              correctIndex: 1,
            },
            {
              id: `Q-${c}-A2`,
              question: `Question A2 of ${c}`,
              options: [{ text: "A2" }, { text: "B2" }, { text: "C2" }],
              // use 'answerIndex' instead of correctIndex
              answerIndex: 2,
            },
            {
              id: `Q-${c}-A3`,
              prompt: `Question A3 of ${c}`,
              options: ["X", "Y"],
              // invalid index should clamp to 0
              correctIndex: 9,
            },
          ],
        },
        {
          id: `set-${c}-2`,
          title: `Set B ${c}`,
          questions: [
            {
              id: `Q-${c}-B1`,
              title: `Question B1 of ${c}`,
              options: ["D", "E", "F"],
              // different accepted key name
              correct: 0,
            },
            {
              id: `Q-${c}-B2`,
              text: `Question B2 of ${c}`,
              options: ["G", "H"],
              answer: 1,
            },
            {
              id: `Q-${c}-B3`,
              text: `Question B3 of ${c}`,
              options: [{ text: "I" }, { text: "J" }],
              // no answer fields -> default 0
            },
          ],
        },
      ],
    });
  }
  return { categories };
}

// --------------- Tests ---------------

describe("getOrCreateDailySet()", () => {
  it("creates exactly DAILY_COUNT questions (1 per picked category) and persists cache", async () => {
    const quizData = buildQuizData(12);
    const set = await getOrCreateDailySet(quizData);

    expect(set).toBeTruthy();
    expect(set.dayKey).toBe("2025-09-03");
    expect(Array.isArray(set.questions)).toBe(true);
    expect(set.questions).toHaveLength(DAILY_COUNT);

    // Cache written
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      DAILY_SET_KEY,
      expect.any(String)
    );

    // Each question has normalized shape
    for (const q of set.questions) {
      expect(q).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          categoryId: expect.stringMatching(/^cat-/),
          categoryLabel: expect.stringMatching(/^Category /),
          setId: expect.stringMatching(/^set-/),
          setTitle: expect.stringMatching(/^Set /),
          text: expect.any(String),
          options: expect.any(Array),
          answerIndex: expect.any(Number),
        })
      );
      // answerIndex must be within options length
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(q.options.length);
    }
  });

  it("is deterministic: same day → same questions; uses cached set when available", async () => {
    const quizData = buildQuizData(15);

    const first = await getOrCreateDailySet(quizData);
    const firstIds = first.questions.map((q) => q.id);

    // Call again — should return cached set with identical ids
    const second = await getOrCreateDailySet(quizData);
    const secondIds = second.questions.map((q) => q.id);

    expect(second.dayKey).toBe(first.dayKey);
    expect(secondIds).toEqual(firstIds);

    // Ensure we didn't write the set a second time (status may be written though)
    const setWrites = (AsyncStorage.setItem.mock.calls || []).filter(
      ([key]) => key === DAILY_SET_KEY
    );
    expect(setWrites.length).toBe(1);
  });

  it("initializes today's status when creating a fresh set (completed=false)", async () => {
    const quizData = buildQuizData(10);
    const set = await getOrCreateDailySet(quizData);

    const statusRaw = memoryStore[DAILY_STATUS_KEY];
    expect(statusRaw).toBeTruthy();
    const status = JSON.parse(statusRaw);
    expect(status).toMatchObject({
      dayKey: set.dayKey,
      completed: false,
      review: [],
      meta: null,
    });
  });
});

describe("8am rollover behavior", () => {
  it("before 8am local counts as previous day", async () => {
    setMockDate("2025-09-03T07:30:00.000"); // 7:30am → use 2025-09-02
    const quizData = buildQuizData(10);
    const set = await getOrCreateDailySet(quizData);
    expect(set.dayKey).toBe("2025-09-02");

    const status = await getDailyStatus();
    expect(status.dayKey).toBe("2025-09-02");
  });

  it("after 8am switches to today and resets status for new day", async () => {
    // First at 7am -> dayKey is previous day
    setMockDate("2025-09-03T07:00:00.000");
    const quizData = buildQuizData(10);
    const setPrev = await getOrCreateDailySet(quizData);
    await markDailyCompleted([{ id: "Q-prev" }], { score: 10 });

    // Move clock to 9am same calendar day -> dayKey becomes 2025-09-03
    setMockDate("2025-09-03T09:00:00.000");
    const statusNow = await getDailyStatus();
    expect(statusNow.dayKey).toBe("2025-09-03");
    expect(statusNow.completed).toBe(false);
    expect(statusNow.review).toEqual([]);
    expect(statusNow.meta).toBeNull();

    const setNow = await getOrCreateDailySet(quizData);
    expect(setNow.dayKey).toBe("2025-09-03");
    // The previous set was for 2025-09-02; today's should be different key
    expect(setPrev.dayKey).not.toBe(setNow.dayKey);
  });
});

describe("status helpers", () => {
  it("getDailyStatus creates fresh record when none exists", async () => {
    const s = await getDailyStatus();
    expect(s).toEqual({
      dayKey: "2025-09-03",
      completed: false,
      review: [],
      meta: null,
    });
  });

  it("markDailyCompleted persists completed=true with review/meta", async () => {
    const result = await markDailyCompleted([{ id: "r1" }], { score: 7 });
    expect(result).toEqual({
      dayKey: "2025-09-03",
      completed: true,
      review: [{ id: "r1" }],
      meta: { score: 7 },
    });

    const raw = memoryStore[DAILY_STATUS_KEY];
    expect(JSON.parse(raw)).toEqual(result);
  });
});

describe("getDailyToday()", () => {
  it("returns merged set + status for today", async () => {
    const quizData = buildQuizData(14);
    const set = await getOrCreateDailySet(quizData);
    await markDailyCompleted([{ id: "chk" }], { score: 9 });

    const today = await getDailyToday(quizData);
    expect(today.key).toBe(`daily-${set.dayKey}`);
    expect(today.questions).toHaveLength(DAILY_COUNT);
    expect(today.completed).toBe(true);
    expect(today.review).toEqual([{ id: "chk" }]);
    expect(today.meta).toEqual({ score: 9 });
  });

  it("when status dayKey differs, getDailyToday returns set with completed=false and default meta", async () => {
    const quizData = buildQuizData(10);

    // Seed a set/status for previous day
    setMockDate("2025-09-02T09:10:00.000");
    const setPrev = await getOrCreateDailySet(quizData);
    await markDailyCompleted([{ id: "prev" }], { score: 5 });

    // Move to next day 9am; set will be regenerated, status resets
    setMockDate("2025-09-03T09:10:00.000");
    const today = await getDailyToday(quizData);

    expect(today.completed).toBe(false);
    expect(today.review).toEqual([]);
    expect(today.meta).toEqual({
      setId: `daily-${today.key.split("daily-")[1]}`,
      setTitle: "Daily Challenge",
      categoryId: "daily",
      categoryLabel: "Daily",
    });
    expect(today.questions).toHaveLength(DAILY_COUNT);
    expect(today.key).toBe(`daily-2025-09-03`);
  });
});
