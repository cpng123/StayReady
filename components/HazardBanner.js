// components/HazardBanner.js
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";

/**
 * Props:
 *  - hazard: { kind: 'none'|'flood'|..., title?, severity?, locationName? }
 *  - dateStr: string        // e.g. "Mon, 7 July 2025"
 *  - timeAgoStr: string     // e.g. "10 min ago"
 *  - locLabel: string|null  // e.g. "Clementi Park"
 *  - compact: boolean       // smaller icon/fonts (good for MapScreen bottom sheet)
 *  - style: ViewStyle       // optional wrapper style overrides
 */
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

  const isFlood = hazard?.kind === "flood";
  const bg = isFlood
    ? hazard?.severity === "high"
      ? "#DC2626"
      : "#F59E0B"
    : theme.colors.success;

  return (
    <View style={[styles.banner, { backgroundColor: bg }, style]}>
      <Ionicons
        name={isFlood ? "warning" : "shield-checkmark"}
        size={compact ? 22 : 38}
        color="#fff"
        style={{ marginRight: compact ? 8 : 10 }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {isFlood
            ? hazard?.title || t("home.warning.flash", "Flash Flood Warning")
            : t("home.hazard.none", "No Hazard Detected")}
        </Text>

        {isFlood ? (
          <>
            <View style={[styles.metaRow, { marginBottom: 2, marginTop: 2 }]}>
              <Ionicons name="calendar" size={14} color="#fff" />
              <Text style={[styles.meta, { marginLeft: 4 }]}>{dateStr}</Text>
              <Ionicons
                name="time-outline"
                size={14}
                color="#fff"
                style={{ marginLeft: 10 }}
              />
              <Text style={[styles.meta, { marginLeft: 4 }]}>{timeAgoStr}</Text>
            </View>
            {!!locLabel && (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color="#fff" />
                <Text style={[styles.meta, { marginLeft: 4 }]}>{locLabel}</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={[styles.meta, { marginTop: 2 }]}>
            {t("home.hazard.slogan")}
          </Text>
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
