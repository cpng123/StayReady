/**
 * File: components/HazardBanner.js
 * Purpose: Show the current top hazard in a prominent, color-coded banner.
 *
 * Responsibilities:
 *  - Render a compact or regular banner with icon, title, and key metadata.
 *  - Localize titles via i18n keys by hazard kind + severity.
 *  - Fall back gracefully to supplied hazard.title and “no hazard” state.
 *  - Respect the app theme for shadows/shape; use semantic colors for severity.
 *
 * Props:
 *  - hazard: { kind: 'none'|'flood'|'haze'|'dengue'|'wind'|'heat', title?, severity?, locationName? }
 *  - dateStr: human date string (e.g., "Mon, 7 July 2025")
 *  - timeAgoStr: relative time string (e.g., "10 min ago")
 *  - locLabel: explicit location label override (else uses hazard.locationName)
 *  - compact: boolean to reduce paddings/icon/text size
 *  - style: optional ViewStyle overrides for the banner container
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";

const TITLE_KEYS = {
  flood: { danger: "home.warning.flood.danger.title", warning: "home.warning.flood.warning.title" },
  haze:  { danger: "home.warning.haze.danger.title",  warning: "home.warning.haze.warning.title" },
  dengue:{ danger: "home.warning.dengue.danger.title",warning: "home.warning.dengue.warning.title" },
  wind:  { danger: "home.warning.wind.danger.title",  warning: "home.warning.wind.warning.title" },
  heat:  { danger: "home.warning.heat.danger.title",  warning: "home.warning.heat.warning.title" },
};

export default function HazardBanner({
  hazard = { kind: "none" },
  dateStr,
  timeAgoStr,
  locLabel,
  compact = false,
  style,
}) {
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme, compact), [theme, compact]);

  // Normalize kind/severity and compute “safe/none” state
  const kind = String(hazard?.kind || "none");
  const sev = String(hazard?.severity || "safe");
  const isNone = kind === "none" || sev === "safe";

  // Severity color and icon
  const bg = isNone ? theme.colors.success : sev === "danger" ? "#DC2626" : "#F59E0B";
  const iconName = isNone ? "shield-checkmark" : "warning";

  // Localized title lookup with sensible fallbacks
  const titleKey = TITLE_KEYS[kind]?.[sev];
  const title = isNone
    ? t("home.hazard.none", "No Hazards Detected")
    : titleKey
    ? t(titleKey)
    : hazard?.title || t("home.hazard.none", "No Hazards Detected");

  // Prefer explicit locLabel prop, else hazard-provided
  const finalLoc = locLabel ?? hazard?.locationName ?? null;

  return (
    <View style={[styles.banner, { backgroundColor: bg }, style]}>
      <Ionicons
        name={iconName}
        size={compact ? 22 : 38}
        color="#fff"
        style={{ marginRight: compact ? 8 : 10 }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>

        {!isNone ? (
          <>
            {/* Date + “time ago” row */}
            <View style={[styles.metaRow, { marginBottom: 2, marginTop: 2 }]}>
              <Ionicons name="calendar" size={14} color="#fff" />
              <Text style={[styles.meta, { marginLeft: 4 }]}>{dateStr}</Text>
              <Ionicons name="time-outline" size={14} color="#fff" style={{ marginLeft: 10 }} />
              <Text style={[styles.meta, { marginLeft: 4 }]}>{timeAgoStr}</Text>
            </View>

            {/* Location row (optional) */}
            {!!finalLoc && (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color="#fff" />
                <Text style={[styles.meta, { marginLeft: 4 }]}>{finalLoc}</Text>
              </View>
            )}
          </>
        ) : (
          // Friendly baseline message for the safe state
          <Text style={[styles.meta, { marginTop: 2 }]}>{t("home.hazard.slogan")}</Text>
        )}
      </View>
    </View>
  );
}

const makeStyles = (theme, compact) =>
  StyleSheet.create({
    banner: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: compact ? 8 : 12,
      paddingHorizontal: compact ? 8 : 14,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 2,
    },
    title: {
      color: "#fff",
      fontWeight: "800",
      fontSize: compact ? 14 : 15,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
    },
    meta: { color: "#fff", fontSize: 12 },
  });
