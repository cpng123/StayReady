// utils/bookmarks.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@bookmarks_v1';

// Very small pub/sub so screens can refresh when bookmarks change
const listeners = new Set();
const emit = (payload) => listeners.forEach(cb => cb(payload));

export const subscribeBookmarks = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export async function getAllBookmarks() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
async function saveAll(list) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  emit(list);
}

export async function isBookmarked(id) {
  const list = await getAllBookmarks();
  return list.some(b => b.id === id);
}

export async function addBookmark(item) {
  const list = await getAllBookmarks();
  if (!list.some(b => b.id === item.id)) {
    list.push({ ...item, timestamp: Date.now() });
    await saveAll(list);
  }
  return true;
}

export async function removeBookmark(id) {
  const list = await getAllBookmarks();
  const next = list.filter(b => b.id !== id);
  await saveAll(next);
  return false;
}

export async function toggleBookmark(item) {
  const list = await getAllBookmarks();
  const i = list.findIndex(b => b.id === item.id);
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

// Shape helper to keep consistency everywhere we call toggleBookmark()
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
