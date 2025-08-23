// screens/GamesScreen.js
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ImageBackground,
} from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";
import ImageOverlayCard from "../components/ImageOverlayCard";
import QuickTipsCarousel from "../components/QuickTipsCarousel";
import QUIZ from "../data/quiz.json";
import { pickRandomTips } from "../utils/tips";
import { getDailyToday } from "../utils/dailyChallenge";
import { useFocusEffect } from "@react-navigation/native";

const SCREEN_PADDING = 16;
const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - SCREEN_PADDING * 2 - GAP) / 2);

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

export default function GamesScreen({ navigation }) {
  const { theme } = useThemeContext();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const categories = useMemo(
    () =>
      (QUIZ?.categories ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        image: QUIZ_IMAGES[c.id],
        setCount: (c.sets ?? []).length,
      })),
    []
  );

  const [stats] = useState({ taken: 22, accuracy: 1.0, streak: 10 });
  const tips = useMemo(() => pickRandomTips(5), []);

  const [daily, setDaily] = useState({ loading: true, data: null });

  const refreshDaily = async () => {
    const data = await getDailyToday(QUIZ);
    setDaily({ loading: false, data });
  };

  useFocusEffect(
    React.useCallback(() => {
      refreshDaily();
    }, [])
  );

  const onDailyPress = () => {
    if (!daily.data) return;
    const { questions, completed, key, review, meta } = daily.data;

    if (completed) {
      navigation.navigate("ReviewAnswer", {
        title: "Daily Challenge — Review",
        review: Array.isArray(review) ? review : [],
        meta: meta || {
          setId: key,
          setTitle: "Daily Challenge",
          categoryId: "daily",
          categoryLabel: "Daily",
        },
      });
    } else {
      navigation.navigate("QuizPlay", {
        mode: "daily",
        title: "Daily Challenge",
        customQuestions: questions,
        meta: {
          setId: key,
          setTitle: "Daily Challenge",
          categoryId: "daily",
          categoryLabel: "Daily",
        },
      });
    }
  };

  const openCategory = (cat) => {
    navigation.navigate?.("QuizSets", { categoryId: cat.id, title: cat.title });
  };

  const goToGuide = (tip) => {
    navigation.navigate?.("PreparednessGuide", { id: tip.categoryId });
  };

  const Header = (
    <View style={styles.headerWrap}>
      <Text style={styles.h1}>Safety Quiz</Text>
      <Text style={styles.hSub}>Quiz your preparedness skills.</Text>

      {/* Stats - single container with shadow */}
      <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
        <StatCol label="Quiz Taken" value={`${stats.taken}`} theme={theme} />
        <View
          style={{
            backgroundColor: theme.key === "dark" ? "#2A2F3A" : "#E5E7EB",
            width: 1,
          }}
        />
        <StatCol
          label="Recent Accuracy"
          value={`${Math.round(stats.accuracy * 100)}%`}
          theme={theme}
        />
        <View
          style={{
            backgroundColor: theme.key === "dark" ? "#2A2F3A" : "#E5E7EB",
            width: 1,
          }}
        />
        <StatCol label="Day Streak" value={`${stats.streak}`} theme={theme} />
      </View>

      {/* Daily challenge with image background */}
      <TouchableOpacity activeOpacity={0.85} onPress={onDailyPress}>
        <ImageBackground
          source={require("../assets/General/quiz-background.jpg")}
          style={styles.dailyCard}
          imageStyle={{ borderRadius: 16 }}
        >
          <View style={styles.dailyOverlay} />
          <View style={styles.dailyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dailyTitle}>Daily Challenge</Text>
              <Text style={styles.dailySub}>
                {daily.data?.questions?.length ?? 10} Questions
              </Text>
              <View style={styles.dailyBtn}>
                <Text style={styles.dailyBtnText}>
                  {daily.loading
                    ? "Loading..."
                    : daily.data?.completed
                    ? "Review Answer"
                    : "Start Challenge"}
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Quick Tips</Text>
      <QuickTipsCarousel
        tips={tips}
        theme={theme}
        styles={styles}
        onPressTip={goToGuide}
      />

      <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
        Categories Quiz
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.appBg }]}
    >
      <FlatList
        data={categories}
        keyExtractor={(i) => i.id}
        numColumns={2}
        ListHeaderComponent={Header}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ImageOverlayCard
            title={item.title}
            source={item.image}
            width={CARD_WIDTH}
            height={120}
            style={{ marginBottom: GAP }}
            onPress={() => openCategory(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function StatCol({ label, value, theme }) {
  return (
    <View style={pillStyles.col}>
      <Text style={[pillStyles.value, { color: theme.colors.text }]}>
        {value}
      </Text>
      <Text style={[pillStyles.label, { color: theme.colors.subtext }]}>
        {label}
      </Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  col: { flex: 1, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 18, fontWeight: "800" },
  label: { marginTop: 2, fontSize: 12, fontWeight: "600" },
});

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },

    headerWrap: { paddingTop: 10, paddingBottom: 8 },
    h1: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
    hSub: {
      color: theme.colors.subtext,
      fontSize: 14,
      marginTop: 2,
      marginBottom: 14,
    },

    // stats container
    statsCard: {
      flexDirection: "row",
      alignItems: "stretch",
      borderRadius: 15,
      paddingVertical: 12,
      paddingHorizontal: 10,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },

    // daily challenge
    dailyCard: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 14,
      paddingVertical: 2,
    },
    dailyOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.25)",
    },
    dailyRow: {
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dailyTitle: { color: "#fff", fontWeight: "800", fontSize: 20 },
    dailySub: {
      color: "#E5ECFF",
      marginTop: 2,
      marginBottom: 10,
      fontSize: 14,
    },
    dailyBtn: {
      alignSelf: "flex-start",
      backgroundColor: "#fff",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
    },
    dailyBtnText: { color: "#1D4ED8", fontWeight: "800" },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.colors.text,
      marginTop: 6,
      marginBottom: 4,
    },
  });
