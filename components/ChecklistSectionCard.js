/**
 * File: components/ChecklistSectionCard.js
 * Purpose: Render a single checklist section card showing:
 *  - section title and completion percent
 *  - a progress bar
 *  - tappable items with a left accent bar and a done icon
 *
 * Responsibilities:
 *  - Compute per-section progress (done/total → %).
 *  - Reflect current theme (light/dark) for card, text and shadows.
 *  - Invoke onToggle(sectionId, itemId) when an item row is pressed.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";

// Render a checklist section with progress and tappable items
export default function ChecklistSectionCard({ section, onToggle }) {
  const { theme } = useThemeContext();
  const items = section.items ?? [];
  const color = section.color || theme.colors.primary;
  const dark = theme.key === "dark";

  // Compute done/total and a rounded percentage for the header + bar
  const progress = useMemo(() => {
    const total = items.length || 1;
    const done = items.filter((i) => i.done).length;
    return { done, total, pct: Math.round((done / total) * 100) };
  }, [items]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          shadowColor: dark ? "transparent" : "#000",
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {section.title}
        </Text>
        <Text style={[styles.percent, { color: theme.colors.subtext }]}>
          {progress.pct}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View
        style={[
          styles.track,
          { backgroundColor: dark ? "#252424ff" : "#E5E7EB" },
        ]}
      >
        <View
          style={[
            styles.fill,
            { width: `${progress.pct}%`, backgroundColor: color },
          ]}
        />
      </View>

      {/* Item list */}
      <View style={{ marginTop: 8 }}>
        {items.map((it) => {
          const done = !!it.done;
          return (
            <TouchableOpacity
              key={it.id}
              activeOpacity={0.85}
              onPress={() => onToggle?.(section.id, it.id)}
              style={[
                styles.row,
                {
                  backgroundColor: dark ? "#252424ff" : "#F6F7F9",
                  shadowColor: dark ? "transparent" : "#000",
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={it.text}
              accessibilityState={{ checked: done }}
            >
              {/* Full-height accent bar at the far left */}
              <View style={[styles.rowAccent, { backgroundColor: color }]} />

              <Text style={[styles.rowText, { color: theme.colors.text }]}>
                {it.text}
              </Text>

              <Ionicons
                name={done ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={done ? color : theme.colors.subtext}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const ROW_RADIUS = 12;
const ACCENT_W = 8;

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: "800", flex: 1 },
  percent: { fontSize: 12, fontWeight: "800" },

  track: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },

  row: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: ROW_RADIUS,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: ACCENT_W + 12, // leave space for the accent + gap
    marginTop: 8,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  // Full-height vertical bar on the far left
  rowAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: ACCENT_W,
    borderTopLeftRadius: ROW_RADIUS,
    borderBottomLeftRadius: ROW_RADIUS,
  },

  rowText: { flex: 1, fontSize: 15 },
});
