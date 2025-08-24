// utils/badges.js
import { getAllAttempts, computeDayStreak } from "./progressStats";

/** ----- Badge image registry (badge1.png … badge35.png) ----- */
const BADGE_IMGS = [
  require("../assets/Badge/badge1.png"),
  require("../assets/Badge/badge2.png"),
  require("../assets/Badge/badge3.png"),
  require("../assets/Badge/badge4.png"),
  require("../assets/Badge/badge5.png"),
  require("../assets/Badge/badge6.png"),
  require("../assets/Badge/badge7.png"),
  require("../assets/Badge/badge8.png"),
  require("../assets/Badge/badge9.png"),
  require("../assets/Badge/badge10.png"),
  require("../assets/Badge/badge11.png"),
  require("../assets/Badge/badge12.png"),
  require("../assets/Badge/badge13.png"),
  require("../assets/Badge/badge14.png"),
  require("../assets/Badge/badge15.png"),
  require("../assets/Badge/badge16.png"),
  require("../assets/Badge/badge17.png"),
  require("../assets/Badge/badge18.png"),
  require("../assets/Badge/badge19.png"),
  require("../assets/Badge/badge20.png"),
  require("../assets/Badge/badge21.png"),
  require("../assets/Badge/badge22.png"),
  require("../assets/Badge/badge23.png"),
  require("../assets/Badge/badge24.png"),
  require("../assets/Badge/badge25.png"),
  require("../assets/Badge/badge26.png"),
  require("../assets/Badge/badge27.png"),
  require("../assets/Badge/badge28.png"),
  require("../assets/Badge/badge29.png"),
  require("../assets/Badge/badge30.png"),
  require("../assets/Badge/badge31.png"),
  require("../assets/Badge/badge32.png"),
  require("../assets/Badge/badge33.png"),
  require("../assets/Badge/badge34.png"),
  require("../assets/Badge/badge35.png"),
];

const imgFor = (i) => BADGE_IMGS[i % BADGE_IMGS.length];
const pct = (num, den) => (den ? Math.min(100, Math.round((num / den) * 100)) : 0);

/** Optional helpers you can reuse elsewhere */
export const isLocked = (b) => !b?.achieved;

export function getCongratsText(b) {
  if (!b) return "";
  if (b.id?.startsWith("fast"))
    return "Impressive progress! You’ve finished a quiz under 1 minute like a champ!";
  if (b.id?.startsWith("perfect"))
    return "Perfect score! Keep that streak of excellence going!";
  if (b.id?.startsWith("daily"))
    return "Daily dedication pays off—nice consistency!";
  if (b.id?.startsWith("xp-")) return "Your XP keeps stacking—awesome effort!";
  if (b.id?.startsWith("streak")) return "You’re on fire—what a streak!";
  return "Great job! Keep it up!";
}

/** Localized share payload (accepts optional t) */
export function buildSharePayload(badge, t) {
  const fallbackTitle = `Unlocked: ${badge.title}`;
  const fallbackMsg = `I just unlocked the "${badge.title}" badge! ${badge.desc}`;
  if (typeof t === "function") {
    return {
      title: t("badges.share.title", { title: badge.title, defaultValue: fallbackTitle }),
      message: t("badges.share.message", { title: badge.title, desc: badge.desc, defaultValue: fallbackMsg }),
    };
  }
  return { title: fallbackTitle, message: fallbackMsg };
}

