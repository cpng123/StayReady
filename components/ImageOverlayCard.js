import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Simple image card with rounded corners, a black gradient covering the bottom half,
 * and a title over the gradient.
 */
export default function ImageOverlayCard({
  title,
  source,
  width = 180,
  height = 120,
  borderRadius = 16,
  onPress,
  style,
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.5 : 1}
      onPress={onPress}
      style={[{ width, height, borderRadius }, styles.wrap, style]}
    >
      <Image source={source} style={[styles.img, { borderRadius }]} />

      {/* bottom-half gradient */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={[styles.gradient, { borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius }]}
      />

      {/* Title on top of gradient */}
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  img: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "30%",
  },
  titleWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 5,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: 'center',
  },
});
