/**
 * QuizResultScreen
 * -----------------------------------------------------------------------------
 * Final results screen for a quiz session.
 */

import React, { useState, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

// Build a localized set of motivational quotes for the results card.
function useQuotes(t) {
  return useMemo(
    () => [
      t(
        "games.result.quotes.1",
        "Learning is a journey, and you just leveled up."
      ),
      t("games.result.quotes.2", "Prepared today, confident tomorrow."),
      t("games.result.quotes.3", "Small steps build strong readiness."),
      t("games.result.quotes.4", "Knowledge now is safety later."),
      t("games.result.quotes.5", "Readiness is a habit, not a moment."),
      t("games.result.quotes.6", "Practice makes prepared."),
      t("games.result.quotes.7", "Stay calm, stay ready, stay safe."),
      t(
        "games.result.quotes.8",
        "Every question answered adds another layer of safety."
      ),
      t("games.result.quotes.9", "Preparedness is the best plan B."),
      t(
        "games.result.quotes.10",
        "Your future self thanks you for training today."
      ),
      t("games.result.quotes.11", "In an emergency, knowledge is power."),
      t(
        "games.result.quotes.12",
        "A little learning today can save a lot tomorrow."
      ),
    ],
    [t]
  );
}

export default function QuizResultScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation();

  // Params from QuizPlay (with safe fallbacks)
  const {
    title = t("games.result.default_title", "Quiz Challenge"),
    score = 0,
    correct = 0,
    total = 0,
    timeTakenSec = 0,
    review = [],
    meta = {},
  } = route.params || {};

  const pct =
    total > 0 ? Math.round((Number(correct) / Number(total)) * 100) : 0;

  const minutes = Math.floor(timeTakenSec / 60);
  const seconds = timeTakenSec % 60;

  // Localized quotes
  const QUOTES = useQuotes(t);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Map a percent score to a localized title for the result card.
  const getResultTitle = (p) => {
    if (p >= 80)
      return t(
        "games.result.titles.outstanding",
        "Outstanding! Preparedness Pro!"
      );
    if (p >= 60)
      return t("games.result.titles.great", "Great job—Ready Ranger!");
    if (p >= 40)
      return t("games.result.titles.ok", "Nice effort—Keep training!");
    return t("games.result.titles.start", "Good start—Let's level up!");
  };

  // Share the current result using the native share sheet.
  // Falls back silently if the share action fails/cancels.
  const onShare = async () => {
    try {
      const msg = t("games.result.share_message", {
        defaultValue:
          '🎉 I scored {{pct}}% (+{{score}} XP) in "{{title}}" in {{time}}. Think you can beat me?',
        pct,
        score,
        title,
        time:
          minutes > 0
            ? t("games.result.time_min_sec", "{{m}}m {{s}}s", {
                m: minutes,
                s: seconds,
              })
            : t("games.result.time_sec", "{{s}}s", { s: seconds }),
      });
      await Share.share({ message: msg });
    } catch {}
  };

  // Reset the navigation stack to the Games tab.
  // Useful after finishing or sharing a result.
  const handleBackToGames = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Main",
          state: {
            routes: [
              {
                name: "Tabs",
                state: {
                  routes: [{ name: "GamesTab" }],
                  index: 0,
                },
              },
            ],
          },
        },
      ],
    });
  };

  // Navigate to review the answered questions.
  // Passes through both the `review` payload and any `meta` fields.
  const onReview = () => {
    navigation.navigate("ReviewAnswer", {
      title: t("games.result.review_title", "Review Questions"),
      review,
      meta,
    });
  };

  return (
    <View
      style={[
        s.container,
        { backgroundColor: theme.colors.appBg, marginTop: -insets.top },
      ]}
    >
      {/* Rounded hero background with score ring */}
      <View style={s.heroWrap}>
        <ImageBackground
          source={require("../assets/General/result-background.jpg")}
          style={s.hero}
          imageStyle={s.heroImage}
        >
          <View style={s.scoreWrap}>
            <View style={s.circleLarge} />
            <View style={s.circleMedium} />
            <View style={s.circleSmall} />

            <Text style={[s.scoreLabel, { color: "#1976FF" }]}>
              {t("games.result.your_score", "Your Score")}
            </Text>
            <Text style={[s.scoreValue, { color: "#1976FF" }]}>{pct}%</Text>
          </View>
        </ImageBackground>
      </View>

      {/* Elevated result card */}
      <View
        style={[
          s.card,
          { backgroundColor: theme.key === "dark" ? "#22252B" : "#fff" },
        ]}
      >
        <Text
          style={[
            s.cardTitle,
            { color: theme.key === "dark" ? "#F3F4F6" : "#1F2937" },
          ]}
        >
          {getResultTitle(pct)}
        </Text>

        <Ionicons
          name="chatbox-ellipses-outline"
          size={30}
          color="#1976FF"
          style={{ marginVertical: 8 }}
        />

        <Text
          style={[
            s.quote,
            { color: theme.key === "dark" ? "#D1D5DB" : "#4B5563" },
          ]}
        >
          “{quote}”
        </Text>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <View style={s.iconLabelRow}>
              <Ionicons
                name="time-outline"
                size={18}
                color={theme.key === "dark" ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                style={[
                  s.statLabel,
                  { color: theme.key === "dark" ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {t("games.result.time_taken", "Time Taken")}
              </Text>
            </View>
            <Text
              style={[
                s.statValue,
                { color: theme.key === "dark" ? "#E5E7EB" : "#111827" },
              ]}
            >
              {minutes > 0
                ? t("games.result.time_min_sec", "{{m}} min {{s}} sec", {
                    m: minutes,
                    s: seconds,
                  })
                : t("games.result.time_sec", "{{s}} sec", { s: seconds })}
            </Text>
          </View>

          <View style={s.statItem}>
            <View style={s.iconLabelRow}>
              <Ionicons
                name="flash-outline"
                size={18}
                color={theme.key === "dark" ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                style={[
                  s.statLabel,
                  { color: theme.key === "dark" ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {t("games.result.xp_gained", "XP Gained")}
              </Text>
            </View>
            <Text
              style={[
                s.statValue,
                { color: theme.key === "dark" ? "#E5E7EB" : "#111827" },
              ]}
            >
              {t("games.result.xp_plus", "+{{xp}} XP", { xp: score })}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={s.actionsWrap}>
        <View style={s.row}>
          <TouchableOpacity
            style={[
              s.halfBtn,
              {
                borderColor: theme.colors.primary,
                marginRight: 6,
              },
            ]}
            onPress={onReview}
            activeOpacity={0.9}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[s.halfBtnText, { color: theme.colors.primary }]}>
              {t("games.result.review_answer", "Review Answer")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.halfBtn,
              {
                borderColor: theme.colors.primary,
                marginLeft: 6,
              },
            ]}
            onPress={onShare}
            activeOpacity={0.9}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[s.halfBtnText, { color: theme.colors.primary }]}>
              {t("games.result.share_result", "Share Result")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.homeBtn, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.95}
          onPress={handleBackToGames}
        >
          <Text style={s.homeBtnText}>
            {t("games.result.back_to_games", "Back to Games")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: "center" },
    heroWrap: {
      width,
      height: height * 0.52,
      overflow: "hidden",
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      backgroundColor: "#1976FF",
    },
    hero: { flex: 1, justifyContent: "center", alignItems: "center" },
    heroImage: {
      resizeMode: "cover",
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
    },
    scoreWrap: { alignItems: "center", justifyContent: "center" },
    scoreLabel: { fontSize: 17, fontWeight: "700" },
    scoreValue: { fontSize: 46, fontWeight: "700" },
    circleLarge: {
      position: "absolute",
      width: width * 0.63,
      height: width * 0.63,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 999,
    },
    circleMedium: {
      position: "absolute",
      width: width * 0.52,
      height: width * 0.52,
      backgroundColor: "rgba(255,255,255,0.4)",
      borderRadius: 999,
    },
    circleSmall: {
      position: "absolute",
      width: width * 0.41,
      height: width * 0.41,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderRadius: 999,
    },
    card: {
      width: "86%",
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginTop: -50,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    cardTitle: { fontSize: 18, fontWeight: "800" },
    quote: {
      textAlign: "center",
      fontStyle: "italic",
      marginBottom: 6,
      paddingHorizontal: 10,
      fontSize: 15,
      fontWeight: "600",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "100%",
      marginTop: 10,
    },
    statItem: { alignItems: "center" },
    iconLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    statLabel: { fontSize: 13, fontWeight: "600" },
    statValue: { marginTop: 2, fontWeight: "800", fontSize: 14 },
    actionsWrap: {
      width: "90%",
      marginTop: "auto",
      marginBottom: 30,
      alignItems: "center",
    },
    row: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    halfBtn: {
      flex: 1,
      flexDirection: "row",
      borderWidth: 1.5,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    halfBtnText: { fontWeight: "700" },
    homeBtn: {
      width: "100%",
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    homeBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  });
