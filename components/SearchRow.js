// components/SearchRow.js
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
