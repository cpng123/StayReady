jest.mock("../../utils/progressStats", () => ({
  getAllAttempts: jest.fn(),
  computeDayStreak: jest.fn(),
}));

import {
  isLocked,
  getCongratsText,
  buildSharePayload,
  buildBadgeList,
} from "../../utils/badges";
import { getAllAttempts, computeDayStreak } from "../../utils/progressStats";

// ---------- Fixtures ----------
const attemptsFixture = [
  // normal quizzes
  {
    id: "a1",
    type: "normal",
    total: 10,
    correct: 8,
    timeTakenSec: 120,
    xpEarned: 120,
  },
  {
    id: "a2",
    type: "normal",
    total: 10,
    correct: 10,
    timeTakenSec: 50,
    xpEarned: 150,
  }, // perfect + fast
  {
    id: "a3",
    type: "normal",
    total: 8,
    correct: 8,
    timeTakenSec: 55,
    xpEarned: 130,
  }, // perfect + fast
  {
    id: "a4",
    type: "normal",
    total: 12,
    correct: 6,
    timeTakenSec: 200,
    xpEarned: 90,
  },

  // daily challenges
  {
    id: "d1",
    type: "daily",
    total: 6,
    correct: 6,
    timeTakenSec: 58,
    xpEarned: 110,
  }, // perfect + fast + daily
  {
    id: "d2",
    type: "daily",
    total: 5,
    correct: 3,
    timeTakenSec: 140,
    xpEarned: 70,
  },
];

const streakValue = 5; // 5-day streak

// ---------- Shared mocks ----------
beforeEach(() => {
  jest.clearAllMocks();
  getAllAttempts.mockResolvedValue([...attemptsFixture]);
  computeDayStreak.mockReturnValue(streakValue);
});

// ---------- Small helpers ----------
describe("helpers", () => {
  test("isLocked", () => {
    expect(isLocked({ achieved: true })).toBe(false);
    expect(isLocked({ achieved: false })).toBe(true);
    expect(isLocked(null)).toBe(true);
  });

  test("getCongratsText families", () => {
    expect(getCongratsText({ id: "fast-1" })).toMatch(/under 1 minute/i);
    expect(getCongratsText({ id: "perfect-1" })).toMatch(/Perfect score/i);
    expect(getCongratsText({ id: "daily-1" })).toMatch(/Daily dedication/i);
    expect(getCongratsText({ id: "xp-100" })).toMatch(/XP keeps stacking/i);
    expect(getCongratsText({ id: "streak-3" })).toMatch(/streak/i);
    expect(getCongratsText({ id: "quiz-1" })).toMatch(/Great job/i);
  });

  test("buildSharePayload with and without translator", () => {
    const badge = { title: "Perfectionist", desc: "Get a perfect quiz score" };

    const noT = buildSharePayload(badge);
    expect(noT.title).toBe("Unlocked: Perfectionist");
    expect(noT.message).toMatch(/I just unlocked/);

    const t = (key, vars) => {
      if (key === "badges.share.title") return `解锁：${vars.title}`;
      if (key === "badges.share.message")
        return `我刚解锁了「${vars.title}」！${vars.desc}`;
      return vars?.defaultValue ?? key;
    };
    const withT = buildSharePayload(badge, t);
    expect(withT.title).toBe("解锁：Perfectionist");
    expect(withT.message).toBe(
      "我刚解锁了「Perfectionist」！Get a perfect quiz score"
    );
  });
});

