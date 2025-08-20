import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

export default function WarningCard({
  item,
  width = 200,          // default for horizontal list
  imageHeight = 120,     // default for horizontal list
  style,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.card, { width }, style]}
    >
      <Image source={item.img} style={[styles.img, { height: imageHeight }]} />
      <View style={[styles.badge, { backgroundColor: item.color }]}>
        <Text style={styles.badgeText}>{item.level}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.desc} numberOfLines={3}>
          {item.desc}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          Updated {item.updated}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  img: { width: "100%" },
  badge: {
    position: "absolute",
    right: 10,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  body: { padding: 12 },
  title: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 6 },
  desc: { color: "#5E6A7D", fontSize: 12, lineHeight: 16 },
  meta: { marginTop: 8, color: "#A1AAB6", fontSize: 11, textAlign: "right" },
});