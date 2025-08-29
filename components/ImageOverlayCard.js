/**
 * File: components/ImageOverlayCard.js
 * Purpose: Display a tappable image tile with rounded corners and a dark
 *          bottom gradient to ensure the overlaid title remains legible.
 *
 * Responsibilities:
 *  - Render an image with configurable size and corner radius.
 *  - Add a bottom area gradient (≈30% height) for text contrast.
 *  - Overlay a single-line title centered above the gradient.
 *  - Optionally handle presses when `onPress` is provided.
 *
 * Props:
 *  - title: string shown over the gradient
 *  - source: Image source (require(...) or { uri })
 *  - width, height: dimensions of the card (defaults: 180×120)
 *  - borderRadius: corner radius (default: 16)
 *  - onPress: optional press handler (touchable only if provided)
 *  - style: optional container style override
 */

import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
    // Container touchable (dim on press only when onPress exists)
    <TouchableOpacity
      activeOpacity={onPress ? 0.5 : 1}
      onPress={onPress}
      style={[{ width, height, borderRadius }, styles.wrap, style]}
    >
      {/* Base image layer */}
      <Image source={source} style={[styles.img, { borderRadius }]} />

      {/* Bottom gradient (≈30% height) for text contrast */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={[
          styles.gradient,
          {
            borderBottomLeftRadius: borderRadius,
            borderBottomRightRadius: borderRadius,
          },
        ]}
      />

      {/* Title overlay */}
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
    textAlign: "center",
  },
});
