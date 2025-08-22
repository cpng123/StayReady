// screens/QuizSetsScreen.js
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
import QUIZ from "../data/quiz.json";
import QuizSetCard from "../components/QuizSetCard";

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
};

const SCREEN_PADDING = 16;
const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - SCREEN_PADDING * 2 - GAP) / 2);

export default function QuizSetsScreen({ navigation, route }) {
  const { theme } = useThemeContext();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const categoryId = route?.params?.categoryId;
  const category =
    (QUIZ?.categories ?? []).find((c) => c.id === categoryId) ??
    (QUIZ?.categories ?? [])[0];

  const heroImage = QUIZ_IMAGES[category?.id] ?? QUIZ_IMAGES.flood;
  const title = `${category?.title ?? "Quiz"} Quizzes`;
  const intro =
    category?.intro ??
    `Complete these quizzes to build confidence and stay safe during ${
      category?.title?.toLowerCase() || "emergencies"
    }.`;

  const sets = category?.sets ?? [];

  const openSet = (set) => {
    navigation.navigate("QuizPlay", {
      categoryId,
      setId: set.id,
      title: set.title,
    });
  };

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
