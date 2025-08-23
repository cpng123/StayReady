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

export function buildSharePayload(badge) {
  return {
    title: `Unlocked: ${badge.title}`,
    message: `I just unlocked the "${badge.title}" badge! ${badge.desc}`,
  };
}

/** Build the badge list + summary from persisted attempts */
export async function buildBadgeList() {
  const attempts = await getAllAttempts(); // [{type, correct, total, xpEarned, timeTakenSec, ts, ...}]
  const totalDone = attempts.length;
  const perfects = attempts.filter((a) => a.total > 0 && a.correct === a.total).length;
  const dailyDone = attempts.filter((a) => a.type === "daily").length;
  const under1m = attempts.filter((a) => (a.timeTakenSec ?? 0) > 0 && a.timeTakenSec <= 60).length;
  const xpTotal = attempts.reduce((s, a) => s + (a.xpEarned || 0), 0);
  const streak = computeDayStreak(attempts);

  // Threshold groups
  const quizThresholds    = [1, 5, 10, 20, 30];
  const perfectThresholds = [1, 5, 10, 20, 30];
  const dailyThresholds   = [1, 3, 7, 15, 30];
  const xpThresholds      = [100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  const fastThresholds    = [1, 10, 30];
  const streakThresholds  = [1, 3, 7, 21, 50, 100, 200, 365];

  const items = [];
  let idx = 0;

  // Quizzes completed (total count)
  quizThresholds.forEach((t, i) => {
    items.push({
      id: `quiz-${t}`,
      title: i === 0 ? "First Quiz" : "Knowledge Seeker",
      desc: i === 0 ? "Complete your first quiz" : `Complete ${t} quizzes`,
      progress: pct(totalDone, t),
      achieved: totalDone >= t,
      icon: imgFor(idx++),
    });
  });

  // Perfect scores
  perfectThresholds.forEach((t, i) => {
    items.push({
      id: `perfect-${t}`,
      title: i === 0 ? "Perfectionist" : "Consistent Ace",
      desc: i === 0 ? "Get a perfect quiz score" : `Get ${t} perfect scores`,
      progress: pct(perfects, t),
      achieved: perfects >= t,
      icon: imgFor(idx++),
    });
  });

  // Daily challenges
  dailyThresholds.forEach((t, i) => {
    items.push({
      id: `daily-${t}`,
      title: i === 0 ? "Daily Challenger" : "Daily Grinder",
      desc: `Complete ${t} daily challenge${t > 1 ? "s" : ""}`,
      progress: pct(dailyDone, t),
      achieved: dailyDone >= t,
      icon: imgFor(idx++),
    });
  });

  // Cumulative XP
  xpThresholds.forEach((t) => {
    items.push({
      id: `xp-${t}`,
      title: "XP Collector",
      desc: `Earn ${t} XP in total`,
      progress: pct(xpTotal, t),
      achieved: xpTotal >= t,
      icon: imgFor(idx++),
    });
  });

  // Fast finishes (under 1 minute)
  fastThresholds.forEach((t, i) => {
    items.push({
      id: `fast-${t}`,
      title: i === 0 ? "Fast Learner" : "Speed Runner",
      desc: i === 0 ? "Finish a quiz under 1 minute" : `Finish ${t} quizzes under 1 minute`,
      progress: pct(under1m, t),
      achieved: under1m >= t,
      icon: imgFor(idx++),
    });
  });

  // Day streak
  streakThresholds.forEach((t, i) => {
    items.push({
      id: `streak-${t}`,
      title: i === 0 ? "On a Roll" : "Streak Keeper",
      desc: `${t}-day streak`,
      progress: pct(streak, t),
      achieved: streak >= t,
      icon: imgFor(idx++),
    });
  });

  // Summary for the header counters
  const summary = {
    badgesEarned: items.filter((b) => b.achieved).length,
    points: Math.round(xpTotal),
  };

  return { items, summary };
}
