/**
 * File: utils/checklistStore.js
 * Purpose: Persist the user's preparedness checklist progress (done/undone per item)
 *          in AsyncStorage and provide a helper to apply that state to UI sections.
 *
 * Responsibilities:
 *  - Load/save/clear a simple "done map" object keyed by checklist item id.
 *  - Provide a pure helper to merge the done map into checklist sections.
 *
 * Data model:
 *  - STORAGE_KEY = "stayready:checklist:v1"
 *  - Done map: { [itemId: string]: true }  // presence means "done"
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "stayready:checklist:v1";

// Load the persisted done map (returns {} if missing or on error)
export async function loadChecklistDoneMap() {
  try {
    const s = await AsyncStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

// Save/overwrite the done map atomically
export async function saveChecklistDoneMap(doneMap) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(doneMap));
  } catch {}
}

// Remove all persisted checklist state
export async function clearChecklistDoneMap() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// Pure helper: return new sections with each item's `done` set from the map
export function applyDoneToSections(sections, doneMap) {
  return (sections || []).map((s) => ({
    ...s,
    items: (s.items || []).map((i) => ({ ...i, done: !!doneMap[i.id] })),
  }));
}
