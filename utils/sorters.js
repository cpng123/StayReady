// utils/sorters.js

// Badge sort modes shown in UI (keep order in sync with cycle logic)
export const BADGE_SORTS = ["Default", "Unlocked", "Locked"];
export function sortBadges(items = [], modeIndex = 0) {
  if (modeIndex === 1) {
    // Unlocked first
    return [...items].sort((a, b) =>
      a.achieved === b.achieved ? 0 : b.achieved ? 1 : -1
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

// Reward sort modes shown in UI
export const REWARD_SORTS = ["Default", "Price ↑", "Price ↓"];
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
