/**
 * File: components/ThemeToggle.js
 * Purpose: Two-option segmented toggle to switch between Light/Dark theme.
 *
 * Responsibilities:
 *  - Reflect the current theme from ThemeProvider.
 *  - Persist changes via ThemeProvider’s setThemeKey (which already saves to storage).
 *  - Provide accessible buttons with clear labels and selected state.
 *
 * Props:
 *  - containerStyle (optional): style override for the outer wrapper.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";

export default function ThemeToggle({ containerStyle }) {
  const { theme, themeKey, setThemeKey } = useThemeContext();
  const { t } = useTranslation();

  // Avoid redundant writes; ThemeProvider persists the chosen key internally
  const setTheme = (key) => {
    if (key === themeKey) return;
    setThemeKey(key);
  };

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: themeKey === "dark" ? "#2a2a2dff" : "#F3F4F6" },
        containerStyle,
      ]}
    >
      <TouchableOpacity
        style={[styles.btn, themeKey === "light" && styles.active]}
        onPress={() => setTheme("light")}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ selected: themeKey === "light" }}
        accessibilityLabel={t("settings.theme_light", "Light")}
      >
        <Ionicons
          name="sunny"
          size={20}
          color={themeKey === "light" ? "#fff" : "#6B7280"}
        />
        <Text
          style={[
            styles.text,
            { color: themeKey === "light" ? "#fff" : "#6B7280" },
          ]}
        >
          {t("settings.theme_light", "Light")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, themeKey === "dark" && styles.active]}
        onPress={() => setTheme("dark")}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ selected: themeKey === "dark" }}
        accessibilityLabel={t("settings.theme_dark", "Dark")}
      >
        <Ionicons
          name="moon"
          size={20}
          color={themeKey === "dark" ? "#fff" : "#6B7280"}
        />
        <Text
          style={[
            styles.text,
            { color: themeKey === "dark" ? "#fff" : "#6B7280" },
          ]}
        >
          {t("settings.theme_dark", "Dark")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    padding: 6,
    flexDirection: "row",
    gap: 6,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  active: { backgroundColor: "#0A84FF" },
  text: { fontWeight: "700", fontSize: 15 },
});
