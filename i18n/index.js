// i18n/index.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* -------- Bundled resources -------- */
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

export const SUPPORTED_LANGS = {
  en: "English",
  zh: "中文",
  ms: "Bahasa Melayu",
  ta: "தமிழ்",
};

import enPreparedness from "./resources/en/preparedness.json";
import zhPreparedness from "./resources/zh/preparedness.json";
import msPreparedness from "./resources/ms/preparedness.json";
import taPreparedness from "./resources/ta/preparedness.json";

import quizEn from "./resources/en/quiz.json";
import quizMs from "./resources/ms/quiz.json";
import quizTa from "./resources/ta/quiz.json";
import quizZh from "./resources/zh/quiz.json";

const resources = {
  en: { common: enCommon, checklist: enChecklist, preparedness: enPreparedness, quiz: quizEn },
  zh: { common: zhCommon, checklist: zhChecklist, preparedness: zhPreparedness, quiz: quizZh },
  ms: { common: msCommon, checklist: msChecklist, preparedness: msPreparedness, quiz: quizMs },
  ta: { common: taCommon, checklist: taChecklist, preparedness: taPreparedness, quiz: quizTa },
};

// Use ONE canonical key; still read legacy keys for older builds
const CANON_LANG_KEY = "pref:language"; // <- preferred going forward
const LEGACY_KEYS = ["pref:lang"]; // <- older key(s) you used
const ALL_LANG_KEYS = [CANON_LANG_KEY, ...LEGACY_KEYS];

function pickDeviceLang() {
  const tag = Localization.getLocales?.()[0]?.languageCode || "en";
  return Object.keys(SUPPORTED_LANGS).includes(tag) ? tag : "en";
}

export async function getAppLanguage() {
  // Try new key first, then legacy keys
  for (const key of ALL_LANG_KEYS) {
    try {
      const saved = await AsyncStorage.getItem(key);
      if (saved && SUPPORTED_LANGS[saved]) return saved;
    } catch {}
  }
  return pickDeviceLang();
}

export async function setAppLanguage(lang) {
  if (!SUPPORTED_LANGS[lang]) return;
  // Write to all keys so both old/new code paths see the same value
  try {
    await AsyncStorage.multiSet(ALL_LANG_KEYS.map((k) => [k, lang]));
  } catch {}
  await i18n.changeLanguage(lang);
}

export async function initI18n() {
  const initialLang = await getAppLanguage();

  await i18n.use(initReactI18next).init({
    compatibilityJSON: "v3",
    resources,
    lng: initialLang,
    fallbackLng: "en",
    ns: ["common", "checklist", "preparedness"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  return i18n;
}

export default i18n;
