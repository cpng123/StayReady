import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import bundled resources
import en from "./resources/en/common.json";
import zh from "./resources/zh/common.json";
import ms from "./resources/ms/common.json";
import ta from "./resources/ta/common.json";

const LANG_KEY = "pref:lang";

export const SUPPORTED_LANGS = {
  en: "English",
  zh: "中文",
  ms: "Bahasa Melayu",
  ta: "தமிழ்",
};

const resources = {
  en: { common: en },
  zh: { common: zh },
  ms: { common: ms },
  ta: { common: ta },
};

function pickDeviceLang() {
  // e.g. "en-SG", "zh-Hans-SG" -> take the base if supported
  const tag = Localization.getLocales?.()[0]?.languageCode || "en";
  return Object.keys(SUPPORTED_LANGS).includes(tag) ? tag : "en";
}

export async function getAppLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY);
    if (saved && SUPPORTED_LANGS[saved]) return saved;
  } catch {}
  return pickDeviceLang();
}

export async function setAppLanguage(lang) {
  if (!SUPPORTED_LANGS[lang]) return;
  await AsyncStorage.setItem(LANG_KEY, lang);
  await i18n.changeLanguage(lang);
}

export async function initI18n() {
  const initialLang = await getAppLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: "v3",
      resources,
      lng: initialLang,
      fallbackLng: "en",
      ns: ["common"],
      defaultNS: "common",
      interpolation: {
        escapeValue: false, // RN already safe
      },
      returnNull: false,   // fall back to key if missing
    });

  return i18n;
}
