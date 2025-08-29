/**
 * File: theme/ThemeProvider.js
 * Purpose: Provide a global light/dark theme context with persistence.
 *
 * Responsibilities:
 *  - Read the saved theme from AsyncStorage on boot.
 *  - Default to the system color scheme on first run.
 *  - Expose the active theme object and helpers (`setThemeKey`, `toggleTheme`).
 *  - Persist any theme changes back to AsyncStorage.
 *
 * Notes:
 *  - `lightTheme` / `darkTheme` should each include `navTheme`, `colors`, etc.
 *  - Throw a clear error if `useThemeContext` is used outside the provider.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { lightTheme, darkTheme } from "./themes";

// Storage key for the persisted theme ("light" | "dark")
const STORAGE_KEY = "@stayready_theme";

// React Context for theming (value shape defined in the provider below)
const ThemeContext = createContext(null);

// Top-level provider component: loads, persists, and exposes theme state
export function ThemeProvider({ children }) {
  // Seed with the current system scheme for first render
  const system = Appearance.getColorScheme();
  const [themeKey, setThemeKey] = useState(system === "dark" ? "dark" : "light");

  // On mount: load any previously saved theme selection
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") setThemeKey(saved);
      } catch {
        // ignore; fall back to system default already applied
      }
    })();
  }, []);

  // Resolve the concrete theme object from the key
  const theme = themeKey === "dark" ? darkTheme : lightTheme;

  // Memoize context value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({
      themeKey, // "light" | "dark"
      theme,    // concrete theme object used by the app

      // Set an explicit theme key and persist it
      setThemeKey: async (key) => {
        const next = key === "dark" ? "dark" : "light";
        setThemeKey(next);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, next);
        } catch {
          // ignore persistence failure; in-memory state still updates
        }
      },

      // Toggle between light/dark and persist the choice
      toggleTheme: async () => {
        const next = themeKey === "dark" ? "light" : "dark";
        setThemeKey(next);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, next);
        } catch {
          // ignore persistence failure; in-memory state still updates
        }
      },
    }),
    [themeKey]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Consumer hook: ensures usage within <ThemeProvider />
export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
