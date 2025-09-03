/**
 * File: components/TopBar.js
 * Purpose: Lightweight header with back button, centered title, and optional right action.
 *
 * Responsibilities:
 *  - Render an iOS-like back chevron and call `onBack` when pressed.
 *  - Center the title and gracefully truncate long text.
 *  - Optionally show a right-side icon button and forward presses via `onRightPress`.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";

export default function TopBar({
  title,
  onBack,
  rightIcon = null,
  onRightPress = null,
}) {
  const { theme } = useThemeContext();

  // Expand touch target for better ergonomics
  const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

  return (
    <View style={styles.wrap}>
      {/* Left: back */}
      <TouchableOpacity
        onPress={onBack}
        style={styles.leftBtn}
        activeOpacity={0.8}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
      </TouchableOpacity>

      {/* Center: title */}
      <Text
        style={[styles.title, { color: theme.colors.text }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Right: optional action (keeps layout balanced when absent) */}
      {rightIcon ? (
        <TouchableOpacity
          onPress={onRightPress}
          style={styles.rightBtn}
          activeOpacity={0.8}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={rightIcon}
        >
          <Ionicons name={rightIcon} size={22} color={theme.colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftBtn: {
    position: "absolute",
    left: 8,
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  rightBtn: {
    position: "absolute",
    right: 8,
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800", maxWidth: "70%", textAlign: "center" },
});
