import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function GamesScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Games</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800" },
});
