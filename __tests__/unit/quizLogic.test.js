import {
  QUESTION_SECONDS,
  REVEAL_DELAY_MS,
  getToastTheme,
  getEncouragement,
  pickEncouragement,
  letterToIndex,
  shuffleWithAnswer,
  normalizeQuestions,
  computeXp,
  deriveRevealFlags,
} from "../../utils/quizLogic";

const realRandom = Math.random;
afterEach(() => {
  // restore original RNG if any test mocked it
  Math.random = realRandom;
});

// Simple passthrough translator: returns defaultValue or the key for visibility
const t = (key, def) =>
  typeof def === "string" ? def : def?.defaultValue ?? key;

describe("constants", () => {
  test("QUESTION_SECONDS and REVEAL_DELAY_MS values", () => {
    expect(QUESTION_SECONDS).toBe(20);
    expect(REVEAL_DELAY_MS).toBe(2800);
  });
});

describe("toast + encouragement helpers", () => {
  test("getToastTheme returns localized titles with colors", () => {
    const theme = getToastTheme(t);
    expect(theme.correct.title).toMatch(/Correct!/);
    expect(theme.incorrect.title).toMatch(/Incorrect!/);
    expect(theme.timesup.title).toMatch(/Time's up!/);
    expect(theme.correct.bg).toBe("#16A34A");
    expect(theme.incorrect.bg).toBe("#DC2626");
    expect(theme.timesup.bg).toBe("#2563EB");
  });

  test("getEncouragement returns 3 strings", () => {
    const msgs = getEncouragement(t);
    expect(Array.isArray(msgs)).toBe(true);
    expect(msgs).toHaveLength(3);
    msgs.forEach((m) => expect(typeof m).toBe("string"));
  });

  test("pickEncouragement picks deterministically with mocked RNG", () => {
    // Force RNG to select index 1 (since 3 items → floor(0.6 * 3) = 1)
    Math.random = () => 0.6;
    const msg = pickEncouragement(t);
    const msgs = getEncouragement(t);
    expect(msg).toBe(msgs[1]);
  });
});

describe("letterToIndex()", () => {
  test("maps A/B/C/D to 0..3", () => {
    expect(letterToIndex("A")).toBe(0);
    expect(letterToIndex("b")).toBe(1);
    expect(letterToIndex("C ")).toBe(2);
    expect(letterToIndex(" d")).toBe(3);
  });

  test("returns undefined for out-of-range", () => {
    expect(letterToIndex("E")).toBeUndefined();
    expect(letterToIndex("")).toBeUndefined();
    expect(letterToIndex(null)).toBeUndefined();
  });
});

describe("shuffleWithAnswer()", () => {
  test("returns a permutation and preserves the correct option text", () => {
    const options = ["Red", "Green", "Blue", "Yellow"];
    const origCorrect = options[2];

    // Make RNG deterministic (not asserting exact order, just correctness mapping)
    Math.random = () => 0.0;

    const { options: outOpts, answerIndex } = shuffleWithAnswer(options, 2);
    // Check the mapping *before* any mutation
    expect(outOpts[answerIndex]).toBe(origCorrect);
    // Then verify it's a permutation using a sorted *copy*
    const sortedOut = outOpts.slice().sort();
    const sortedOrig = options.slice().sort();
    expect(sortedOut).toEqual(sortedOrig);
  });
});

describe("normalizeQuestions()", () => {
  test("normalizes, resolves correct answer via multiple shapes, shuffles and remaps index", () => {
    const quizData = {
      categories: [
        {
          id: "cat1",
          title: "Safety",
          sets: [
            {
              id: "set1",
              title: "Basics",
              questions: [
                // 1) direct numeric index
                {
                  id: "q1",
                  text: "Pick the color",
                  options: ["Red", "Green", "Blue", "Yellow"],
                  correctIndex: 1,
                },
                // 2) letter key
                {
                  id: "q2",
                  question: "Which letter?",
                  options: ["Alpha", "Bravo", "Charlie", "Delta"],
                  correctKey: "C", // → index 2
                },
                // 3) exact text
                {
                  id: "q3",
                  prompt: "Choose the sky color",
                  options: ["Green", "Blue"],
                  correctAnswer: "Blue",
                },
                // 4) generic numeric field 'answer'
                {
                  id: "q4",
                  title: "Select",
                  options: ["1", "2", "3", "4"],
                  answer: 3, // 0-based
                },
              ],
            },
          ],
        },
      ],
    };

    // Deterministic RNG
    Math.random = () => 0.0;

    const out = normalizeQuestions(quizData, "cat1", "set1", t);
    expect(out).toHaveLength(4);

    // For each, ensure the option at returned answerIndex equals the original correct text
    const origCorrectByQ = {
      q1: "Green",
      q2: "Charlie",
      q3: "Blue",
      q4: "4",
    };

    out.forEach((q) => {
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThan(0);
      expect(typeof q.text).toBe("string");
      expect(q.options[q.answerIndex]).toBe(origCorrectByQ[q.id]);
    });
  });

  test("falls back to defaults when category/set not found; uses i18n default titles", () => {
    Math.random = () => 0.0;
    const data = { categories: [] };
    const out = normalizeQuestions(data, "missingCat", "missingSet", t);
    // default empty set -> []
    expect(Array.isArray(out)).toBe(true);
    expect(out).toHaveLength(0);
  });
});

describe("computeXp()", () => {
  test("scales linearly, clamped to [1..20]", () => {
    expect(computeXp(20, 20)).toBe(20); // max
    expect(computeXp(0, 20)).toBe(1); // min clamp
    expect(computeXp(10, 20)).toBe(10); // mid
    expect(computeXp(19, 20)).toBe(19);
    // If total differs
    expect(computeXp(5, 10)).toBe(10);
  });
});

describe("deriveRevealFlags()", () => {
  test("no highlight before lock/timesUp", () => {
    expect(deriveRevealFlags(0, 1, null, false, false)).toEqual({
      showGreen: false,
      showRed: false,
      showBlue: false,
    });
  });

  test("correct selection before timesUp → green only", () => {
    const r = deriveRevealFlags(2, 2, 2, true, false);
    expect(r).toEqual({ showGreen: true, showRed: false, showBlue: false });
  });

  test("wrong selection before timesUp → red only", () => {
    const r = deriveRevealFlags(1, 2, 1, true, false);
    expect(r).toEqual({ showGreen: false, showRed: true, showBlue: false });
  });

  test("timesUp reveal shows blue on correct option", () => {
    const r1 = deriveRevealFlags(3, 3, null, true, true);
    expect(r1).toEqual({ showGreen: false, showRed: false, showBlue: true });

    const r2 = deriveRevealFlags(1, 3, null, true, true);
    expect(r2).toEqual({ showGreen: false, showRed: false, showBlue: false });
  });

  test("edge: selected is null and timesUp true but not locked → no highlight", () => {
    const r = deriveRevealFlags(0, 0, null, false, true);
    expect(r).toEqual({ showGreen: false, showRed: false, showBlue: false });
  });
});
