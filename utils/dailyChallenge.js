/**
 * File: utils/dailyChallenge.js
 * Purpose: Create, persist, and read a “Daily Challenge” quiz set with an
 *          8am local-time rollover. Each day we pick one random question
 *          per category, store it, and track the user's completion state.
 *
 * Responsibilities:
 *  - Generate a normalized daily set (one random Q per category) and cache it.
 *  - Use an 8am rollover so late-night usage counts toward the previous day.
 *  - Persist status (completed + review/meta) separate from the set.
 *  - Provide helpers to load today's set and merged status.
 *
 * Data model (AsyncStorage):
 *  - DAILY_SET_KEY    -> { dayKey: "YYYY-MM-DD", questions: [...] }
 *  - DAILY_STATUS_KEY -> { dayKey, completed: boolean, review: [], meta: {...} }
 *
 * Notes:
 *  - The total number of questions equals the number of categories available.
 *  - A “dayKey” refers to the logical date after applying the 8am rollover rule.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys + 8am local rolling window
const DAILY_SET_KEY = "daily:set:v1";
const DAILY_STATUS_KEY = "daily:status:v1";
const ROLLOVER_HOUR = 8;

// Build the logical day key (YYYY-MM-DD) with 8am rollover
function dayKeyFor(date = new Date()) {
  const d = new Date(date);
  const hour = d.getHours();
  // Before 8am → treat as previous day
  if (hour < ROLLOVER_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Create or return today's normalized set (one random question per category)
export async function getOrCreateDailySet(quizData) {
  const todayKey = dayKeyFor();

  // Try to load cached set
  const raw = await AsyncStorage.getItem(DAILY_SET_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.dayKey === todayKey && Array.isArray(parsed.questions)) {
        return parsed; // keep today's set
      }
    } catch {}
  }

  // Build new set (one random question per category)
  const categories = Array.isArray(quizData?.categories)
    ? quizData.categories
    : [];

  const questions = [];
  for (const cat of categories) {
    const sets = Array.isArray(cat.sets) ? cat.sets : [];
    if (!sets.length) continue;

    // Pick a random set within the category
    const set = sets[Math.floor(Math.random() * sets.length)];
    const qArr = Array.isArray(set.questions) ? set.questions : [];
    if (!qArr.length) continue;

    // Pick one random question from the chosen set
    const q = qArr[Math.floor(Math.random() * qArr.length)];

    // Normalize options (string array) and answerIndex
    const options =
      q.options?.map((o) => (typeof o === "string" ? o : o?.text ?? "")) ?? [];
    let answerIndex =
      typeof q.correctIndex === "number"
        ? q.correctIndex
        : typeof q.answerIndex === "number"
        ? q.answerIndex
        : typeof q.answer === "number"
        ? q.answer
        : typeof q.correct === "number"
        ? q.correct
        : 0;
    if (!(answerIndex >= 0 && answerIndex < options.length)) answerIndex = 0;

    questions.push({
      id: q.id ?? `${cat.id}-${set.id}-${questions.length}`,
      categoryId: cat.id,
      categoryLabel: cat.title,
      setId: set.id,
      setTitle: set.title,
      text:
        q.text ||
        q.question ||
        q.prompt ||
        q.title ||
        `Question ${questions.length + 1}`,
      options,
      answerIndex,
    });
  }

  // Persist the new daily set
  const payload = { dayKey: todayKey, questions };
  await AsyncStorage.setItem(DAILY_SET_KEY, JSON.stringify(payload));

  // Ensure status exists/reset for the current day
  const statusRaw = await AsyncStorage.getItem(DAILY_STATUS_KEY);
  let status = { dayKey: todayKey, completed: false, review: [] };
  if (statusRaw) {
    try {
      const parsed = JSON.parse(statusRaw);
      if (parsed?.dayKey === todayKey) status = parsed;
    } catch {}
  }
  if (status.dayKey !== todayKey) {
    await AsyncStorage.setItem(DAILY_STATUS_KEY, JSON.stringify(status));
  }

  return payload;
}

// Read the stored daily status (completed/review/meta), defaulting to today
export async function getDailyStatus() {
  const raw = await AsyncStorage.getItem(DAILY_STATUS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        dayKey: parsed.dayKey ?? dayKeyFor(),
        completed: !!parsed.completed,
        review: Array.isArray(parsed.review) ? parsed.review : [],
        meta: parsed.meta || null,
      };
    } catch {}
  }
  return { dayKey: dayKeyFor(), completed: false, review: [], meta: null };
}

// Mark today's challenge as completed and persist review/meta
export async function markDailyCompleted(review, meta) {
  const status = {
    dayKey: dayKeyFor(),
    completed: true,
    review: Array.isArray(review) ? review : [],
    meta: meta || null,
  };
  await AsyncStorage.setItem(DAILY_STATUS_KEY, JSON.stringify(status));
  return status;
}

// Single helper: return today's merged data (set + status) for the UI
export async function getDailyToday(quizData) {
  const set = await getOrCreateDailySet(quizData);
  const status = await getDailyStatus();

  return {
    key: `daily-${set.dayKey}`,
    questions: set.questions,
    completed: !!status.completed,
    review: status.review || [],
    meta:
      status.meta || {
        setId: `daily-${set.dayKey}`,
        setTitle: "Daily Challenge",
        categoryId: "daily",
        categoryLabel: "Daily",
      },
  };
}
