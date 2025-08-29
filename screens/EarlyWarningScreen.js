/**
 * EarlyWarningScreen
 * ---------------------------------------------------------------------------
 *   Shows a quick “early warnings” overview:
 *     - A full-width, auto-advancing carousel of the most important hazards
 *     - A 2-column grid of hazard cards underneath
 */

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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../theme/ThemeProvider";
import WarningCard from "../components/WarningCard";
import useHazards from "../hooks/useHazards";
import { useTranslation } from "react-i18next";

/* ---- Layout constants ---- */
const SCREEN_PADDING = 16;
const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - SCREEN_PADDING * 2 - GAP) / 2);
const MAX_DOTS = 5;

export default function EarlyWarningScreen({ navigation }) {
  const { theme } = useThemeContext();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation();

  /* --------------------------- Carousel state --------------------------- */
  const [currentIndex, setCurrentIndex] = useState(0);
  // Ask for at most 5 cards to keep the hero and grid snappy
  const { loading, cards: ewCards = [] } = useHazards(undefined, 5);
  const carouselRef = useRef(null);

  // Auto-advance the carousel every 5 seconds.
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

  // Sync page index after manual swipes
  const onMomentumEnd = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
  };

  // Compute a sliding window of dot indices so we show at most MAX_DOTS
  // indicators. This keeps the overlay compact even if there are many slides.
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

  const isEmpty = !ewCards.length;

  /* --------------------------- List header copy -------------------------- */
  const ListHeader = (
    <View style={styles.headerCopy}>
      <Text style={styles.h1}>{t("home.early.title", "Early Warning")}</Text>
      <Text style={styles.p}>
        {t("home.early.subtitle", "Monitoring common hazards")}
      </Text>
    </View>
  );

  /* -------------------------------- Render ------------------------------- */
  return (
    <SafeAreaView style={styles.safe}>
      {/* ===== HERO: full-width carousel (or placeholder while loading) ===== */}
      <View style={styles.hero}>
        {isEmpty ? (
          <View style={styles.heroPlaceholder}>
            <ActivityIndicator size="small" color="#ffffff" />
          </View>
        ) : (
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
            // Small perf hints; the hero list is tiny
            initialNumToRender={3}
            windowSize={3}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("HazardDetail", { hazard: item.hazard })
                }
                style={{ width: SCREEN_WIDTH, height: "100%" }}
              >
                {/* Slide image + gradient to improve text contrast */}
                <Image source={item.img} style={styles.heroImg} />
                <LinearGradient
                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
                  style={styles.heroGradient}
                />
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.heroDesc} numberOfLines={2}>
                    {item.desc ||
                      item.hazard?.summary ||
                      t("home.early.tap_to_view", "Tap to view details")}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Back button overlaid on the hero (always available) */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", "Back")}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Dot indicators (only when slides are present) */}
        {!isEmpty && (
          <View style={styles.dots}>
            {hasLeft && <View style={[styles.dot, styles.dotFaded]} />}
            {dotIndices.map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex ? styles.dotActive : null,
                ]}
              />
            ))}
            {hasRight && <View style={[styles.dot, styles.dotFaded]} />}
          </View>
        )}
      </View>

      {/* ===== GRID: hazard cards; empty+loading fallbacks ===== */}
      {loading && isEmpty ? (
        <View style={styles.listLoaderWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>
            {t("common.loading", "Loading…")}
          </Text>
        </View>
      ) : (
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
          ListEmptyComponent={
            <Text style={[styles.p, { textAlign: "center", marginTop: 16 }]}>
              {t("home.early.none", "No hazards right now.")}
            </Text>
          }
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
          // Modest perf hints for mid-size lists
          initialNumToRender={6}
          windowSize={8}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.appBg },

    // HERO / Carousel
    hero: {
      height: 180,
      backgroundColor: theme.key === "dark" ? "#1F2937" : "#e7eef8",
    },
    heroPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    heroImg: { width: "100%", height: "100%", resizeMode: "cover" },
    heroGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 90,
    },
    heroOverlay: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 10,
    },
    heroTitle: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 16,
      marginBottom: 4,
      textShadowColor: "rgba(0,0,0,0.35)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    heroDesc: {
      color: "#F3F4F6",
      fontSize: 12,
      lineHeight: 16,
    },

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

    // Dot indicators (centered group with a subtle backdrop)
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
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.7)",
    },
    dotActive: { backgroundColor: "#ffffff" },
    dotFaded: { opacity: 0.45 },

    // Header for the grid
    headerCopy: { paddingTop: 14, paddingBottom: 6 },
    h1: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.colors.text,
      marginBottom: 6,
    },
    p: { color: theme.colors.subtext, lineHeight: 20, marginBottom: 8 },

    // Grid loader
    listLoaderWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 24,
    },
    loaderText: {
      marginTop: 8,
      color: theme.colors.subtext,
    },
  });
