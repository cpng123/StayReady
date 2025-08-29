/**
 * File: utils/sorters.js
 * Purpose: Small client-side sorting helpers for badges and rewards.
 *
 * Responsibilities:
 *  - Expose human-readable sort mode labels for UI pickers.
 *  - Provide pure sorting functions that respect the selected mode.
 *
 * Notes:
 *  - When a sort is applied, a new array is returned (non-mutating).
 *  - “Default” modes return the original array reference unchanged.
 */

// UI-facing sort labels (default English)
export const BADGE_SORTS = ["Default", "Unlocked", "Locked"];
export const REWARD_SORTS = ["Default", "Price ↑", "Price ↓"];

// Sort badges by mode: 0=Default, 1=Unlocked first, 2=Locked first
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
  // Default (no re-ordering)
  return items;
}

// Sort rewards by points: 0=Default, 1=low→high, 2=high→low
export function sortRewards(items = [], modeIndex = 0) {
  if (modeIndex === 1) {
    // Price low → high
    return [...items].sort((a, b) => (a.points ?? 0) - (b.points ?? 0));
  }
  if (modeIndex === 2) {
    // Price high → low
    return [...items].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  }
  // Default (no re-ordering)
  return items;
}
