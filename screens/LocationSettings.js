// screens/LocationSettings.js
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
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
import { getMockFloodEnabled, setMockFloodEnabled } from "../utils/mockFlags";


export default function LocationSettings() {
  const nav = useNavigation();
  const { theme } = useThemeContext();
  const [mockFlood, setMockFlood] = useState(false);
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [loc, setLoc] = useState(null);
  const [demoOn, setDemoOn] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [label, demo, notif] = await Promise.all([
        resolveLocationLabel(),
        getDemoLocationEnabled(),
      ]);
      setLoc(label);
      setDemoOn(demo);
    } catch (e) {
      setErr(e?.message || t("location.error_fetch", { ns: "common" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const v = await getMockFloodEnabled();
      if (alive) setMockFlood(v);
    })();
    return () => { alive = false; };
  }, []);

  const toggle = async (v) => {
    setMockFlood(v);
    await setMockFloodEnabled(v);
  };

  const onToggleDemo = async (v) => {
    setDemoOn(v);
    await setDemoLocationEnabled(v);
    load();
  };

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
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.colors.text }]}>
          {t("location.title", { ns: "common" })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Body */}
      <View style={s.body}>
        {/* Current Location */}
        <View style={[s.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[s.cardTitle, { color: theme.colors.text }]}>
            {t("location.current_position", { ns: "common" })}
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
                {t("location.fetching", { ns: "common" })}
              </Text>
            </View>
          ) : err ? (
            <Text style={[s.err, { color: "#DC2626" }]}>{err}</Text>
          ) : (
            <>
              <Row
                label={t("location.coordinates", { ns: "common" })}
                value={coordText}
                theme={theme}
              />
              <Row
                label={t("location.region", { ns: "common" })}
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
                  {t("location.demo_using", { ns: "common" })}
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
          >
            <Text style={s.btnText}>
              {t("location.refresh", { ns: "common" })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Testing */}
        <View style={[s.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[s.cardTitle, { color: theme.colors.text }]}>
            {t("location.testing", { ns: "common" })}
          </Text>
          <View style={s.rowBetween}>
            <Text style={[s.label, { color: theme.colors.text }]}>
              {t("location.demo_toggle_label", { ns: "common" })}
            </Text>
            <Switch value={demoOn} onValueChange={onToggleDemo} />
          </View>
          <Text style={[s.small, { color: theme.colors.subtext }]}>
            {t("location.demo_desc", { ns: "common" })}
          </Text>
        </View>

        {/* Mock Disaster: Flash Flood */}
        <View style={[s.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[s.cardTitle, { color: theme.colors.text }]}>
            {t("location.mock_disaster_title", { ns: "common", defaultValue: "Mock Disaster" })}
          </Text>

          <View style={s.rowBetween}>
            <Text style={[s.label, { color: theme.colors.text }]}>
              {t("location.mock_flood_label", { ns: "common", defaultValue: "Mock Flood (Demo)" })}
            </Text>
            <Switch value={mockFlood} onValueChange={toggle} />
          </View>

          <Text style={[s.small, { color: theme.colors.subtext, marginTop: 6 }]}>
            {t("location.mock_flood_desc", {
              ns: "common",
              defaultValue:
                "When ON, Home & Map will show a Flash Flood warning near your current/ demo location.",
            })}
          </Text>
        </View>

        {/* Note */}
        <Text style={[s.note, { color: theme.colors.subtext }]}>
          {t("location.onemap_note", { ns: "common" })}
        </Text>
      </View>
    </SafeAreaView>
  );
}

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
