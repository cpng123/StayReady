// screens/QuizResultScreen.js
import React from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";

export default function QuizResultScreen({ navigation, route }) {
  const { theme } = useThemeContext();
  const { score = 0, correct = 0, total = 0, title = "Quiz" } = route?.params || {};

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.appBg }]}>
      <View style={styles.wrap}>
        <Text style={[styles.h1, { color: theme.colors.text }]}>Results</Text>
        <Text style={[styles.p, { color: theme.colors.subtext }]}>{title}</Text>

        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.line, { color: theme.colors.text }]}>Score: {score}</Text>
          <Text style={[styles.line, { color: theme.colors.text }]}>
            Correct: {correct} / {total}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.popToTop?.()}
          style={[styles.btn, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Back to Games</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { flex: 1, padding: 20, justifyContent: "center", alignItems: "center" },
  h1: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  p: { fontSize: 14, marginBottom: 16 },
  card: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  line: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  btn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18 },
  btnText: { color: "#fff", fontWeight: "800" },
});
