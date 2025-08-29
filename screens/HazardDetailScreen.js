/**
 * HazardDetailScreen
 * -----------------------------------------------------------------------------
 *   Detailed view for a hazard card:
 *     - Themed hero image + back button
 *     - HazardBanner with localized title/severity/date/location
 *     - Long description tailored to severity
 *     - Mini Leaflet map preview with a CTA to open the full Map screen
 *     - “Safety Tips” grid (first section of the matching Preparedness Guide)
 */

import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";
import HazardBanner from "../components/HazardBanner";
import LeafletMapWebView from "../components/LeafletMapWebView";
import { getGuideById } from "../data/preparednessGuides";

// layout constants
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PADDING = 14; // matches body padding below
const GAP = 10;
const TILE_WIDTH = Math.floor((SCREEN_WIDTH - H_PADDING * 2 - GAP) / 2);

// Card/header images for each hazard
const HERO_IMG = {
  flood: require("../assets/General/flash-flood2.jpg"),
  haze: require("../assets/General/pm-haze2.jpg"),
  dengue: require("../assets/General/dengue-cluster2.jpg"),
  wind: require("../assets/General/strong-wind2.jpg"),
  heat: require("../assets/General/heat.jpg"),
};
// Generic fallback to keep <Image> safe even if kind is unexpected
const HERO_FALLBACK = HERO_IMG.flood;

// Which MapScreen overlay to open for each hazard
const OVERLAY_FOR = {
  flood: "rain",
  haze: "pm",
  dengue: "dengue",
  wind: "wind",
  heat: "temp",
};

// Map each hazard page to a Preparedness Guide ID for “See More”
const GUIDE_ID_FOR = {
  flood: "flood",
  haze: "haze",
  dengue: "dengue",
  wind: "wind",
  heat: "heatstroke", // ensure this matches your i18n & guide IDs
};

// Localized titles (reuse your i18n keys)
const titleFor = (kind, t) =>
  ({
    flood: t("early.cards.flood.title", "Flash Flood"),
    haze: t("early.cards.haze.title", "Haze (PM2.5)"),
    dengue: t("early.cards.dengue.title", "Dengue Clusters"),
    wind: t("early.cards.wind.title", "Strong Winds"),
    heat: t("early.cards.heat.title", "Heat Advisory"),
  }[kind] || t("home.hazard.alert", "Hazard Alert"));

// Full (long) descriptions for the detail page
const longDescFor = (h, t) => {
  const sev = h.severity || "safe";
  const m = h.metrics || {};
  const place =
    h.locationName || m.locality || t("settings.country_sg", "Singapore");
  const region =
    m.region || h.locationName || t("settings.country_sg", "Singapore");
  const km =
    m.km != null && !isNaN(Number(m.km)) ? Number(m.km).toFixed(1) : undefined;
  const cases = m.cases != null ? m.cases : undefined;
  const hi =
    m.hi != null && !isNaN(Number(m.hi)) ? Number(m.hi).toFixed(1) : undefined;

  switch (h.kind) {
    case "flood":
      return sev === "danger"
        ? t(
            "early.cards.flood.desc.danger",
            "Flash flooding around {{place}}. Do not drive through floodwater; avoid underpasses and basements.",
            { place }
          )
        : sev === "warning"
        ? t(
            "early.cards.flood.desc.warning",
            "Heavy showers near {{place}}. Ponding possible. Avoid low-lying roads and kerbside lanes.",
            { place }
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
            { region }
          )
        : sev === "warning"
        ? t(
            "early.cards.haze.desc.warning",
            "Elevated PM2.5 in the {{region}}. Limit outdoor activity; consider a mask.",
            { region }
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
            { place, cases }
          )
        : sev === "warning"
        ? t(
            "early.cards.dengue.desc.warning",
            "Active cluster near {{place}} (~{{km}} km). Remove stagnant water; use repellent.",
            { place, km }
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
            { region }
          )
        : sev === "warning"
        ? t(
            "early.cards.wind.desc.warning",
            "Strong winds in the {{region}}. Secure loose items; caution for riders and high vehicles.",
            { region }
          )
        : t("early.cards.wind.desc.safe", "Winds are light to moderate.");
    case "heat":
      return sev === "danger"
        ? t(
            "early.cards.heat.desc.danger",
            "Extreme heat in the {{region}} (HI ≈ {{hi}}°C). Stay in shade/AC; check the vulnerable.",
            { region, hi }
          )
        : sev === "warning"
        ? t(
            "early.cards.heat.desc.warning",
            "High heat in the {{region}} (HI ≈ {{hi}}°C). Reduce strenuous activity; drink water often.",
            { region, hi }
          )
        : t("early.cards.heat.desc.safe", "Heat risk is low. Keep hydrated.");
    default:
      return t("home.hazard.slogan", "Stay Alert, Stay Safe");
  }
};

