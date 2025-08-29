/**
 * File: components/SearchRow.js
 * Purpose: Compact search bar with optional sort toggle, themed for light/dark and i18n-aware.
 *
 * Responsibilities:
 *  - Render a text input with leading search icon and localized placeholder.
 *  - Emit value changes via onChangeText and support the "search" return key.
 *  - Optionally show a sort toggle button (swap-vertical icon) that calls onSortToggle.
 *  - Adapt container, border, and text colors based on the current theme.
 *
 * Props:
 *  - value, onChangeText, placeholder?, onSortToggle?, showSort=true
 */

import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";

export default function SearchRow({
  value,
  onChangeText,
  placeholder,
  onSortToggle,
  showSort = true,
}) {
  const { theme } = useThemeContext();
  const dark = theme.key === "dark";
  const { t } = useTranslation();

  const ph = placeholder ?? t("common.search", { ns: "common" });

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: dark ? "#101316" : "#F2F4F7",
          borderColor: dark ? "#1F2937" : "#E5E7EB",
        },
      ]}
    >
      <Ionicons name="search" size={18} color={dark ? "#9CA3AF" : "#6B7280"} />
      <TextInput
        placeholder={ph}
        placeholderTextColor={dark ? "#9CA3AF" : "#6B7280"}
        style={[styles.input, { color: theme.colors.text }]}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
      {showSort && (
        <TouchableOpacity onPress={onSortToggle} activeOpacity={0.6}>
          <Ionicons
            name="swap-vertical"
            size={20}
            color={dark ? "#E5E7EB" : "#374151"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  input: { flex: 1, marginLeft: 8, fontSize: 14, paddingVertical: 5 },
});
