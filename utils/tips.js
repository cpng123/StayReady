/**
 * File: utils/tips.js
 * Purpose: Select short preparedness tips from static guides for the Daily Tips UI.
 *
 * Responsibilities:
 *  - Randomly sample up to N items from PREPAREDNESS_GUIDES.
 *  - Prefer diversity by shuffling categories first, then rotating through them.
 *  - Return i18n-safe payloads (no hard-coded strings in the tip body).
 *
 * Data source:
 *  - PREPAREDNESS_GUIDES (see ../data/preparednessGuides)
 *
 * i18n:
 *  - Each returned tip provides `i18nKey` and `categoryI18nKey`.
 *    The screen should translate those keys at render time.
 *  - `text` and `categoryTitle` are included only as fallbacks.
 */

import { PREPAREDNESS_GUIDES } from "../data/preparednessGuides";

// Pick up to N random, unique tips with category diversity.
// Returns [{ id, categoryId, i18nKey, categoryI18nKey, categoryTitle, text }]
export function pickRandomTips(n = 5) {
  const cats = Object.values(PREPAREDNESS_GUIDES);
  const tips = [];
  const used = new Set();

  // Uniform integer in [min, max)
  const rnd = (min, max) => Math.floor(Math.random() * (max - min)) + min;

  // Build one random tip from a single guide (returns null if the guide has no items)
  const getRandomTipFromGuide = (g) => {
    const sections = g.sections ?? [];
    if (!sections.length) return null;

    // Pick a random section that has an id/key and at least one item
    const s = sections[rnd(0, sections.length)];
    const sectionKey = s.id || s.key; // guides may use either "id" or "key"
    const items = s.items ?? [];
    if (!items.length || !sectionKey) return null;

    // Pick a random item within the section
    const it = items[rnd(0, items.length)];
    const itemId = it?.id;
    if (!itemId) return null;

    // Construct i18n keys (the JSON under preparedness.* should contain these)
    const i18nKey = `preparedness:${g.id}.sections.${sectionKey}.items.${itemId}`;
    const categoryI18nKey = `preparedness:${g.id}.title`;

    return {
      id: `${g.id}-${itemId}`,   // unique across guides
      categoryId: g.id,          // for grouping/filtering
      i18nKey,                   // tip text key
      categoryI18nKey,           // category title key
      categoryTitle: g.title,    // fallback only
      text: it.text,             // fallback only
    };
  };

  // Shuffle categories to diversify the sample
  const shuffled = cats
    .map((c) => ({ c, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c);

  // Try multiple rotations over categories to fill up to N unique tips
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

  // Return at most N (may be fewer if the dataset is small)
  return tips.slice(0, n);
}
