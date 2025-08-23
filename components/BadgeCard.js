import React, { memo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

function BadgeCard({ item, theme, onPress }) {
  const locked = !item.achieved;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(item)}
      style={[
        styles.card,
        { backgroundColor: theme.colors.card, shadowColor: "#000" },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} badge`}
    >
      <Image
        source={item.icon}
        style={[styles.icon, locked && styles.lockedImg]}
        resizeMode="contain"
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.desc, { color: theme.colors.subtext }]} numberOfLines={2}>
          {item.desc}
        </Text>

        <View style={styles.progressRow}>
          <View
            style={[
              styles.track,
              { backgroundColor: theme.key === "dark" ? "#2A2F3A" : "#E5E7EB" },
            ]}
          >
            <View
              style={[
                styles.fill,
                {
                  width: `${item.progress}%`,
                  backgroundColor: item.achieved ? theme.colors.primary : "#60A5FA",
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.pct,
              { color: item.achieved ? theme.colors.primary : theme.colors.subtext },
            ]}
          >
            {item.progress}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 8,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: { width: 62, height: 62 },
  lockedImg: { opacity: 0.5 },
  title: { fontWeight: "800", fontSize: 16 },
  desc: { fontSize: 12, fontWeight: "600" },
  progressRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 8 },
  track: { flex: 1, height: 6, borderRadius: 8, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 8 },
  pct: { width: 40, textAlign: "right", fontWeight: "800", fontSize: 12, paddingRight: 10 },
});

export default memo(BadgeCard);
