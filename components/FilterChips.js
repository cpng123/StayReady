/**
 * File: components/FilterChips.js
 * Purpose: Render a horizontally scrollable row of “pill” chips to filter/scope content.
 *
 * Responsibilities:
 *  - Display options [{ id, label }] as tappable chips.
 *  - Visually highlight the active chip (activeId).
 *  - Call onChange(id) when a chip is tapped.
 *  - Respect light/dark theme colors.
 *
 * Props:
 *  - options: Array<{ id: string, label: string }>
 *  - activeId: string
 *  - onChange: (id: string) => void
 */

import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";

export default function FilterChips({ options, activeId, onChange }) {
  const { theme } = useThemeContext();
  const dark = theme.key === "dark";

  return (
    // Outer spacing before the chip row
    <View style={{ marginBottom: 12 }}>
      {/* Horizontal, scrollable list of chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={options}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => {
          const active = item.id === activeId;

          // One chip (active vs inactive styling)
          return (
            <TouchableOpacity
              onPress={() => onChange(item.id)}
              activeOpacity={0.85}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: theme.colors.primary }
                  : { backgroundColor: dark ? "#1F2937" : "#EAECEF" },
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? "#fff" : theme.colors.text },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: "700" },
});
