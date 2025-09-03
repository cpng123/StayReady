jest.mock("../../data/preparednessGuides", () => ({
  PREPAREDNESS_GUIDES: {
    water: {
      id: "water",
      title: "Water & Hydration",
      sections: [
        // valid section with id
        {
          id: "store",
          items: [
            { id: "bottled", text: "Store 4L water per person per day" },
            { id: "purifier", text: "Keep a basic water filter" },
          ],
        },
        // valid section with key (alternate field name)
        {
          key: "disinfect",
          items: [
            { id: "boil", text: "Boil water for at least 1 minute" },
            { id: "bleach", text: "Disinfect with unscented bleach" },
          ],
        },
        // invalid: missing id/key => should be ignored if selected
        {
          items: [{ id: "ignored", text: "Should not be reachable" }],
        },
      ],
    },

    power: {
      id: "power",
      title: "Power & Lighting",
      sections: [
        {
          id: "batteries",
          items: [
            { id: "aa-kit", text: "Keep AA/AAA batteries stocked" },
            // invalid item: missing id -> should be skipped if picked
            { text: "No ID -> invalid" },
          ],
        },
        {
          key: "lighting",
          items: [
            { id: "torch", text: "Carry a small LED torch" },
            { id: "headlamp", text: "Headlamps keep hands free" },
          ],
        },
      ],
    },

    docs: {
      id: "docs",
      title: "Documents",
      sections: [
        {
          id: "backup",
          items: [
            { id: "cloud", text: "Back up important documents" },
            { id: "usb", text: "Encrypted USB for essentials" },
          ],
        },
      ],
    },
  },
}));

//// ---------- Import after mock ----------
import { PREPAREDNESS_GUIDES } from "../../data/preparednessGuides";
import { pickRandomTips } from "../../utils/tips";

//// ---------- Helpers: deterministic Math.random ----------
const originalRandom = Math.random;
function mockRandomSequence(seq) {
  let i = 0;
  jest.spyOn(Math, "random").mockImplementation(() => {
    const v = seq[i % seq.length];
    i += 1;
    return v;
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("pickRandomTips()", () => {
  test("returns up to N tips, unique by id, with i18n keys and fallbacks", () => {
    // Sequence picks deterministic sections/items across categories
    // Values are in [0,1) and used for: category shuffle keys, section picks, item picks, rotations
    mockRandomSequence([
      0.12, 0.45, 0.88, // shuffle keys
      0.10, 0.66,       // first rotation: section/item
      0.25, 0.40,       // second rotation
      0.75, 0.10,       // third rotation
      0.33, 0.55,       // fourth rotation
      0.42, 0.90,       // fifth rotation (may not be used)
    ]);

    const tips = pickRandomTips(5);

    expect(Array.isArray(tips)).toBe(true);
    expect(tips.length).toBeGreaterThan(0);

    // All have shape: id, categoryId, i18nKey, categoryI18nKey, plus fallbacks
    for (const tip of tips) {
      expect(typeof tip.id).toBe("string");
      expect(typeof tip.categoryId).toBe("string");
      expect(typeof tip.i18nKey).toBe("string");
      expect(typeof tip.categoryI18nKey).toBe("string");
      // fallbacks present (strings)
      expect(typeof tip.categoryTitle).toBe("string");
      expect(typeof tip.text).toBe("string");
      // i18n keys look reasonable
      expect(tip.i18nKey).toMatch(/^preparedness:/);
      expect(tip.categoryI18nKey).toMatch(/^preparedness:/);
    }

    // Unique ids
    const ids = tips.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Should include multiple categories when possible
    const cats = new Set(tips.map((t) => t.categoryId));
    expect(cats.size).toBeGreaterThan(1);
  });

  test("respects small N (e.g., n=2)", () => {
    mockRandomSequence([0.01, 0.6, 0.2, 0.4, 0.8, 0.1]);
    const tips = pickRandomTips(2);
    expect(tips.length).toBe(2);
  });

  test("caps at available unique items when N is larger than dataset", () => {
    // Count how many valid, unique items exist in the mocked dataset
    const countValid = Object.values(PREPAREDNESS_GUIDES).reduce((sum, g) => {
      const sections = Array.isArray(g.sections) ? g.sections : [];
      for (const s of sections) {
        const sectionKey = s.id || s.key;
        if (!sectionKey) continue;
        const items = Array.isArray(s.items) ? s.items : [];
        for (const it of items) {
          if (it && it.id) sum += 1;
        }
      }
      return sum;
    }, 0);

    mockRandomSequence([0.5, 0.25, 0.75, 0.33, 0.44, 0.12]); // any
    const tips = pickRandomTips(countValid + 10);
    expect(tips.length).toBeLessThanOrEqual(countValid);
  });

  test("skips sections without id/key and items without id", () => {
    // Force picks to sometimes land on the invalid section or invalid item
    // The while-loop should keep rotating and still return a valid list
    mockRandomSequence([
      0.99, 0.99, // shuffle keys skew (order doesn't matter much)
      0.80, 0.90, // might hit invalid item in 'power' first section
      0.50, 0.50, // valid picks subsequently
      0.10, 0.10,
      0.30, 0.30,
      0.70, 0.70,
    ]);

    const tips = pickRandomTips(4);
    expect(tips.length).toBeGreaterThanOrEqual(3);
    // ensure none of the generated ids reference the known invalid paths
    const badIds = new Set([
      "water-ignored", // invalid section had item id "ignored"
      // the invalid item in power section had no id, so it could never appear
    ]);
    for (const t of tips) {
      expect(badIds.has(t.id)).toBe(false);
    }
  });

  test("i18n keys point to expected namespaces and paths", () => {
    mockRandomSequence([0.02, 0.25, 0.48, 0.11, 0.67, 0.23, 0.81, 0.05]);

    const [tip] = pickRandomTips(1);

    expect(tip.i18nKey).toMatch(/^preparedness:[a-z0-9-]+\.sections\.[a-z0-9-]+\.items\.[a-z0-9-]+$/i);
    expect(tip.categoryI18nKey).toMatch(/^preparedness:[a-z0-9-]+\.title$/i);
  });

  test("returns fewer than N when the dataset is small or highly filtered by validity", () => {
    // If randomness keeps hitting invalid entries, the loop eventually ends
    mockRandomSequence([0.99, 0.99, 0.99, 0.99, 0.99]);
    const tips = pickRandomTips(10);
    // We still expect *some* results (dataset has plenty of valid items), but
    // assert we never exceed N
    expect(tips.length).toBeLessThanOrEqual(10);
  });
});
