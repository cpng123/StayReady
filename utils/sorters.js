// utils/sorters.js

// Exported sort labels (default English)
export const BADGE_SORTS = ["Default", "Unlocked", "Locked"];
export const REWARD_SORTS = ["Default", "Price ↑", "Price ↓"];

/**
 * Sort badges based on the selected mode
 * @param {Array} items - Badge items array
 * @param {number} modeIndex - Sort index: 0=Default, 1=Unlocked first, 2=Locked first
 */
export function sortBadges(items = [], modeIndex = 0) {
  if (modeIndex === 1) {
    // Unlocked first
    return [...items].sort((a, b) =>
      a.achieved === b.achieved ? 0 : b.achieved ? -1 : 1
    );
  }
  if (modeIndex === 2) {
    // Locked first
    return [...items].sort((a, b) =>
      a.achieved === b.achieved ? 0 : a.achieved ? 1 : -1
    );
  }
  return items;
}

/**
 * Sort rewards based on price
 * @param {Array} items - Reward items array
 * @param {number} modeIndex - Sort index: 0=Default, 1=Price ↑, 2=Price ↓
 */
export function sortRewards(items = [], modeIndex = 0) {
  if (modeIndex === 1) {
    // Price low → high
    return [...items].sort((a, b) => (a.points ?? 0) - (b.points ?? 0));
  }
  if (modeIndex === 2) {
    // Price high → low
    return [...items].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  }
  return items;
}