// Safety Tips grid
//   - Pulls the first section from the corresponding Preparedness Guide
//   - Shows up to 4 tiles (2x2), localized via preparedness namespace
function SafetyTipsGrid({ hazardKind, navigation, theme, t, styles }) {
  const guideId = GUIDE_ID_FOR[hazardKind] || "flood";
  const guide = getGuideById(guideId);
  const firstSection = guide?.sections?.[0];
  if (!firstSection) return null;

  // Optional remap for guides whose first section ids differ from i18n keys
  const SECTION_KEY_MAP = {
    wind: {
      "wind-prep": "prepareBefore",
      "wind-during": "protectDuring",
      "wind-after": "recoverAfter",
    },
  };
  const normalizeKey = (gid, k) => SECTION_KEY_MAP[gid]?.[k] || k;

  const rawKey = firstSection.id || firstSection.key || "section";
  const sectionKey = normalizeKey(guideId, rawKey);

  const items = (firstSection.items || []).slice(0, 4);
  const lastRowStart = items.length - (items.length % 2 === 0 ? 2 : 1);

  return (
    <View style={{ paddingHorizontal: H_PADDING, paddingTop: 14 }}>
      <View style={styles.tipsHeaderRow}>
        <Text style={styles.sectionTitle}>
          {t("hazardDetail.safety_tips", "Safety Tips")}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate("PreparednessGuide", { id: guideId })
          }
          accessibilityRole="button"
          accessibilityLabel={t("common.see_more", "See More")}
        >
          <Text style={[styles.seeMore, { color: theme.colors.primary }]}>
            {t("common.see_more", "See More")}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i, idx) => String(i?.id ?? `tip_${idx}`)}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingTop: 8 }}
        renderItem={({ item, index }) => {
          const isLastRow = index >= lastRowStart;
          return (
            <View
              style={[
                styles.tileCard,
                {
                  width: TILE_WIDTH,
                  backgroundColor: theme.colors.card,
                  marginBottom: isLastRow ? 0 : GAP,
                },
              ]}
            >
              <Image source={item.img} style={styles.tileImg} />
              <Text style={[styles.tileCaption, { color: theme.colors.text }]}>
                {t(`${guideId}.sections.${sectionKey}.items.${item.id}`, {
                  ns: "preparedness",
                  defaultValue: item.text || "",
                })}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

export default function HazardDetailScreen({ navigation, route }) {
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Params from card tap (fallback ensures component always renders)
  const hazard = route?.params?.hazard || { kind: "none", severity: "safe" };
  const kind = hazard.kind;
  const title = titleFor(kind, t);

  // Current SG date/time strings for the banner
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Singapore",
  });
  const timeStr = now
    .toLocaleTimeString("en-SG", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Singapore",
    })
    .replace(/am|pm/, (m) => m.toUpperCase());

  const locLabel = hazard.locationName || null;
  const overlayKey = OVERLAY_FOR[kind] || "rain";
  const heroImgSrc = HERO_IMG[kind] || HERO_FALLBACK;

  // Everything above Safety Tips is the list header
  const ListHeader = (
    <>
      {/* Hero + back */}
      <View style={styles.hero}>
        <Image source={heroImgSrc} style={styles.heroImg} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", "Back")}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Body content */}
      <View style={styles.body}>
        <Text style={styles.h1}>{title}</Text>

        <HazardBanner
          hazard={hazard}
          dateStr={dateStr}
          timeAgoStr={timeStr}
          locLabel={locLabel}
          style={{ marginTop: 6, marginBottom: 12 }}
        />

        <Text style={styles.sectionTitle}>
          {t("hazardDetail.description", "Description")}
        </Text>
        <Text style={styles.p}>{longDescFor(hazard, t)}</Text>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          {t("hazardDetail.affected_area", "Affected Area")}
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("MapView", { overlay: overlayKey })
          }
          accessibilityRole="button"
          accessibilityLabel={t("hazardDetail.open_map", "Open map")}
          style={styles.mapCard}
        >
          <LeafletMapWebView
            height={170}
            zoom={12}
            interactive={false}
            showMarker
            showLegend={false}
            overlay={overlayKey}
            dark={theme.key === "dark"}
          />
          <View style={styles.mapOverlay}>
            <Ionicons name="map" size={16} color="#fff" />
            <Text style={styles.mapOverlayText}>
              {t("hazardDetail.view_on_map", "View on Map")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.appBg }]}
    >
      {/* One main FlatList: header above, then Safety Tips as the only item */}
      <FlatList
        data={[{ type: "tips" }]}
        keyExtractor={(i) => i.type}
        ListHeaderComponent={ListHeader}
        renderItem={() => (
          <SafetyTipsGrid
            hazardKind={kind}
            navigation={navigation}
            theme={theme}
            t={t}
            styles={styles}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },

    // Hero
    hero: { height: 180, backgroundColor: theme.colors.card },
    heroImg: { width: "100%", height: "100%", resizeMode: "cover" },
    backBtn: {
      position: "absolute",
      left: 12,
      top: 12,
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        theme.key === "dark" ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.35)",
    },

    // Body
    body: { padding: H_PADDING },
    h1: { fontSize: 20, fontWeight: "800", color: theme.colors.text },
    sectionTitle: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: "800",
      color: theme.colors.text,
    },
    p: { marginTop: 6, color: theme.colors.subtext, lineHeight: 20 },

    // Map preview card
    mapCard: {
      marginTop: 8,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.colors.card,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 8,
      elevation: 3,
    },
    mapOverlay: {
      position: "absolute",
      right: 10,
      top: 10,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.45)",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 6,
    },
    mapOverlayText: { color: "#fff", fontWeight: "800", fontSize: 12 },

    // Safety tips grid
    tipsHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    seeMore: { fontWeight: "700" },
    tileCard: {
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    tileImg: { width: "100%", height: 110, resizeMode: "cover" },
    tileCaption: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      fontSize: 13,
      lineHeight: 16,
      textAlign: "center",
    },
  });
