// theme/ThemeProvider.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { lightTheme, darkTheme } from "./themes";

const STORAGE_KEY = "@stayready_theme";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = Appearance.getColorScheme();
  const [themeKey, setThemeKey] = useState(system === "dark" ? "dark" : "light");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") setThemeKey(saved);
      } catch {}
    })();
  }, []);

  const theme = themeKey === "dark" ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({
      themeKey,
      theme,
      setThemeKey: async (key) => {
        const next = key === "dark" ? "dark" : "light";
        setThemeKey(next);
        try { await AsyncStorage.setItem(STORAGE_KEY, next); } catch {}
      },
      toggleTheme: async () => {
        const next = themeKey === "dark" ? "light" : "dark";
        setThemeKey(next);
        try { await AsyncStorage.setItem(STORAGE_KEY, next); } catch {}
      },
    }),
    [themeKey]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
