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
const DAILY_SET_KEY = "daily:set:v2";
const DAILY_STATUS_KEY = "daily:status:v1";
const ROLLOVER_HOUR = 8;
const DAILY_COUNT = 10;

// Tiny stable PRNG from a seed (xorshift32)
function prng(seed) {
  let x = seed || 123456789;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    // Return [0, 1)
    return (x >>> 0) / 0xffffffff;
  };
}

// Make a numeric seed from a string (e.g., dayKey)
function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministically shuffle an array using dayKey
function seededShuffle(arr, dayKey) {
  const out = arr.slice();
  const rnd = prng(hashString(dayKey));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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
// Create or return today's normalized set (exactly DAILY_COUNT questions)
export async function getOrCreateDailySet(quizData) {
  const todayKey = dayKeyFor();

  // 1) Try to reuse today's cached set
  const raw = await AsyncStorage.getItem(DAILY_SET_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.dayKey === todayKey && Array.isArray(parsed.questions)) {
        // Ensure status is aligned to today (and reset if day changed elsewhere)
        const statusRaw = await AsyncStorage.getItem(DAILY_STATUS_KEY);
        let statusOk = false;
        if (statusRaw) {
          try {
            const s = JSON.parse(statusRaw);
            if (s?.dayKey === todayKey) statusOk = true;
          } catch {}
        }
        if (!statusOk) {
          const reset = {
            dayKey: todayKey,
            completed: false,
            review: [],
            meta: null,
          };
          await AsyncStorage.setItem(DAILY_STATUS_KEY, JSON.stringify(reset));
        }
        return parsed;
      }
    } catch {}
  }

  // 2) Build a fresh set (pick DAILY_COUNT usable categories deterministically)
  const allCategories = Array.isArray(quizData?.categories)
    ? quizData.categories
    : [];

  // Only categories that actually have at least one set with at least one question
  const usableCats = allCategories.filter((cat) => {
    const sets = Array.isArray(cat.sets) ? cat.sets : [];
    return sets.some(
      (s) => Array.isArray(s.questions) && s.questions.length > 0
    );
  });

  // Deterministic shuffle based on todayKey, then take the first DAILY_COUNT
  const pickedCats = seededShuffle(usableCats, todayKey).slice(0, DAILY_COUNT);

  const questions = [];
  for (const cat of pickedCats) {
    const sets = Array.isArray(cat.sets) ? cat.sets : [];
    // Deterministic pick of a set within the category
    const rndSet = prng(hashString(`${todayKey}:${cat.id}:set`));
    const set = sets[Math.floor(rndSet() * sets.length)];

    const qArr = Array.isArray(set.questions) ? set.questions : [];
    // Deterministic pick of a question within the set
    const rndQ = prng(hashString(`${todayKey}:${cat.id}:${set.id}:q`));
    const q = qArr[Math.floor(rndQ() * qArr.length)];

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

  // 3) Persist the new set for today
  const payload = { dayKey: todayKey, questions };
  await AsyncStorage.setItem(DAILY_SET_KEY, JSON.stringify(payload));

  // 4) Ensure status exists for today (reset if it was from a previous day)
  const statusRaw = await AsyncStorage.getItem(DAILY_STATUS_KEY);
  let needsReset = true;
  if (statusRaw) {
    try {
      const parsed = JSON.parse(statusRaw);
      if (parsed?.dayKey === todayKey) needsReset = false;
    } catch {
      needsReset = true;
    }
  }
  if (needsReset) {
    const reset = {
      dayKey: todayKey,
      completed: false,
      review: [],
      meta: null,
    };
    await AsyncStorage.setItem(DAILY_STATUS_KEY, JSON.stringify(reset));
  }

  return payload;
}

// Read the stored daily status (completed/review/meta), defaulting to today
export async function getDailyStatus() {
  const todayKey = dayKeyFor();
  const raw = await AsyncStorage.getItem(DAILY_STATUS_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.dayKey === todayKey) {
        return {
          dayKey: todayKey,
          completed: !!parsed.completed,
          review: Array.isArray(parsed.review) ? parsed.review : [],
          meta: parsed.meta || null,
        };
      }
      // different day → reset and persist
      const reset = {
        dayKey: todayKey,
        completed: false,
        review: [],
        meta: null,
      };
      await AsyncStorage.setItem(DAILY_STATUS_KEY, JSON.stringify(reset));
      return reset;
    } catch {
      // corrupted → reset
      const reset = {
        dayKey: todayKey,
        completed: false,
        review: [],
        meta: null,
      };
      await AsyncStorage.setItem(DAILY_STATUS_KEY, JSON.stringify(reset));
      return reset;
    }
  }

  // no status → create fresh
  const fresh = { dayKey: todayKey, completed: false, review: [], meta: null };
  await AsyncStorage.setItem(DAILY_STATUS_KEY, JSON.stringify(fresh));
  return fresh;
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

  const isToday = status.dayKey === set.dayKey;

  return {
    key: `daily-${set.dayKey}`,
    questions: set.questions,
    completed: isToday ? !!status.completed : false,
    review: isToday ? status.review || [] : [],
    meta: isToday
      ? status.meta || {
          setId: `daily-${set.dayKey}`,
          setTitle: "Daily Challenge",
          categoryId: "daily",
          categoryLabel: "Daily",
        }
      : {
          setId: `daily-${set.dayKey}`,
          setTitle: "Daily Challenge",
          categoryId: "daily",
          categoryLabel: "Daily",
        },
  };
}
