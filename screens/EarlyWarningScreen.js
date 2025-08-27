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
import { evaluateAllHazards } from "../utils/hazard";
import {
  getRainfallLatest,
  getWindLatest,
  getAirTemperatureLatest,
  getRelativeHumidityLatest,
  getPM25Latest,
  getDengueClustersGeoJSON,
} from "../utils/api";
import { getMockFlags } from "../utils/mockFlags";
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
  const [cards, setCards] = useState([]);
  const carouselRef = useRef(null);

  // Auto-advance every 5s, loop
  useEffect(() => {
    if (!cards.length) return;
    const id = setInterval(() => {
      const next = (currentIndex + 1) % cards.length;
      if (carouselRef.current) {
        carouselRef.current.scrollToIndex({ index: next, animated: true });
      }
      setCurrentIndex(next);
    }, 5000);
    return () => clearInterval(id);
  }, [currentIndex, cards.length]);

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
  } = getDotWindow(cards.length || 0, currentIndex, MAX_DOTS);

  // ---- List header (title + paragraph) becomes part of FlatList ----
  const ListHeader = (
    <View style={styles.headerCopy}>
      <Text style={styles.h1}>{t("home.early.title", "Early Warning")}</Text>
      <Text style={styles.p}>
        {t("home.early.subtitle", "Monitoring common hazards")}
      </Text>
    </View>
  );

  // Fetch all datasets once and build 5 hazard cards
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [rain, wind, temp, hum, pm, dengue, mockFlags] =
          await Promise.all([
            getRainfallLatest().catch(() => ({ points: [] })),
            getWindLatest().catch(() => ({ points: [] })),
            getAirTemperatureLatest().catch(() => ({ points: [] })),
            getRelativeHumidityLatest().catch(() => ({ points: [] })),
            getPM25Latest().catch(() => ({ points: [] })),
            getDengueClustersGeoJSON().catch(() => null),
            getMockFlags().catch(() => ({})),
          ]);

        if (!alive) return;

        // Evaluate the five hazards (mock overrides real)
        const hazards = evaluateAllHazards({
          center: { lat: 1.3521, lon: 103.8198 }, // or user center if you want
          rainfallPoints: rain.points || [],
          windPoints: wind.points || [],
          tempPoints: temp.points || [],
          humPoints: hum.points || [],
          pmPoints: pm.points || [],
          dengueGeoJSON: dengue,
          mockFlags,
        });

        // Map hazards → UI cards
        const severityBadge = {
          safe: t("early.severity.safe", "Safe"),
          warning: t("early.severity.med", "Med"),
          danger: t("early.severity.high", "High"),
        };
        const severityColor = {
          safe: "#03A55A",
          warning: "#F29F3D",
          danger: "#F25555",
        };
        const images = {
          flood: require("../assets/General/flash-flood2.jpg"),
          haze: require("../assets/General/pm-haze2.jpg"),
          dengue: require("../assets/General/dengue-cluster2.jpg"),
          wind: require("../assets/General/strong-wind2.jpg"),
          heat: require("../assets/General/heat.jpg"),
        };

        const titleFor = (k) =>
          ({
            flood: t("early.cards.flood.title", "Flash Flood"),
            haze: t("early.cards.haze.title", "Haze (PM2.5)"),
            dengue: t("early.cards.dengue.title", "Dengue Clusters"),
            wind: t("early.cards.wind.title", "Strong Winds"),
            heat: t("early.cards.heat.title", "Heat Advisory"),
          }[k] || t("home.early.title"));

        const descFor = (h) => {
          const sev = h.severity || "safe";
          const loc = h.locationName;
          const m = h.metrics || {};
          switch (h.kind) {
            case "flood":
              return sev === "danger"
                ? t(
                    "early.cards.flood.desc.danger",
                    "Flash flooding around {{place}}. Do not drive through floodwater; avoid underpasses and basements.",
                    { place: loc || "your area" }
                  )
                : sev === "warning"
                ? t(
                    "early.cards.flood.desc.warning",
                    "Heavy showers near {{place}}. Ponding possible. Avoid low-lying roads and kerbside lanes.",
                    { place: loc || "your area" }
                  )
                : t(
                    "early.cards.flood.desc.safe",
                    "No significant rain detected. Drains and canals at normal levels."
                  );
            case "haze":
              return sev === "danger"
                ? t(
                    "early.cards.haze.desc.danger",
                    "Unhealthy PM2.5 in the {{region}}. Stay indoors; use purifier; wear N95 if going out.",
                    { region: loc || "region" }
                  )
                : sev === "warning"
                ? t(
                    "early.cards.haze.desc.warning",
                    "Elevated PM2.5 in the {{region}}. Limit outdoor activity; consider a mask.",
                    { region: loc || "region" }
                  )
                : t(
                    "early.cards.haze.desc.safe",
                    "Air quality is within normal range across Singapore."
                  );
            case "dengue":
              return sev === "danger"
                ? t(
                    "early.cards.dengue.desc.danger",
                    "High-risk cluster near {{place}} ({{cases}}+ cases). Avoid dawn/dusk bites; check home daily; see a doctor if fever persists.",
                    { place: loc || "nearby", cases: m.cases ?? "10" }
                  )
                : sev === "warning"
                ? t(
                    "early.cards.dengue.desc.warning",
                    "Active cluster near {{place}} (~{{km}} km). Remove stagnant water; use repellent.",
                    { place: loc || "nearby", km: m.km ? m.km.toFixed(1) : "—" }
                  )
                : t(
                    "early.cards.dengue.desc.safe",
                    "No active cluster within 5 km of your location."
                  );
            case "wind":
              return sev === "danger"
                ? t(
                    "early.cards.wind.desc.danger",
                    "Damaging winds in the {{region}}. Stay indoors; avoid coastal or open areas.",
                    { region: loc || "region" }
                  )
                : sev === "warning"
                ? t(
                    "early.cards.wind.desc.warning",
                    "Strong winds in the {{region}}. Secure loose items; caution for riders and high vehicles.",
                    { region: loc || "region" }
                  )
                : t(
                    "early.cards.wind.desc.safe",
                    "Winds are light to moderate."
                  );
            case "heat":
              return sev === "danger"
                ? t(
                    "early.cards.heat.desc.danger",
                    "Extreme heat in the {{region}}. Heat illness possible. Stay in shade/AC; check the vulnerable.",
                    { region: loc || "region" }
                  )
                : sev === "warning"
                ? t(
                    "early.cards.heat.desc.warning",
                    "High heat in the {{region}}. Reduce strenuous activity; drink water often.",
                    { region: loc || "region" }
                  )
                : t(
                    "early.cards.heat.desc.safe",
                    "Heat risk is low. Keep hydrated."
                  );
            default:
              return "";
          }
        };

        const ui = hazards.map((h) => ({
          id: h.kind,
          title: titleFor(h.kind),
          level: severityBadge[h.severity || "safe"],
          color: severityColor[h.severity || "safe"],
          img: images[h.kind],
          desc: descFor(h),
          hazard: h,
        }));

        setCards(ui);
        setCurrentIndex(0);
      } catch {
        setCards([]); // could also keep old cards
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ===== Top Carousel ===== */}
      <View style={styles.hero}>
        <FlatList
          ref={carouselRef}
          data={cards}
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
        data={cards}
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
            onPress={() => {
              // Route to your per-topic page (reuse PreparednessGuide with IDs you already have)
              const mapId = {
                flood: "flood",
                haze: "haze",
                dengue: "dengue",
                wind: "wind",
                heat: "heat",
              };
              const guideId = mapId[item.id] || "flood";
              navigation.navigate("PreparednessGuide", {
                id: guideId,
                hazard: item.hazard,
              });
            }}
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
