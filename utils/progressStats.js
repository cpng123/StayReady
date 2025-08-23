// utils/progressStats.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const ATTEMPTS_KEY = "quiz:attempts:v1";

function pad(n) { return String(n).padStart(2, "0"); }
function dateKeyFromTs(ts) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`; // local date (midnight boundary)
}

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

async function saveAttempts(arr) {
  try {
    await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(arr));
  } catch {}
}

/**
 * Add a completed attempt.
 * @param {{type: 'set'|'daily', meta?: any, correct: number, total: number, timestamp?: number}} params
 */
export async function addQuizAttempt({ type = "set", meta = {}, correct = 0, total = 0, timestamp }) {
  const ts = typeof timestamp === "number" ? timestamp : Date.now();
  const percent = total > 0 ? Math.round((Number(correct) / Number(total)) * 100) : 0;

  // Unique key per “set” or per “daily day”
  const setId = meta?.setId || meta?.setTitle || "unknown";
  const dailyKey = meta?.dayKey || meta?.setId || dateKeyFromTs(ts);
  const key = type === "daily" ? `daily:${dailyKey}` : `set:${setId}`;

  const entry = {
    key,               // used for unique counting
    type,              // 'set' | 'daily'
    percent,           // 0-100
    setId: meta?.setId ?? null,
    setTitle: meta?.setTitle ?? null,
    date: dateKeyFromTs(ts),
    ts,
  };

  const all = await loadAttempts();
  all.push(entry);
  // keep storage from growing forever (optional): cap to last 500 attempts
  const trimmed = all.sort((a, b) => b.ts - a.ts).slice(0, 500);
  await saveAttempts(trimmed);

  return entry;
}

export async function getAllAttempts() {
  const all = await loadAttempts();
  return all.sort((a, b) => b.ts - a.ts);
}

/**
 * Returns:
 *  - taken: number of unique sets (setId) + unique daily-day entries
 *  - accuracy: average of last up to 5 attempts (0-100)
 *  - streak: consecutive days (including today) with >= 1 attempt
 */
export async function getStatsSummary() {
  const attempts = await getAllAttempts();
  // Unique count: by `key`
  const uniqueKeys = new Set(attempts.map((a) => a.key));
  const taken = uniqueKeys.size;

  // Recent accuracy: last 5
  const recent = attempts.slice(0, 5);
  const accuracy =
    recent.length > 0
      ? Math.round(recent.reduce((sum, a) => sum + (a.percent || 0), 0) / recent.length)
      : 0;

  // Day streak
  const datesSet = new Set(attempts.map((a) => a.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = dateKeyFromTs(d.getTime());
    if (!datesSet.has(key)) break;
    streak += 1;
    // move to previous day
    d.setDate(d.getDate() - 1);
  }

  return { taken, accuracy, streak };
}
