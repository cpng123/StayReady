// i18n/index.js
/**
 * i18n bootstrap (Expo + react-i18next)
 * -------------------------------------
 * - Loads bundled translation JSON for: common, checklist, preparedness, quiz.
 * - Detects device locale via `expo-localization`, normalizes to one of:
 *      en | zh | ms | ta  (fallback: en)
 * - Persists the selected language to AsyncStorage.
 * - Reads/writes across both NEW and LEGACY keys so older builds stay in sync.
 *
 * Storage keys (all are kept in sync on write):
 *   NEW (canonical):   "@quizverse:pref:lang"
 *   Legacy (current):  "pref:language"
 *   Legacy (older):    "pref:lang"
 *
 * Notes:
 * - You can call `setAppLanguage(lang)` to change language AND persist it.
 * - If some code calls `i18n.changeLanguage` directly, we still persist
 *   through a `languageChanged` listener as a safety net.
 * - Make sure any new namespaces you add have their JSON registered here
 *   AND listed in the `ns` array below.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ---------------- Bundled resources ---------------- */
// common
import enCommon from "./resources/en/common.json";
import zhCommon from "./resources/zh/common.json";
import msCommon from "./resources/ms/common.json";
import taCommon from "./resources/ta/common.json";
// checklist
import enChecklist from "./resources/en/checklist.json";
import zhChecklist from "./resources/zh/checklist.json";
import msChecklist from "./resources/ms/checklist.json";
import taChecklist from "./resources/ta/checklist.json";
// preparedness
import enPreparedness from "./resources/en/preparedness.json";
import zhPreparedness from "./resources/zh/preparedness.json";
import msPreparedness from "./resources/ms/preparedness.json";
import taPreparedness from "./resources/ta/preparedness.json";
// quiz
import quizEn from "./resources/en/quiz.json";
import quizMs from "./resources/ms/quiz.json";
import quizTa from "./resources/ta/quiz.json";
import quizZh from "./resources/zh/quiz.json";

/* ---------------- Supported languages ---------------- */
export const SUPPORTED_LANGS = {
  en: "English",
  zh: "中文",
  ms: "Bahasa Melayu",
  ta: "தமிழ்",
};

/* ---------------- Resource registry ---------------- */
const resources = {
  en: {
    common: enCommon,
    checklist: enChecklist,
    preparedness: enPreparedness,
    quiz: quizEn,
  },
  zh: {
    common: zhCommon,
    checklist: zhChecklist,
    preparedness: zhPreparedness,
    quiz: quizZh,
  },
  ms: {
    common: msCommon,
    checklist: msChecklist,
    preparedness: msPreparedness,
    quiz: quizMs,
  },
  ta: {
    common: taCommon,
    checklist: taChecklist,
    preparedness: taPreparedness,
    quiz: quizTa,
  },
};

/* ---------------- Storage keys (NEW + LEGACY) ----------------
 * Use the new namespaced key as canonical but keep legacy keys
 * so older builds remain interoperable.
 */
const CANON_LANG_KEY = "@quizverse:pref:lang"; // NEW canonical
const LEGACY_KEYS = ["pref:language", "pref:lang"]; // legacy variants
const ALL_LANG_KEYS = [CANON_LANG_KEY, ...LEGACY_KEYS];

/* ---------------- Locale helpers ---------------- */
function normalizeToSupported(tag) {
  // Accept short language code if provided (expo-localization usually gives this)
  if (!tag) return "en";
  const lower = String(tag).toLowerCase();

  // Handle region/script variants
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("zh")) return "zh";
  if (lower.startsWith("ms")) return "ms";
  if (lower.startsWith("ta")) return "ta";

  // Fallback
  return "en";
}

function pickDeviceLang() {
  // Newer Expo: getLocales() → [{ languageCode, languageTag, ... }]
  const first = Array.isArray(Localization.getLocales?.())
    ? Localization.getLocales()[0]
    : null;

  const tag =
    first?.languageCode ||
    first?.languageTag ||
    // Older Expo: "en-US"
    (typeof Localization.locale === "string" ? Localization.locale : "en");

  const normalized = normalizeToSupported(tag);
  return SUPPORTED_LANGS[normalized] ? normalized : "en";
}

/* ---------------- Public API ---------------- */
export async function getAppLanguage() {
  // Try new key first, then legacy keys
  for (const key of ALL_LANG_KEYS) {
    try {
      const saved = await AsyncStorage.getItem(key);
      if (saved && SUPPORTED_LANGS[saved]) return saved;
    } catch {
      // ignore
    }
  }
  return pickDeviceLang();
}

export async function setAppLanguage(lang) {
  if (!SUPPORTED_LANGS[lang]) return;
  // Write to ALL keys so old+new builds see the same value
  try {
    await AsyncStorage.multiSet(ALL_LANG_KEYS.map((k) => [k, lang]));
  } catch {
    // ignore
  }
  await i18n.changeLanguage(lang);
}

/* Persist ANY direct i18n.changeLanguage(...) calls (safety net) */
i18n.on("languageChanged", async (lng) => {
  if (!SUPPORTED_LANGS[lng]) return;
  try {
    await AsyncStorage.multiSet(ALL_LANG_KEYS.map((k) => [k, lng]));
  } catch {
    // ignore
  }
});

/* ---------------- Init ---------------- */
export async function initI18n() {
  const initialLang = await getAppLanguage();

  await i18n.use(initReactI18next).init({
    compatibilityJSON: "v3",
    resources,
    lng: initialLang,
    fallbackLng: "en",
    supportedLngs: Object.keys(SUPPORTED_LANGS),
    // IMPORTANT: include every namespace you load above
    ns: ["common", "checklist", "preparedness", "quiz"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  return i18n;
}

export default i18n;
