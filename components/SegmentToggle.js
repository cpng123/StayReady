/**
 * File: components/SegmentToggle.js
 * Purpose: Pill-style segmented control for switching between a small set of options.
 *
 * Responsibilities:
 *  - Render options evenly in a rounded container.
 *  - Highlight the active option using the theme's primary color.
 *  - Emit onChange(id) when an option is tapped.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";

export default function SegmentToggle({ options, value, onChange }) {
  const { theme } = useThemeContext();
  const dark = theme.key === "dark";

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: dark ? "#2a2a2dff" : "#e0e1e4ff" },
      ]}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.btn,
              { backgroundColor: active ? theme.colors.primary : "transparent" },
            ]}
            onPress={() => onChange?.(opt.id)}
            activeOpacity={0.9}
          >
            {/* optional leading icon */}
            {!!opt.icon && <View style={styles.iconWrap}>{opt.icon}</View>}

            <Text
              style={[
                styles.label,
                { color: active ? "#fff" : theme.colors.subtext },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  iconWrap: { marginRight: 2 },
  label: { fontWeight: "700", fontSize: 15 },
});
