// screens/SettingsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Switch } from "react-native";
import TopBar from "../components/TopBar";
import { useThemeContext } from "../theme/ThemeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, themeKey, setThemeKey } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("pref:sfxEnabled");
        if (raw != null) setSoundEnabled(raw === "1");
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem("pref:sfxEnabled", soundEnabled ? "1" : "0");
      } catch {}
    })();
  }, [soundEnabled]);

  const setTheme = async (k) => {
    setThemeKey(k);
    try { await AsyncStorage.setItem("pref:themeKey", k); } catch {}
  };

  return (
    <SafeAreaView style={s.safe}>
      <TopBar title="Settings" onBack={() => navigation.goBack()} />

      <View style={s.rowBetween}>
        <Text style={[s.label, { color: theme.colors.text }]}>Sound effects</Text>
        <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
      </View>

      <Text style={[s.section, { color: theme.colors.subtext }]}>Theme</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={s.pillWrap}>
          <Text
            onPress={() => setTheme("light")}
            style={[
              s.pill(theme, themeKey === "light"),
              { color: themeKey === "light" ? "#fff" : theme.colors.primary },
            ]}
          >
            Light
          </Text>
        </View>
        <View style={s.pillWrap}>
          <Text
            onPress={() => setTheme("dark")}
            style={[
              s.pill(theme, themeKey === "dark"),
              { color: themeKey === "dark" ? "#fff" : theme.colors.primary },
            ]}
          >
            Dark
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.appBg, paddingHorizontal: 16 },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
    },
    label: { fontSize: 16, fontWeight: "700" },
    section: { marginTop: 8, marginBottom: 8, fontWeight: "800" },
    pillWrap: { flex: 1 },
    pill: (t, active) => ({
      textAlign: "center",
      paddingVertical: 12,
      borderWidth: 1.5,
      borderRadius: 10,
      borderColor: t.colors.primary,
      backgroundColor: active ? t.colors.primary : "transparent",
      fontWeight: "800",
    }),
  });
