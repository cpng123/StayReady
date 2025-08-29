/**
 * File: utils/quizLogic.js
 * Purpose: Core quiz/gameplay helpers for StayReady.
 *  - Define timing constants (per-question timer, reveal delay).
 *  - Provide localized UI strings (toasts, encouragements).
 *  - Normalize heterogeneous quiz data into a consistent shape.
 *  - Shuffle options while preserving the correct answer index.
 *  - Compute XP rewards and derive answer reveal flags.
 *
 * Notes:
 *  - No side effects or storage; pure helpers only.
 *  - All user-facing text is passed through i18n (the caller supplies `t`).
 */

// ---- Tunables / constants ----
export const QUESTION_SECONDS = 20;   // seconds allowed per question
export const REVEAL_DELAY_MS = 2800;  // delay before moving to next question after reveal

// Build a localized toast theme for Correct / Incorrect / Time's up
export const getToastTheme = (t) => ({
  correct: {
    bg: "#16A34A",
    pillText: "#16A34A",
    title: t("games.toast.correct", "Correct!"),
  },
  incorrect: {
    bg: "#DC2626",
    pillText: "#DC2626",
    title: t("games.toast.incorrect", "Incorrect!"),
  },
  timesup: {
    bg: "#2563EB",
    pillText: "#2563EB",
    title: t("games.toast.timesup", "Time's up!"),
  },
});

// Localized encouragement messages shown after incorrect answers
export const getEncouragement = (t) => [
  t("games.encourage.1", "Oof! That was tricky."),
  t("games.encourage.2", "XP missed... but knowledge gained!"),
  t("games.encourage.3", "You'll get the next one!"),
];

// Pick one encouragement at random
export const pickEncouragement = (t) => {
  const msgs = getEncouragement(t);
  return msgs[Math.floor(Math.random() * msgs.length)];
};

// Map A/B/C/D → 0/1/2/3 (tolerant of case/spacing)
export const letterToIndex = (k) =>
  ({ A: 0, B: 1, C: 2, D: 3 }[String(k || "").toUpperCase()]);

// Fisher–Yates shuffle while tracking the correct index
export function shuffleWithAnswer(options, answerIndex) {
  const tagged = options.map((v, i) => ({ v, i }));
  for (let j = tagged.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [tagged[j], tagged[k]] = [tagged[k], tagged[j]];
  }
  return {
    options: tagged.map((t) => t.v),
    answerIndex: tagged.findIndex((t) => t.i === answerIndex),
  };
}

// Normalize quiz structure into a standard shape for the gameplay UI
// - Picks requested category/set (falls back to first available).
// - Accepts various answer formats (index, key, text) and resolves to 0-based index.
// - Shuffles options and remaps the correct index accordingly.
export function normalizeQuestions(quizData, categoryId, setId, t) {
  const categories = quizData?.categories || [];
  const cat =
    categories.find((c) => c.id === categoryId) ||
    categories[0] ||
    { title: t("games.generic.quiz", "Quiz"), sets: [] };

  const set =
    (cat.sets || []).find((x) => x.id === setId) ||
    (cat.sets || [])[0] ||
    { questions: [] };

  const getFirst = (...vals) =>
    vals.find((v) => typeof v === "string" && v.trim().length) || "";

  return (set.questions || []).map((q, idx) => {
    // Normalize options to strings
    const options =
      q.options?.map((o) => (typeof o === "string" ? o : o?.text ?? "")) ?? [];

    // Resolve correct answer index from multiple possible shapes
    let rawIndex =
      typeof q.correctIndex === "number"
        ? q.correctIndex
        : typeof q.answerIndex === "number"
        ? q.answerIndex
        : typeof q.answer === "number"
        ? q.answer
        : typeof q.correct === "number"
        ? q.correct
        : null;

    // Accept letter key (A/B/C/D)
    if (rawIndex == null && q.correctKey != null) {
      const li = letterToIndex(q.correctKey);
      if (li != null) rawIndex = li;
    }

    // Accept exact-text match if provided
    if (rawIndex == null && typeof q.correctAnswer === "string") {
      const idxByText = options.findIndex(
        (o) => o.trim() === q.correctAnswer.trim()
      );
      if (idxByText >= 0) rawIndex = idxByText;
    }

    // Final guard
    if (!(rawIndex >= 0 && rawIndex < options.length)) rawIndex = 0;

    // Shuffle & remap correct index
    const shuffled = shuffleWithAnswer(options, rawIndex);

    return {
      id: q.id ?? `q-${idx}`,
      text:
        getFirst(q.text, q.question, q.prompt, q.title, q.q) ||
        t("games.generic.question", {
          index: idx + 1,
          defaultValue: `Question ${idx + 1}`,
        }),
      options: shuffled.options,
      answerIndex: shuffled.answerIndex,
      hint: getFirst(q.hint, q.explanation, q.why, q.note),
    };
  });
}

// XP reward: 1..20 scaled linearly by remaining time
export function computeXp(timeLeft, total = QUESTION_SECONDS) {
  return Math.max(1, Math.round((timeLeft / total) * 20));
}

// Given option index & UI state, derive which highlight to show
// - showGreen: correct answer selected before time-up
// - showRed: user-selected wrong answer before time-up
// - showBlue: correct answer after time-up (reveal)
export function deriveRevealFlags(i, answerIndex, selected, locked, timesUp) {
  if (selected === null && !locked && timesUp) {
    return { showGreen: false, showRed: false, showBlue: false };
  }
  if (!locked && !timesUp) {
    return { showGreen: false, showRed: false, showBlue: false };
  }
  const isCorrect = i === answerIndex;
  const isUserWrong = locked && selected === i && !isCorrect;

  const showGreen = locked && !timesUp && isCorrect && selected != null;
  const showRed = locked && !timesUp && isUserWrong;
  const showBlue = timesUp && isCorrect;

  return { showGreen, showRed, showBlue };
}
