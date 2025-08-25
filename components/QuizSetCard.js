// components/QuizSetCard.js
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";

/**
 * Quiz set card
 * - Optional top thumbnail
 * - Bottom row: left (title + questions), right (play button)
 */
export default function QuizSetCard({
  title,
  questionsCount = 10,
  thumbnail,
  onPress,
  style,
}) {
  const { theme } = useThemeContext();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.colors.card }, style]}
    >
      {thumbnail ? <Image source={thumbnail} style={styles.thumb} /> : null}

      <View style={styles.row}>
        {/* Left: title + count */}
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text style={[styles.count, { color: theme.colors.subtext }]}>
            {t("games.daily.questions_count", {
              count: questionsCount,
              defaultValue: "{{count}} Questions",
            })}
          </Text>
        </View>

        {/* Right: play button */}
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.9}
          style={[styles.play, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name="play" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  thumb: {
    width: "100%",
    height: 66,
    resizeMode: "cover",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  title: {
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 18,
  },
  count: {
    marginTop: 4,
    fontSize: 11,
  },
  play: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
