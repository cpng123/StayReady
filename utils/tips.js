// utils/tips.js
import { PREPAREDNESS_GUIDES } from "../data/preparednessGuides";

/**
 * Pick N random tips from PREPAREDNESS_GUIDES.
 * Each tip = { id, categoryId, i18nKey, categoryI18nKey }
 * (No hard-coded text; GamesScreen will translate with i18n)
 */
export function pickRandomTips(n = 5) {
  const cats = Object.values(PREPAREDNESS_GUIDES);
  const tips = [];
  const used = new Set();

  const rnd = (min, max) => Math.floor(Math.random() * (max - min)) + min;

  const getRandomTipFromGuide = (g) => {
    const sections = g.sections ?? [];
    if (!sections.length) return null;

    // choose a random section with a usable key/id
    const s = sections[rnd(0, sections.length)];
    const sectionKey = s.id || s.key; // your data sometimes uses id, sometimes key
    const items = s.items ?? [];
    if (!items.length || !sectionKey) return null;

    const it = items[rnd(0, items.length)];
    const itemId = it?.id;
    if (!itemId) return null;

    // Build i18n keys that exist in preparedness.json
    // Text for the tip:
    const i18nKey = `preparedness:${g.id}.sections.${sectionKey}.items.${itemId}`;
    // Localized category title:
    const categoryI18nKey = `preparedness:${g.id}.title`;

    return {
      id: `${g.id}-${itemId}`,
      categoryId: g.id,
      i18nKey,
      categoryI18nKey,
      // keep originals only as fallbacks (GamesScreen will prefer i18n)
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
