// utils/tips.js
import { PREPAREDNESS_GUIDES } from "../data/preparednessGuides";

/**
 * Pick N random tips from PREPAREDNESS_GUIDES.
 * Each tip = { id, categoryId, categoryTitle, text }
 */
export function pickRandomTips(n = 5) {
  const cats = Object.values(PREPAREDNESS_GUIDES);
  const tips = [];
  const used = new Set();

  const rnd = (min, max) => Math.floor(Math.random() * (max - min)) + min;

  // Flatten helper: get a random item.text from a guide
  const getRandomTipFromGuide = (g) => {
    const sections = g.sections ?? [];
    if (!sections.length) return null;

    // choose a random section, then random item
    const s = sections[rnd(0, sections.length)];
    const items = s.items ?? [];
    if (!items.length) return null;
    const it = items[rnd(0, items.length)];

    if (!it?.text) return null;
    return {
      id: `${g.id}-${it.id || rnd(0, 999999)}`,
      categoryId: g.id,
      categoryTitle: g.title,
      text: it.text,
    };
  };

  // Shuffle categories for diversity
  const shuffled = cats
    .map((c) => ({ c, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c);

  let i = 0;
  while (tips.length < n && i < shuffled.length * 3) {
    const g = shuffled[i % shuffled.length];
    const tip = getRandomTipFromGuide(g);
    if (tip && !used.has(tip.id)) {
      used.add(tip.id);
      tips.push(tip);
    }
    i++;
  }

  return tips.slice(0, n);
}