/** Build the badge list + summary from persisted attempts */
export async function buildBadgeList(t) {
  const attempts = await getAllAttempts();
  const totalDone = attempts.length;
  const perfects = attempts.filter((a) => a.total > 0 && a.correct === a.total).length;
  const dailyDone = attempts.filter((a) => a.type === "daily").length;
  const under1m = attempts.filter((a) => (a.timeTakenSec ?? 0) > 0 && a.timeTakenSec <= 60).length;
  const xpTotal = attempts.reduce((s, a) => s + (a.xpEarned || 0), 0);
  const streak = computeDayStreak(attempts);

  const quizThresholds    = [1, 5, 10, 20, 30];
  const perfectThresholds = [1, 5, 10, 20, 30];
  const dailyThresholds   = [1, 3, 7, 15, 30];
  const xpThresholds      = [100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  const fastThresholds    = [1, 10, 30];
  const streakThresholds  = [1, 3, 7, 21, 50, 100, 200, 365];

  const items = [];
  let idx = 0;

  // Helper translators with fallbacks
  const tt = typeof t === "function" ? t : (k, d) => d;

  // Quizzes completed
  quizThresholds.forEach((count, i) => {
    const id = `quiz-${count}`;
    const title =
      i === 0
        ? tt("badges.templates.quiz.title_first", "First Quiz")
        : tt("badges.templates.quiz.title_many", "Knowledge Seeker");
    const desc =
      i === 0
        ? tt("badges.templates.quiz.desc_first", "Complete your first quiz")
        : tt("badges.templates.quiz.desc_many", "Complete {{count}} quizzes", { count });
    items.push({
      id,
      title,
      desc: typeof desc === "string" ? desc.replace("{{count}}", String(count)) : desc,
      progress: pct(totalDone, count),
      achieved: totalDone >= count,
      icon: imgFor(idx++),
    });
  });

  // Perfect scores
  perfectThresholds.forEach((count, i) => {
    const id = `perfect-${count}`;
    const title =
      i === 0
        ? tt("badges.templates.perfect.title_first", "Perfectionist")
        : tt("badges.templates.perfect.title_many", "Consistent Ace");
    const desc =
      i === 0
        ? tt("badges.templates.perfect.desc_first", "Get a perfect quiz score")
        : tt("badges.templates.perfect.desc_many", "Get {{count}} perfect scores", { count });
    items.push({
      id,
      title,
      desc: typeof desc === "string" ? desc.replace("{{count}}", String(count)) : desc,
      progress: pct(perfects, count),
      achieved: perfects >= count,
      icon: imgFor(idx++),
    });
  });

  // Daily challenges
  dailyThresholds.forEach((count, i) => {
    const id = `daily-${count}`;
    const title =
      i === 0
        ? tt("badges.templates.daily.title_first", "Daily Challenger")
        : tt("badges.templates.daily.title_many", "Daily Grinder");
    const desc = tt(
      "badges.templates.daily.desc_many",
      "Complete {{count}} daily challenge{{s}}",
      { count, s: count > 1 ? "s" : "" }
    );
    items.push({
      id,
      title,
      desc:
        typeof desc === "string"
          ? desc.replace("{{count}}", String(count)).replace("{{s}}", count > 1 ? "s" : "")
          : desc,
      progress: pct(dailyDone, count),
      achieved: dailyDone >= count,
      icon: imgFor(idx++),
    });
  });

  // Cumulative XP
  xpThresholds.forEach((count) => {
    const id = `xp-${count}`;
    const title = tt("badges.templates.xp.title", "XP Collector");
    const desc = tt("badges.templates.xp.desc", "Earn {{count}} XP in total", { count });
    items.push({
      id,
      title,
      desc: typeof desc === "string" ? desc.replace("{{count}}", String(count)) : desc,
      progress: pct(xpTotal, count),
      achieved: xpTotal >= count,
      icon: imgFor(idx++),
    });
  });

  // Fast finishes
  fastThresholds.forEach((count, i) => {
    const id = `fast-${count}`;
    const title =
      i === 0
        ? tt("badges.templates.fast.title_first", "Fast Learner")
        : tt("badges.templates.fast.title_many", "Speed Runner");
    const desc =
      i === 0
        ? tt("badges.templates.fast.desc_first", "Finish a quiz under 1 minute")
        : tt("badges.templates.fast.desc_many", "Finish {{count}} quizzes under 1 minute", { count });
    items.push({
      id,
      title,
      desc: typeof desc === "string" ? desc.replace("{{count}}", String(count)) : desc,
      progress: pct(under1m, count),
      achieved: under1m >= count,
      icon: imgFor(idx++),
    });
  });

  // Day streak
  streakThresholds.forEach((count, i) => {
    const id = `streak-${count}`;
    const title =
      i === 0
        ? tt("badges.templates.streak.title_first", "On a Roll")
        : tt("badges.templates.streak.title_many", "Streak Keeper");
    const desc = tt("badges.templates.streak.desc", "{{count}}-day streak", { count });
    items.push({
      id,
      title,
      desc: typeof desc === "string" ? desc.replace("{{count}}", String(count)) : desc,
      progress: pct(streak, count),
      achieved: streak >= count,
      icon: imgFor(idx++),
    });
  });

  const summary = {
    badgesEarned: items.filter((b) => b.achieved).length,
    points: Math.round(xpTotal),
  };

  return { items, summary };
}