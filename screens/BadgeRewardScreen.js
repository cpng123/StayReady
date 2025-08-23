import React, { useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import TopBar from "../components/TopBar";
import { useThemeContext } from "../theme/ThemeProvider";
import { useNavigation } from "@react-navigation/native";

export default function BadgeRewardScreen() {
  const { theme } = useThemeContext();
  const navigation = useNavigation();
  const s = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.appBg },
    empty: { flex: 1, alignItems: "center", justifyContent: "center" },
    text: { color: theme.colors.subtext, fontWeight: "700" },
  }), [theme]);

  return (
    <SafeAreaView style={s.safe}>
      <TopBar title="Badge & Reward" onBack={() => navigation.goBack()} />
      <View style={s.empty}>
        <Text style={s.text}>Coming soon…</Text>
      </View>
    </SafeAreaView>
  );
}
