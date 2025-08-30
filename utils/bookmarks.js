/**
 * File: utils/bookmarks.js
 * Purpose: Persist and manage question bookmarks in AsyncStorage, provide a tiny
 *          pub/sub so screens can react to changes, and expose a normalizer for
 *          consistent bookmark item shape across the app.
 *
 * Responsibilities:
 *  - CRUD helpers for bookmarks (get/add/remove/toggle/check).
 *  - Event subscription so UI can refresh when the list updates.
 *  - Shape helper to standardize what a bookmark object looks like.
 *
 * Data model:
 *  - Stored as an array under KEY = '@bookmarks_v1'.
 *  - Each bookmark: {
 *      id, categoryId, categoryLabel, setId, setTitle,
 *      text, options, answerIndex, selectedIndex, timesUp, timestamp
 *    }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@bookmarks_v1';

// In-memory listeners registry for simple pub/sub
const listeners = new Set();
const emit = (payload) => listeners.forEach((cb) => cb(payload));

// Subscribe to bookmark changes; returns an unsubscribe fn
export const subscribeBookmarks = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

// Read all bookmarks from storage (returns [] if none)
export async function getAllBookmarks() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    await AsyncStorage.setItem(KEY, JSON.stringify([]));
    return [];
  }
}


// Overwrite storage with a new list and notify listeners
async function saveAll(list) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  emit(list);
}

// Check if a given id is currently bookmarked
export async function isBookmarked(id) {
  const list = await getAllBookmarks();
  return list.some((b) => b.id === id);
}

// Add a bookmark (no-op if it already exists); returns true
export async function addBookmark(item) {
  const list = await getAllBookmarks();
  if (!list.some((b) => b.id === item.id)) {
    list.push({ ...item, timestamp: Date.now() });
    await saveAll(list);
  }
  return true;
}

// Remove a bookmark by id; returns false (now un-bookmarked)
export async function removeBookmark(id) {
  const list = await getAllBookmarks();
  const next = list.filter((b) => b.id !== id);
  await saveAll(next);
  return false;
}

// Toggle a bookmark; returns true if now bookmarked, false if removed
export async function toggleBookmark(item) {
  const list = await getAllBookmarks();
  const i = list.findIndex((b) => b.id === item.id);
  if (i >= 0) {
    list.splice(i, 1);
    await saveAll(list);
    return false; // now un-bookmarked
  } else {
    list.push({ ...item, timestamp: Date.now() });
    await saveAll(list);
    return true; // now bookmarked
  }
}

export async function clearAllBookmarks() {
  await AsyncStorage.setItem(KEY, JSON.stringify([]));
  emit([]); // notify subscribers to refresh UI
}

// Normalize various question fields into a consistent bookmark shape
export function toBookmarkItem({
  id,
  categoryId,
  categoryLabel,
  setId,
  setTitle,
  question,
  options,
  answerIndex,
  selectedIndex = null,
  timesUp = false,
}) {
  return {
    id,                 // unique per question
    categoryId,         // for filtering
    categoryLabel,      // for chips
    setId,
    setTitle,           // topic/module title
    text: question,     // question text
    options,
    answerIndex,
    selectedIndex,
    timesUp,
  };
}
