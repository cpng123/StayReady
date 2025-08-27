// screens/HazardDetailScreen.js
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";
import HazardBanner from "../components/HazardBanner";
import LeafletMapWebView from "../components/LeafletMapWebView";

// Card/header images for each hazard
const HERO_IMG = {
  flood:  require("../assets/General/flash-flood2.jpg"),
  haze:   require("../assets/General/pm-haze2.jpg"),
  dengue: require("../assets/General/dengue-cluster2.jpg"),
  wind:   require("../assets/General/strong-wind2.jpg"),
  heat:   require("../assets/General/heat.jpg"),
};

// Which MapScreen overlay to open for each hazard
const OVERLAY_FOR = {
  flood: "rain",
  haze: "pm",
  dengue: "dengue",
  wind: "wind",
  heat: "temp",
};

// Localized titles (reuse your i18n keys)
const titleFor = (kind, t) =>
  ({
    flood:  t("early.cards.flood.title",  "Flash Flood"),
    haze:   t("early.cards.haze.title",   "Haze (PM2.5)"),
    dengue: t("early.cards.dengue.title", "Dengue Clusters"),
    wind:   t("early.cards.wind.title",   "Strong Winds"),
    heat:   t("early.cards.heat.title",   "Heat Advisory"),
  }[kind] || t("home.hazard.alert", "Hazard Alert"));

// Full (long) descriptions for the detail page
const longDescFor = (h, t) => {
  const sev = h.severity || "safe";
  const m = h.metrics || {};
  const place  = h.locationName || m.locality || t("settings.country_sg","Singapore");
  const region = m.region || h.locationName || t("settings.country_sg","Singapore");
  const km     = m.km != null ? m.km.toFixed(1) : undefined;
  const cases  = m.cases != null ? m.cases : undefined;
  const hi     = m.hi != null ? m.hi.toFixed(1) : undefined;

  switch (h.kind) {
    case "flood":
      return sev === "danger"
        ? t("early.cards.flood.desc.danger",
            "Flash flooding around {{place}}. Do not drive through floodwater; avoid underpasses and basements.", { place })
        : sev === "warning"
        ? t("early.cards.flood.desc.warning",
            "Heavy showers near {{place}}. Ponding possible. Avoid low-lying roads and kerbside lanes.", { place })
        : t("early.cards.flood.desc.safe",
            "No significant rain detected. Drains and canals at normal levels.");
    case "haze":
      return sev === "danger"
        ? t("early.cards.haze.desc.danger",
            "Unhealthy PM2.5 in the {{region}}. Stay indoors; use purifier; wear N95 if going out.", { region })
        : sev === "warning"
        ? t("early.cards.haze.desc.warning",
            "Elevated PM2.5 in the {{region}}. Limit outdoor activity; consider a mask.", { region })
        : t("early.cards.haze.desc.safe",
            "Air quality is within normal range across Singapore.");
    case "dengue":
      return sev === "danger"
        ? t("early.cards.dengue.desc.danger",
            "High-risk cluster near {{place}} ({{cases}}+ cases). Avoid dawn/dusk bites; check home daily; see a doctor if fever persists.", { place, cases })
        : sev === "warning"
        ? t("early.cards.dengue.desc.warning",
            "Active cluster near {{place}} (~{{km}} km). Remove stagnant water; use repellent.", { place, km })
        : t("early.cards.dengue.desc.safe",
            "No active cluster within 5 km of your location.");
    case "wind":
      return sev === "danger"
        ? t("early.cards.wind.desc.danger",
            "Damaging winds in the {{region}}. Stay indoors; avoid coastal or open areas.", { region })
        : sev === "warning"
        ? t("early.cards.wind.desc.warning",
            "Strong winds in the {{region}}. Secure loose items; caution for riders and high vehicles.", { region })
        : t("early.cards.wind.desc.safe","Winds are light to moderate.");
    case "heat":
      return sev === "danger"
        ? t("early.cards.heat.desc.danger",
            "Extreme heat in the {{region}} (HI ≈ {{hi}}°C). Stay in shade/AC; check the vulnerable.", { region, hi })
        : sev === "warning"
        ? t("early.cards.heat.desc.warning",
            "High heat in the {{region}} (HI ≈ {{hi}}°C). Reduce strenuous activity; drink water often.", { region, hi })
        : t("early.cards.heat.desc.safe","Heat risk is low. Keep hydrated.");
    default:
      return t("home.hazard.slogan","Stay Alert, Stay Safe");
  }
};

export default function HazardDetailScreen({ navigation, route }) {
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Params from card tap
  const hazard = route?.params?.hazard || { kind: "none", severity: "safe" };
  const kind = hazard.kind;
  const title = titleFor(kind, t);

  // Current SG date/time strings for the banner
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-SG", {
    weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Singapore",
  });
  let timeStr = now.toLocaleTimeString("en-SG", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Singapore",
  }).replace(/am|pm/, (m) => m.toUpperCase());

  const locLabel = hazard.locationName || null;

  const overlayKey = OVERLAY_FOR[kind] || "rain";

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.appBg }]}>
      {/* Top hero image with back button */}
      <View style={styles.hero}>
        <Image source={HERO_IMG[kind]} style={styles.heroImg} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Title */}
        <Text style={styles.h1}>{title}</Text>

        {/* Hazard banner — uses the actual hazard object */}
        <HazardBanner
          hazard={hazard}
          dateStr={dateStr}
          timeAgoStr={timeStr}
          locLabel={locLabel}
          style={{ marginTop: 6, marginBottom: 12 }}
        />

        {/* Description */}
        <Text style={styles.sectionTitle}>{t("hazardDetail.description","Description")}</Text>
        <Text style={styles.p}>{longDescFor(hazard, t)}</Text>

        {/* Affected Area (mini map preview) */}
        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          {t("hazardDetail.affected_area","Affected Area")}
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("MapView", { overlay: overlayKey })
          }
          accessibilityRole="button"
          accessibilityLabel={t("hazardDetail.open_map","Open map")}
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
              {t("hazardDetail.view_on_map","View on Map")}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Safety tips section placeholder — wire later */}
        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          {t("hazardDetail.safety_tips","Safety Tips")}
        </Text>
        <Text style={styles.p}>{t("hazardDetail.tips_coming","Tips coming soon.")}</Text>
      </View>
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },
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
    body: { padding: 14 },
    h1: { fontSize: 20, fontWeight: "800", color: theme.colors.text },
    sectionTitle: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: "800",
      color: theme.colors.text,
    },
    p: { marginTop: 6, color: theme.colors.subtext, lineHeight: 20 },

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
  });
