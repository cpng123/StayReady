/**
 * QuizSetsScreen
 * -----------------------------------------------------------------------------
 * Topic landing page for quizzes. Displays a hero image, localized header copy,
 * and a 2-column grid of quiz “sets” for the selected category.
 */

import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import QuizSetCard from "../components/QuizSetCard";
import { useTranslation } from "react-i18next";

// Mapping from category id → hero image used for both header and cards. 
const QUIZ_IMAGES = {
  flood: require("../assets/General/quiz-flood.jpg"),
  haze: require("../assets/General/quiz-haze.jpg"),
  storm: require("../assets/General/quiz-storm.jpg"),
  dengue: require("../assets/General/quiz-dengue.jpg"),
  wind: require("../assets/General/quiz-wind.jpg"),
  aid: require("../assets/General/quiz-aid.jpg"),
  fire: require("../assets/General/quiz-fire.jpg"),
  kit: require("../assets/General/quiz-kit.jpg"),
  disease: require("../assets/General/quiz-disease.jpg"),
  earthquake: require("../assets/General/quiz-earthquake.jpg"),
  heatstroke: require("../assets/General/quiz-heatstroke.jpg"),
};

// Layout constants
const SCREEN_PADDING = 16;
const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 2-column card width, accounting for outer padding and inter-card gap.
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - SCREEN_PADDING * 2 - GAP) / 2);

// Renders the list of quiz sets belonging to a category.
export default function QuizSetsScreen({ navigation, route }) {
  const { theme } = useThemeContext();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { i18n } = useTranslation();

  // Select the localized quiz bundle once per language.
  // Falls back to English if a specific locale file isn't found.
  const QUIZ = useMemo(() => {
    try {
      switch (i18n.language) {
        case "ms":
          return require("../i18n/resources/ms/quiz.json");
        case "ta":
          return require("../i18n/resources/ta/quiz.json");
        case "zh":
          return require("../i18n/resources/zh/quiz.json");
        default:
          return require("../i18n/resources/en/quiz.json");
      }
    } catch (e) {
      console.warn("Could not load localized quiz.json, fallback to EN.", e);
      return require("../i18n/resources/en/quiz.json");
    }
  }, [i18n.language]);

  // Resolve active category (fallback to first category if none is provided).
  const categoryId = route?.params?.categoryId;
  const category =
    (QUIZ?.categories ?? []).find((c) => c.id === categoryId) ??
    (QUIZ?.categories ?? [])[0];

  // Pick a hero image based on category id; default to flood.
  const heroImage = QUIZ_IMAGES[category?.id] ?? QUIZ_IMAGES.flood;

  // Build header title: "<Topic> Quizzes" (localized suffix if available).
  const titleBase = route?.params?.title || category?.title || "Quiz";
  const title = `${titleBase} ${QUIZ?.strings?.quizzesSuffix || "Quizzes"}`;

  // Prefer a localized intro from the category; else use the template/fallback.
  const intro =
    category?.intro ||
    (QUIZ?.strings?.introTemplate
      ? QUIZ.strings.introTemplate.replace("{{topic}}", titleBase.toLowerCase())
      : `Complete these quizzes to build confidence and stay safe during ${titleBase.toLowerCase()}.`);

  const sets = category?.sets ?? [];

  //Navigate to the quiz play screen for the selected set.
  const openSet = (set) => {
    navigation.navigate("QuizPlay", {
      categoryId,
      setId: set.id,
      title: set.title,
    });
  };

  // Render a single quiz set tile.
  const renderItem = ({ item }) => {
    const count = item.questions?.length ?? item.count ?? 10;
    return (
      <QuizSetCard
        title={item.title}
        questionsCount={count}
        thumbnail={heroImage}
        onPress={() => openSet(item)}
        style={{ width: CARD_WIDTH }}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.appBg }]}
    >
      {/* Hero header with back button */}
      <View style={styles.hero}>
        <ImageBackground
          source={heroImage}
          style={styles.heroImg}
          imageStyle={{ resizeMode: "cover" }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            style={[styles.backBtn, { backgroundColor: theme.colors.overlay }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
        </ImageBackground>
      </View>

      {/* Title + intro copy */}
      <View style={styles.headerCopy}>
        <Text style={[styles.h1, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.p, { color: theme.colors.subtext }]}>{intro}</Text>
      </View>

      {/* Sets grid */}
      <FlatList
        data={sets}
        keyExtractor={(s) => s.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },

    hero: {
      height: 180,
      backgroundColor: theme.key === "dark" ? "#1F2937" : "#E6EEF9",
    },
    heroImg: { flex: 1, width: "100%", height: "100%" },

    backBtn: {
      position: "absolute",
      left: 12,
      top: 12,
      height: 36,
      width: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },

    headerCopy: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: 12,
      paddingBottom: 6,
    },
    h1: { fontSize: 20, fontWeight: "800" },
    p: { marginTop: 6, lineHeight: 20, fontSize: 14, marginBottom: 10 },
  });
