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
import { pickRandomTips } from "../utils/tips";
import { getDailyToday } from "../utils/dailyChallenge";
import { getStatsSummary } from "../utils/progressStats";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

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
  heatstroke: require("../assets/General/quiz-heatstroke.jpg")
};

export default function GamesScreen({ navigation }) {
  const nav = useNavigation();
  const { theme } = useThemeContext();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { t, i18n } = useTranslation();

  // Dynamically load quiz.json based on the selected language
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
      console.warn(
        "⚠️ Could not load localized quiz.json, falling back to EN.",
        e
      );
      return require("../i18n/resources/en/quiz.json");
    }
  }, [i18n.language]);

  const categories = useMemo(
    () =>
      (QUIZ?.categories ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        image: QUIZ_IMAGES[c.id],
        setCount: (c.sets ?? []).length,
      })),
    [t]
  );

  const [stats, setStats] = useState({ taken: 0, accuracy: 0, streak: 0 });

  // -------------- Localize Quick Tips here ----------------
  const rawTips = useMemo(() => pickRandomTips(5), []);
  const tips = useMemo(() => {
    return (rawTips || []).map((tip) => {
      // Category title from preparedness ns; fallback to home.prep.topic.*; fallback to existing title
      const categoryTitle =
        t(`${tip.categoryId}.title`, {
          ns: "preparedness",
          defaultValue: "",
        }) ||
        t(`home.prep.topic.${tip.categoryId}`, {
          ns: "common",
          defaultValue: tip.categoryTitle || "",
        }) ||
        tip.categoryTitle ||
        "";

      // Tip text by convention:
      // 1) if tip.i18nKey exists, use it directly (ns can be encoded in the key if you like)
      // 2) else use common: tips.{tip.id}.text
      // 3) fallback to original tip.text
      const text =
        (tip.i18nKey ? t(tip.i18nKey) : "") ||
        t(`tips.${tip.id}.text`, {
          ns: "common",
          defaultValue: tip.text || "",
        }) ||
        tip.text ||
        "";

      return { ...tip, categoryTitle, text };
    });
    // re-run when language changes
  }, [rawTips, t, i18n.language]);
  // --------------------------------------------------------

  const [daily, setDaily] = useState({ loading: true, data: null });

  const refreshDaily = async () => {
    const data = await getDailyToday(QUIZ);
    setDaily({ loading: false, data });
  };

  const refreshStats = async () => {
    const s = await getStatsSummary();
    setStats(s);
  };

  useFocusEffect(
    React.useCallback(() => {
      refreshDaily();
      refreshStats();
    }, [i18n.language])
  );

  const onDailyPress = () => {
    if (!daily.data) return;
    const { questions, completed, key, review, meta } = daily.data;

    if (completed) {
      nav.navigate("ReviewAnswer", {
        title: t("games.daily.review_title", "Daily Challenge — Review"),
        review: Array.isArray(review) ? review : [],
        meta: meta || {
          setId: key,
          setTitle: t("games.daily.title", "Daily Challenge"),
          categoryId: "daily",
          categoryLabel: t("games.daily.category_label", "Daily"),
        },
      });
    } else {
      nav.navigate("QuizPlay", {
        mode: "daily",
        title: t("games.daily.title", "Daily Challenge"),
        customQuestions: questions,
        meta: {
          setId: key,
          setTitle: t("games.daily.title", "Daily Challenge"),
          categoryId: "daily",
          categoryLabel: t("games.daily.category_label", "Daily"),
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

  const dailyBtnText = daily.loading
    ? t("games.daily.loading", "Loading...")
    : daily.data?.completed
    ? t("games.daily.review_answer", "Review Answer")
    : t("games.daily.start", "Start Challenge");

  const Header = (
    <View style={styles.headerWrap}>
      <Text style={styles.h1}>{t("games.title", "Safety Quiz")}</Text>
      <Text style={styles.hSub}>
        {t("games.subtitle", "Quiz your preparedness skills.")}
      </Text>

      {/* Stats */}
      <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
        <StatCol
          label={t("games.stats.taken", "Quiz Taken")}
          value={`${stats.taken}`}
          theme={theme}
        />
        <View
          style={{
            backgroundColor: theme.key === "dark" ? "#2A2F3A" : "#E5E7EB",
            width: 1,
            marginVertical: 6,
          }}
        />
        <StatCol
          label={t("games.stats.accuracy", "Recent Accuracy")}
          value={`${Math.round(stats.accuracy)}%`}
          theme={theme}
        />
        <View
          style={{
            backgroundColor: theme.key === "dark" ? "#2A2F3A" : "#E5E7EB",
            width: 1,
            marginVertical: 6,
          }}
        />
        <StatCol
          label={t("games.stats.streak", "Day Streak")}
          value={`${stats.streak}`}
          theme={theme}
        />
      </View>

      {/* Daily challenge */}
      <TouchableOpacity activeOpacity={0.85} onPress={onDailyPress}>
        <ImageBackground
          source={require("../assets/General/quiz-background.jpg")}
          style={styles.dailyCard}
          imageStyle={{ borderRadius: 16 }}
        >
          <View style={styles.dailyOverlay} />
          <View style={styles.dailyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dailyTitle}>
                {t("games.daily.title", "Daily Challenge")}
              </Text>
              <Text style={styles.dailySub}>
                {t("games.daily.questions_count", {
                  count: daily.data?.questions?.length ?? 10,
                  defaultValue: "{{count}} Questions",
                })}
              </Text>
              <View style={styles.dailyBtn}>
                <Text style={styles.dailyBtnText}>{dailyBtnText}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        {t("games.quick_tips", "Quick Tips")}
      </Text>
      <QuickTipsCarousel
        tips={tips}
        theme={theme}
        styles={styles}
        onPressTip={goToGuide}
      />

      <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
        {t("games.categories_quiz", "Categories Quiz")}
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
    tipCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      padding: 14,
      minHeight: 90,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    tipBar: {
      width: 4,
      alignSelf: "stretch",
      borderRadius: 3,
      marginRight: 10,
    },
    tipTitle: {
      fontWeight: "800",
      fontSize: 14,
      marginBottom: 4,
      lineHeight: 18,
    },
    tipBodyWrap: {
      height: 34,
      justifyContent: "flex-start",
      overflow: "hidden",
    },
    tipBody: { fontSize: 12, lineHeight: 17 },
    tipCta: { fontSize: 12, fontWeight: "800", marginLeft: 10 },
  });
