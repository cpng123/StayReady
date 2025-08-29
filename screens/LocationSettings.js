/**
 * LocationSettings
 * -----------------------------------------------------------------------------
 *   Configure:
 *     * Current/Mocked location preview
 *     * Demo location toggle (uses mock coordinates)
 *     * Hazard mock toggles (flood/haze/dengue/wind/heat) for testing flows
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeContext } from "../theme/ThemeProvider";
import {
  resolveLocationLabel,
  getDemoLocationEnabled,
  setDemoLocationEnabled,
} from "../utils/locationService";
import { useTranslation } from "react-i18next";
import {
  getMockFlags,
  setMockFlag,
  setMockFloodEnabled,
} from "../utils/mockFlags";

export default function LocationSettings() {
  const nav = useNavigation();
  const { theme } = useThemeContext();

  // Per-hazard mock toggles (synced from persistent flags on mount)
  const [mockFlood, setMockFlood] = useState(false);
  const [mockHaze, setMockHaze] = useState(false);
  const [mockDengue, setMockDengue] = useState(false);
  const [mockWind, setMockWind] = useState(false);
  const [mockHeat, setMockHeat] = useState(false);

  const s = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation();

  // Location + demo state
  const [loading, setLoading] = useState(true);
  const [loc, setLoc] = useState(null);
  const [demoOn, setDemoOn] = useState(false);
  const [err, setErr] = useState("");

  // Load current location label + demo toggle
  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [label, demo] = await Promise.all([
        resolveLocationLabel(), // { coords, address?, postal?, region?, mocked? }
        getDemoLocationEnabled(),
      ]);
      setLoc(label);
      setDemoOn(demo);
    } catch (e) {
      setErr(
        e?.message ||
          t("location.error_fetch", {
            ns: "common",
            defaultValue: "Could not fetch your location.",
          })
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load of location info
  useEffect(() => {
    load();
  }, []);

  // Sync mock flags once on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const flags = await getMockFlags(); // { flood, haze, dengue, wind, heat }
        if (!alive) return;
        setMockFlood(!!flags.flood);
        setMockHaze(!!flags.haze);
        setMockDengue(!!flags.dengue);
        setMockWind(!!flags.wind);
        setMockHeat(!!flags.heat);
      } catch {
        // ignore; leave defaults
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Toggle handlers (persist + update local state)
  const toggleFlood = async (v) => {
    setMockFlood(v);
    await setMockFloodEnabled(v); // flood uses a dedicated helper
  };
  const toggleHaze = async (v) => {
    setMockHaze(v);
    await setMockFlag("haze", v);
  };
  const toggleDengue = async (v) => {
    setMockDengue(v);
    await setMockFlag("dengue", v);
  };
  const toggleWind = async (v) => {
    setMockWind(v);
    await setMockFlag("wind", v);
  };
  const toggleHeat = async (v) => {
    setMockHeat(v);
    await setMockFlag("heat", v);
  };

  // Demo location master toggle
  const onToggleDemo = async (v) => {
    setDemoOn(v);
    await setDemoLocationEnabled(v);
    load(); // refresh label (will reflect mocked flag)
  };

  // Coordinate preview (fixed precision)
  const coordText = loc
    ? `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`
    : "-";

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.appBg }]}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => nav.goBack()}
          style={s.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", { defaultValue: "Back" })}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.colors.text }]}>
          {t("location.title", {
            ns: "common",
            defaultValue: "Location & Testing",
          })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Body */}
      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Location */}
        <View style={[s.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[s.cardTitle, { color: theme.colors.text }]}>
            {t("location.current_position", {
              ns: "common",
              defaultValue: "Current Position",
            })}
          </Text>

          {loading ? (
            <View style={s.centerRow}>
              <ActivityIndicator />
              <Text
                style={[
                  s.small,
                  { color: theme.colors.subtext, marginLeft: 8 },
                ]}
              >
                {t("location.fetching", {
                  ns: "common",
                  defaultValue: "Fetching…",
                })}
              </Text>
            </View>
          ) : err ? (
            <Text style={[s.err, { color: "#DC2626" }]}>{err}</Text>
          ) : (
            <>
              <Row
                label={t("location.coordinates", {
                  ns: "common",
                  defaultValue: "Coordinates",
                })}
                value={coordText}
                theme={theme}
              />
              <Row
                label={t("location.region", {
                  ns: "common",
                  defaultValue: "Region",
                })}
                value={loc?.region || "-"}
                theme={theme}
              />

              {loc?.mocked && (
                <Text
                  style={[
                    s.small,
                    { color: theme.colors.subtext, marginTop: 8 },
                  ]}
                >
                  {t("location.demo_using", {
                    ns: "common",
                    defaultValue: "Using demo location (mocked).",
                  })}
                </Text>
              )}
            </>
          )}

          <TouchableOpacity
            style={[
              s.btn,
              { backgroundColor: theme.colors.primary, marginTop: 12 },
            ]}
            activeOpacity={0.9}
            onPress={load}
            accessibilityRole="button"
            accessibilityLabel={t("location.refresh", {
              ns: "common",
              defaultValue: "Refresh",
            })}
          >
            <Text style={s.btnText}>
              {t("location.refresh", { ns: "common", defaultValue: "Refresh" })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Testing */}
        <View style={[s.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[s.cardTitle, { color: theme.colors.text }]}>
            {t("location.testing", {
              ns: "common",
              defaultValue: "Demo & Testing",
            })}
          </Text>
          <View style={s.rowBetween}>
            <Text style={[s.label, { color: theme.colors.text }]}>
              {t("location.demo_toggle_label", {
                ns: "common",
                defaultValue: "Use Demo Location",
              })}
            </Text>
            <Switch value={demoOn} onValueChange={onToggleDemo} />
          </View>
          <Text style={[s.small, { color: theme.colors.subtext }]}>
            {t("location.demo_desc", {
              ns: "common",
              defaultValue:
                "When enabled, the app uses a mock location for previews and detections.",
            })}
          </Text>
        </View>

        {/* Mock Disaster */}
        <View
          style={[s.card, { backgroundColor: theme.colors.card }]}
          testID="mock-disasters-card"
        >
          <Text style={[s.cardTitle, { color: theme.colors.text }]}>
            {t("location.mock_disaster_title", {
              ns: "common",
              defaultValue: "Mock Disaster",
            })}
          </Text>
          <Text
            style={[
              s.small,
              { color: theme.colors.subtext, marginTop: 4, marginBottom: 8 },
            ]}
          >
            {t("location.mock_disclaimer", {
              ns: "common",
              defaultValue:
                "When any mock is ON, real detections are temporarily disabled until all mocks are turned OFF.",
            })}
          </Text>

          {/* Flood */}
          <View style={s.rowBetween}>
            <Text style={[s.label, { color: theme.colors.text }]}>
              {t("location.mock_flood_label", {
                ns: "common",
                defaultValue: "Mock Flood (Danger)",
              })}
            </Text>
            <Switch value={mockFlood} onValueChange={toggleFlood} />
          </View>
          <Text
            style={[s.small, { color: theme.colors.subtext, marginTop: 6 }]}
          >
            {t("location.mock_flood_desc", {
              ns: "common",
              defaultValue:
                "Simulates a Flash Flood (Danger) near your current/demo location.",
            })}
          </Text>

          {/* Haze */}
          <View style={[s.rowBetween, { marginTop: 14 }]}>
            <Text style={[s.label, { color: theme.colors.text }]}>
              {t("location.mock_haze_label", {
                ns: "common",
                defaultValue: "Mock Haze (Warning)",
              })}
            </Text>
            <Switch value={mockHaze} onValueChange={toggleHaze} />
          </View>
          <Text style={[s.small, { color: theme.colors.subtext }]}>
            {t("location.mock_haze_desc", {
              ns: "common",
              defaultValue: "Simulates Haze (Warning) over a region.",
            })}
          </Text>

          {/* Dengue */}
          <View style={[s.rowBetween, { marginTop: 14 }]}>
            <Text style={[s.label, { color: theme.colors.text }]}>
              {t("location.mock_dengue_label", {
                ns: "common",
                defaultValue: "Mock Dengue (Warning)",
              })}
            </Text>
            <Switch value={mockDengue} onValueChange={toggleDengue} />
          </View>
          <Text style={[s.small, { color: theme.colors.subtext }]}>
            {t("location.mock_dengue_desc", {
              ns: "common",
              defaultValue: "Simulates a nearby dengue cluster (within 5 km).",
            })}
          </Text>

          {/* Wind */}
          <View style={[s.rowBetween, { marginTop: 14 }]}>
            <Text style={[s.label, { color: theme.colors.text }]}>
              {t("location.mock_wind_label", {
                ns: "common",
                defaultValue: "Mock Wind (Warning)",
              })}
            </Text>
            <Switch value={mockWind} onValueChange={toggleWind} />
          </View>
          <Text style={[s.small, { color: theme.colors.subtext }]}>
            {t("location.mock_wind_desc", {
              ns: "common",
              defaultValue: "Simulates Strong Winds (Warning) over a region.",
            })}
          </Text>

          {/* Heat */}
          <View style={[s.rowBetween, { marginTop: 14 }]}>
            <Text style={[s.label, { color: theme.colors.text }]}>
              {t("location.mock_heat_label", {
                ns: "common",
                defaultValue: "Mock Heat (Danger)",
              })}
            </Text>
            <Switch value={mockHeat} onValueChange={toggleHeat} />
          </View>
          <Text style={[s.small, { color: theme.colors.subtext }]}>
            {t("location.mock_heat_desc", {
              ns: "common",
              defaultValue: "Simulates Heat (Danger) over a region.",
            })}
          </Text>
        </View>

        {/* Attribution note */}
        <Text style={[s.note, { color: theme.colors.subtext }]}>
          {t("location.onemap_note", {
            ns: "common",
            defaultValue:
              "Maps © OneMap/SLA. Hazard visuals are for demonstration when mocks are enabled.",
          })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Small 2-column row for key/value pairs */
function Row({ label, value, theme }) {
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.key, { color: theme.colors.subtext }]}>
        {label}
      </Text>
      <Text
        style={[rowStyles.val, { color: theme.colors.text }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

/* --------------------------- Styles (local) --------------------------- */

const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", marginTop: 8 },
  key: { width: 104, fontSize: 12, fontWeight: "800" },
  val: { flex: 1, fontSize: 14, fontWeight: "700" },
});

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    topBar: {
      height: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontSize: 18, fontWeight: "800" },
    body: { padding: 14, gap: 10 },

    card: {
      borderRadius: 14,
      padding: 14,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    cardTitle: { fontWeight: "900", fontSize: 16, marginBottom: 6 },
    centerRow: { flexDirection: "row", alignItems: "center" },

    btn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "900" },

    rowBetween: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    label: { fontWeight: "800" },
    small: { fontSize: 12, fontWeight: "700" },
    err: { fontWeight: "800" },

    note: { fontSize: 12, fontWeight: "700", marginTop: 6, lineHeight: 16 },
  });
