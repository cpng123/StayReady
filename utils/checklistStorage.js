import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "stayready:checklist:v1";

export async function loadChecklistDoneMap() {
  try {
    const s = await AsyncStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

export async function saveChecklistDoneMap(doneMap) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(doneMap));
  } catch {}
}

export async function clearChecklistDoneMap() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function applyDoneToSections(sections, doneMap) {
  return (sections || []).map((s) => ({
    ...s,
    items: (s.items || []).map((i) => ({ ...i, done: !!doneMap[i.id] })),
  }));
}