// ---------- Main builder ----------
describe("buildBadgeList()", () => {
  test("builds items with correct progress/achieved and summary", async () => {
    const { items, summary } = await buildBadgeList();

    // Derived stats from fixture:
    // totalDone = 6 attempts
    // perfects  = 3 (a2, a3, d1)
    // dailyDone = 2 (d1, d2)
    // under1m   = 3 (a2, a3, d1)
    // xpTotal   = 120 + 150 + 130 + 90 + 110 + 70 = 670
    // streak    = 5

    // --- Representative checks across families ---

    // Quizzes completed: thresholds [1,5,10,20,30]
    const quiz5 = items.find((b) => b.id === "quiz-5");
    expect(quiz5).toBeTruthy();
    expect(quiz5.achieved).toBe(true); // 6 >= 5
    expect(quiz5.progress).toBe(100); // clamp to 100

    const quiz10 = items.find((b) => b.id === "quiz-10");
    expect(quiz10.achieved).toBe(false); // 6 < 10
    expect(quiz10.progress).toBe(Math.round((6 / 10) * 100)); // 60

    // Perfect scores: thresholds [1,5,10,20,30]
    const perfect1 = items.find((b) => b.id === "perfect-1");
    const perfect5 = items.find((b) => b.id === "perfect-5");
    expect(perfect1.achieved).toBe(true); // 3 >= 1
    expect(perfect5.achieved).toBe(false); // 3 < 5
    expect(perfect5.progress).toBe(Math.round((3 / 5) * 100)); // 60

    // Daily challenges: thresholds [1,3,7,15,30]
    const daily3 = items.find((b) => b.id === "daily-3");
    expect(daily3.achieved).toBe(false); // 2 < 3
    expect(daily3.progress).toBe(Math.round((2 / 3) * 100)); // 67

    const daily1 = items.find((b) => b.id === "daily-1");
    expect(daily1.achieved).toBe(true);

    // XP thresholds include 100, 250, 500, 1000, ...
    const xp500 = items.find((b) => b.id === "xp-500");
    const xp1000 = items.find((b) => b.id === "xp-1000");
    expect(xp500.achieved).toBe(true); // 670 >= 500
    expect(xp1000.achieved).toBe(false); // 670 < 1000
    expect(xp1000.progress).toBe(Math.round((670 / 1000) * 100)); // 67

    // Fast finishes: thresholds [1,10,30]; under1m=3
    const fast1 = items.find((b) => b.id === "fast-1");
    const fast10 = items.find((b) => b.id === "fast-10");
    expect(fast1.achieved).toBe(true);
    expect(fast10.achieved).toBe(false);
    expect(fast10.progress).toBe(Math.round((3 / 10) * 100)); // 30

    // Streak thresholds include 1,3,7,21,...
    const streak3 = items.find((b) => b.id === "streak-3");
    const streak7 = items.find((b) => b.id === "streak-7");
    expect(streak3.achieved).toBe(true); // 5 >= 3
    expect(streak7.achieved).toBe(false); // 5 < 7
    expect(streak7.progress).toBe(Math.round((5 / 7) * 100)); // 71

    // Summary
    expect(summary).toBeTruthy();
    expect(summary.points).toBe(670);
    // badgesEarned should match achieved count
    const computedEarned = items.filter((b) => b.achieved).length;
    expect(summary.badgesEarned).toBe(computedEarned);
  });

  test("translator function is used to localize titles/descriptions", async () => {
    const t = (key, defOrStr, vars) => {
      // The code calls t with either (k, defaultValueString) or (k, template, {count})
      if (key.includes("templates.quiz.title_first")) return "第一份测验";
      if (key.includes("templates.quiz.desc_first"))
        return "完成你的第一份测验";
      if (key.includes("templates.xp.title")) return "经验收集者";
      if (key.includes("templates.xp.desc")) return "累计获得 {{count}} 经验";
      // passthrough defaultValue string if provided as second arg
      return defOrStr?.defaultValue || defOrStr || key;
    };

    const { items } = await buildBadgeList(t);

    const firstQuiz = items.find((b) => b.id === "quiz-1");
    expect(firstQuiz.title).toBe("第一份测验");
    expect(firstQuiz.desc).toBe("完成你的第一份测验");

    const xp100 = items.find((b) => b.id === "xp-100");
    expect(xp100.title).toBe("经验收集者");
    expect(xp100.desc).toBe("累计获得 100 经验");
  });

  test("empty attempts → progress 0 and nothing achieved", async () => {
    getAllAttempts.mockResolvedValueOnce([]);
    computeDayStreak.mockReturnValueOnce(0);

    const { items, summary } = await buildBadgeList();

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((b) => b.progress === 0)).toBe(true);
    expect(items.every((b) => b.achieved === false)).toBe(true);
    expect(summary.points).toBe(0);
    expect(summary.badgesEarned).toBe(0);
  });
});
