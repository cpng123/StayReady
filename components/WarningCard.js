import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";

/** Mirror the detail screen’s description builder */
function longDescFor(h, t) {
  if (!h) return "";
  const sev = h.severity || "safe";
  const m = h.metrics || {};
  const place = h.locationName || m.locality || t("settings.country_sg", "Singapore");
  const region = m.region || h.locationName || t("settings.country_sg", "Singapore");
  const km = m.km != null ? Number(m.km).toFixed(1) : undefined;
  const cases = m.cases != null ? m.cases : undefined;
  const hi = m.hi != null ? Number(m.hi).toFixed(1) : undefined;

  switch (h.kind) {
    case "flood":
      return sev === "danger"
        ? t("early.cards.flood.desc.danger",
            "Flash flooding around {{place}}. Do not drive through floodwater; avoid underpasses and basements.",
            { place })
        : sev === "warning"
        ? t("early.cards.flood.desc.warning",
            "Heavy showers near {{place}}. Ponding possible. Avoid low-lying roads and kerbside lanes.",
            { place })
        : t("early.cards.flood.desc.safe",
            "No significant rain detected. Drains and canals at normal levels.");
    case "haze":
      return sev === "danger"
        ? t("early.cards.haze.desc.danger",
            "Unhealthy PM2.5 in the {{region}}. Stay indoors; use purifier; wear N95 if going out.",
            { region })
        : sev === "warning"
        ? t("early.cards.haze.desc.warning",
            "Elevated PM2.5 in the {{region}}. Limit outdoor activity; consider a mask.",
            { region })
        : t("early.cards.haze.desc.safe",
            "Air quality is within normal range across Singapore.");
    case "dengue":
      return sev === "danger"
        ? t("early.cards.dengue.desc.danger",
            "High-risk cluster near {{place}} ({{cases}}+ cases). Avoid dawn/dusk bites; check home daily; see a doctor if fever persists.",
            { place, cases })
        : sev === "warning"
        ? t("early.cards.dengue.desc.warning",
            "Active cluster near {{place}} (~{{km}} km). Remove stagnant water; use repellent.",
            { place, km })
        : t("early.cards.dengue.desc.safe",
            "No active cluster within 5 km of your location.");
    case "wind":
      return sev === "danger"
        ? t("early.cards.wind.desc.danger",
            "Damaging winds in the {{region}}. Stay indoors; avoid coastal or open areas.",
            { region })
        : sev === "warning"
        ? t("early.cards.wind.desc.warning",
            "Strong winds in the {{region}}. Secure loose items; caution for riders and high vehicles.",
            { region })
        : t("early.cards.wind.desc.safe", "Winds are light to moderate.");
    case "heat":
      return sev === "danger"
        ? t("early.cards.heat.desc.danger",
            "Extreme heat in the {{region}} (HI ≈ {{hi}}°C). Stay in shade/AC; check the vulnerable.",
            { region, hi })
        : sev === "warning"
        ? t("early.cards.heat.desc.warning",
            "High heat in the {{region}} (HI ≈ {{hi}}°C). Reduce strenuous activity; drink water often.",
            { region, hi })
        : t("early.cards.heat.desc.safe", "Heat risk is low. Keep hydrated.");
    default:
      return t("home.hazard.slogan", "Stay Alert, Stay Safe");
  }
}

export default function WarningCard({
  item,
  width = 200,
  imageHeight = 120,
  style,
  onPress,
  showUpdated = false,
}) {
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Always prefer the hazard-specific detail description
  const descText =
    (item?.hazard && longDescFor(item.hazard, t)) ||
    item?.desc ||
    item?.subtitle ||
    item?.hazard?.summary ||
    "";

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.card, { width }, style]}
    >
      <Image source={item.img} style={[styles.img, { height: imageHeight }]} />
      {!!item.color && (
        <View style={[styles.badge, { backgroundColor: item.color }]}>
          <Text style={styles.badgeText}>{item.level}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        {!!descText && (
          <Text style={styles.desc} numberOfLines={3}>
            {descText}
          </Text>
        )}
        {showUpdated && item.updated ? (
          <Text style={styles.meta} numberOfLines={1}>
            Updated {item.updated}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: theme.key === "dark" ? 0.25 : 0.08,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 3,
    },
    img: { width: "100%" },
    badge: {
      position: "absolute",
      right: 10,
      top: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    badgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
    body: { padding: 12 },
    title: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.colors.text,
      marginBottom: 6,
    },
    desc: { color: theme.colors.subtext, fontSize: 12, lineHeight: 16 },
    meta: {
      marginTop: 8,
      color: theme.colors.subtext,
      fontSize: 11,
      textAlign: "right",
      opacity: 0.9,
    },
  });
