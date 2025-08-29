/**
 * File: utils/progressStats.js
 * Purpose: Persist and compute quiz progress statistics for StayReady.
 *  - Store completed quiz attempts (set-based and daily challenges) in AsyncStorage.
 *  - Provide normalized read APIs and lightweight aggregates (accuracy, streak).
 *  - Compute day streaks based on calendar days with at least one attempt.
 *
 * Storage:
 *  - Key: "quiz:attempts:v1"
 *  - Each attempt entry:
 *      {
 *        key: "set:<stableSetId>" | "daily:<dayKey>",
 *        type: "set" | "daily",
 *        correct, total, percent, timeTakenSec, xpEarned,
 *        meta: { setId, setTitle, categoryId },
 *        date: "YYYY-MM-DD",
 *        ts: epochMs
 *      }
 *
 * Notes:
 *  - We cap stored attempts to the 500 most recent to bound storage usage.
 *  - `stableSetId` makes a consistent identifier even if the caller omits one.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const ATTEMPTS_KEY = "quiz:attempts:v1";

// zero-pad helper for month/day
const pad = (n) => String(n).padStart(2, "0");

// build YYYY-MM-DD from timestamp (local time)
const dateKeyFromTs = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* ------------------------------ storage I/O ------------------------------ */

// Load all persisted attempts (empty array on any error)
async function loadAttempts() {
  try {
    const raw = await AsyncStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Save full attempt array (overwrite). Caller ensures trimming/sorting.
async function saveAttempts(arr) {
  try {
    await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(arr));
  } catch {}
}

/* --------------------------- id normalization --------------------------- */

// Build a stable set-id if caller didn’t pass one
const stableSetId = (meta = {}) => {
  if (meta.setId) return String(meta.setId);
  const cid = String(meta.categoryId || "cat");
  const st = String(meta.setTitle || "set").toLowerCase().replace(/\s+/g, "-");
  return `${cid}:${st}`; // stable across runs for same set title/category
};

/* ------------------------------- mutators ------------------------------- */

// Add a completed attempt (type: 'set' | 'daily'); returns the entry we stored
export async function addQuizAttempt({
  type = "set",
  meta = {},            // { setId?, setTitle?, categoryId?, dayKey? }
  correct = 0,
  total = 0,
  timeTakenSec = 0,
  xpEarned = 0,
  timestamp,
}) {
  const ts = typeof timestamp === "number" ? timestamp : Date.now();
  const percent = total > 0 ? Math.round((Number(correct) / Number(total)) * 100) : 0;

  // Unique key for “quiz taken”
  const sid = stableSetId(meta);
  const dailyKey = meta.dayKey || sid || dateKeyFromTs(ts);
  const key = type === "daily" ? `daily:${dailyKey}` : `set:${sid}`;

  const entry = {
    key,
    type,
    correct,
    total,
    percent,
    timeTakenSec: Number(timeTakenSec) || 0,
    xpEarned: Number(xpEarned) || 0,
    meta: {
      setId: sid,
      setTitle: meta.setTitle ?? null,
      categoryId: meta.categoryId ?? null,
    },
    date: dateKeyFromTs(ts),
    ts,
  };

  const all = await loadAttempts();
  all.push(entry);

  // Keep only the most recent 500
  const trimmed = all.sort((a, b) => b.ts - a.ts).slice(0, 500);
  await saveAttempts(trimmed);
  return entry;
}

/* -------------------------------- readers -------------------------------- */

// Return all attempts, normalized (ensures percent/date/types are consistent)
export async function getAllAttempts() {
  const all = await loadAttempts();
  return all
    .map((a) => ({
      ...a,
      percent:
        typeof a.percent === "number"
          ? a.percent
          : a.total > 0
          ? Math.round((Number(a.correct) / Number(a.total)) * 100)
          : 0,
      timeTakenSec: Number(a.timeTakenSec) || 0,
      xpEarned: Number(a.xpEarned) || 0,
      date: a.date || dateKeyFromTs(a.ts || Date.now()),
    }))
    .sort((a, b) => b.ts - a.ts);
}

// Compute current day streak (consecutive days with ≥1 attempt, counting today if any)
export function computeDayStreak(attempts) {
  const set = new Set((attempts || []).map((a) => a.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = dateKeyFromTs(d.getTime());
    if (!set.has(key)) break;
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Aggregate quick stats: unique sets taken, rolling accuracy (last 5), day streak
export async function getStatsSummary() {
  const attempts = await getAllAttempts();

  const uniqueKeys = new Set(attempts.map((a) => a.key));
  const taken = uniqueKeys.size;

  const recent = attempts.slice(0, 5);
  const accuracy =
    recent.length > 0
      ? Math.round(
          recent.reduce((sum, a) => sum + (a.percent || 0), 0) / recent.length
        )
      : 0;

  const streak = computeDayStreak(attempts);
  return { taken, accuracy, streak };
}
