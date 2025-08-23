import React, { useState, useEffect, useContext, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
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

const { width, height } = Dimensions.get("window");

// Local quotes — short, positive, preparedness-themed
const QUOTES = [
  "Learning is a journey, and you just leveled up.",
  "Prepared today, confident tomorrow.",
  "Small steps build strong readiness.",
  "Knowledge now is safety later.",
  "Readiness is a habit, not a moment.",
  "Practice makes prepared.",
  "Stay calm, stay ready, stay safe.",
  "Every question answered adds another layer of safety.",
  "Preparedness is the best plan B.",
  "Your future self thanks you for training today.",
  "In an emergency, knowledge is power.",
  "A little learning today can save a lot tomorrow.",
];

export default function QuizResultScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  // Params from QuizPlay (with safe fallbacks)
  const {
    title = "Quiz Challenge",
    score = 0, // XP gained
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

  // Pick a quote once on mount
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const getResultTitle = (pct) => {
    if (pct >= 80) return "Outstanding! Preparedness Pro!";
    if (pct >= 60) return "Great job—Ready Ranger!";
    if (pct >= 40) return "Nice effort—Keep training!";
    return "Good start—Let's level up!";
  };
  const onShare = async () => {
    try {
      const msg = `🎉 I scored ${pct}% (+${score} XP) in "${title}" in ${
        minutes > 0 ? `${minutes}m ` : ""
      }${seconds}s. Think you can beat me?`;
      await Share.share({ message: msg });
    } catch (e) {
      // no-op
    }
  };

  const onReturnHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main", state: { routes: [{ name: "Home" }] } }],
    });
  };

  const onReview = () => {
    navigation.navigate("ReviewAnswer", {
      title: "Review Questions",
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
            {/* soft rings */}
            <View style={s.circleLarge} />
            <View style={s.circleMedium} />
            <View style={s.circleSmall} />

            <Text style={[s.scoreLabel, { color: "#1976FF" }]}>Your Score</Text>
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
                Time Taken
              </Text>
            </View>
            <Text
              style={[
                s.statValue,
                { color: theme.key === "dark" ? "#E5E7EB" : "#111827" },
              ]}
            >
              {minutes > 0 ? `${minutes} min ` : ""}
              {seconds} sec
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
                XP Gained
              </Text>
            </View>
            <Text
              style={[
                s.statValue,
                { color: theme.key === "dark" ? "#E5E7EB" : "#111827" },
              ]}
            >
              +{score} XP
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
              Review Answer
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
              Share Result
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.homeBtn, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.95}
          onPress={onReturnHome}
        >
          <Text style={s.homeBtnText}>Return Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
    },

    // Top hero
    heroWrap: {
      width,
      height: height * 0.52,
      overflow: "hidden",
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      backgroundColor: "#1976FF",
    },
    hero: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    heroImage: {
      resizeMode: "cover",
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
    },

    // Score ring
    scoreWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    scoreLabel: {
      fontSize: 17,
      fontWeight: "700",
    },
    scoreValue: {
      fontSize: 46,
      fontWeight: "700",
    },
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

    // Card
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

    // Stats
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

    // Actions
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
