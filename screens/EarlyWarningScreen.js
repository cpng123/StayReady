// screens/EarlyWarningScreen.js
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import WarningCard from "../components/WarningCard";
import useHazards from "../utils/useHazards";
import { useTranslation } from "react-i18next";

const SCREEN_PADDING = 16;
const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - SCREEN_PADDING * 2 - GAP) / 2);

const MAX_DOTS = 5; // cap the number of visible dots

export default function EarlyWarningScreen({ navigation }) {
  const { theme } = useThemeContext();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation();

  // ---- Carousel state ----
  const [currentIndex, setCurrentIndex] = useState(0);
  const { cards: ewCards } = useHazards(undefined, 5);
  const carouselRef = useRef(null);

  // Auto-advance every 5s, loop
  useEffect(() => {
    if (!ewCards.length) return;
    const id = setInterval(() => {
      const next = (currentIndex + 1) % ewCards.length;
      if (carouselRef.current) {
        carouselRef.current.scrollToIndex({ index: next, animated: true });
      }
      setCurrentIndex(next);
    }, 5000);
    return () => clearInterval(id);
  }, [currentIndex, ewCards.length]);

  const onMomentumEnd = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
  };

  // Compute a sliding "window" of dots so we never render too many
  const getDotWindow = (total, current, max = MAX_DOTS) => {
    if (total <= max)
      return {
        indices: Array.from({ length: total }, (_, i) => i),
        hasLeft: false,
        hasRight: false,
      };
    const half = Math.floor(max / 2);
    let start = current - half;
    let end = current + (max - half - 1);

    if (start < 0) {
      end += -start;
      start = 0;
    }
    if (end > total - 1) {
      const diff = end - (total - 1);
      start -= diff;
      end = total - 1;
    }
    const indices = [];
    for (let i = start; i <= end; i++) indices.push(i);
    return { indices, hasLeft: start > 0, hasRight: end < total - 1 };
  };

  const {
    indices: dotIndices,
    hasLeft,
    hasRight,
  } = getDotWindow(ewCards.length || 0, currentIndex, MAX_DOTS);

  // ---- List header (title + paragraph) becomes part of FlatList ----
  const ListHeader = (
    <View style={styles.headerCopy}>
      <Text style={styles.h1}>{t("home.early.title", "Early Warning")}</Text>
      <Text style={styles.p}>
        {t("home.early.subtitle", "Monitoring common hazards")}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* ===== Top Carousel ===== */}
      <View style={styles.hero}>
        <FlatList
          ref={carouselRef}
          data={ewCards}
          keyExtractor={(i) => i.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          getItemLayout={(data, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => (
            <Image source={item.img} style={styles.heroImg} />
          )}
        />

        {/* Back (rounded-corner square) */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Dots (windowed) */}
        <View style={styles.dots}>
          {hasLeft && <View style={[styles.dot, styles.dotFaded]} />}
          {dotIndices.map((i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex ? styles.dotActive : null]}
            />
          ))}
          {hasRight && <View style={[styles.dot, styles.dotFaded]} />}
        </View>
      </View>

      {/* ===== Grid list with header inside FlatList ===== */}
      <FlatList
        data={ewCards}
        keyExtractor={(i) => i.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: 5,
        }}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING,
        }}
        renderItem={({ item }) => (
          <WarningCard
            item={item}
            width={CARD_WIDTH}
            imageHeight={90}
            style={{ marginBottom: GAP }}
            onPress={() =>
              navigation.navigate("HazardDetail", { hazard: item.hazard })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.appBg },

    // Carousel
    hero: {
      height: 180,
      backgroundColor: theme.key === "dark" ? "#1F2937" : "#e7eef8",
    },
    heroImg: { width: SCREEN_WIDTH, height: "100%", resizeMode: "cover" },

    backBtn: {
      position: "absolute",
      left: 12,
      top: 12,
      height: 36,
      width: 36,
      borderRadius: 8,
      backgroundColor:
        theme.key === "dark" ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
    },

    dots: {
      position: "absolute",
      bottom: 10,
      alignSelf: "center",
      flexDirection: "row",
      gap: 6,
      backgroundColor:
        theme.key === "dark" ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.15)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    // Use white-ish dots so they work on both themes
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.7)",
    },
    dotActive: { backgroundColor: "#ffffff" },
    dotFaded: { opacity: 0.45 },

    // Header (now part of the FlatList via ListHeaderComponent)
    headerCopy: { paddingTop: 14, paddingBottom: 6 },
    h1: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.colors.text,
      marginBottom: 6,
    },
    p: { color: theme.colors.subtext, lineHeight: 20, marginBottom: 8 },
  });
