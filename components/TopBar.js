import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";

export default function TopBar({
  title,
  onBack,
  rightIcon = null,          // e.g. "refresh", "trash-outline"
  onRightPress = null,
}) {
  const { theme } = useThemeContext();

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={onBack} style={styles.leftBtn} activeOpacity={0.8}>
        <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
        {title}
      </Text>

      {rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={styles.rightBtn} activeOpacity={0.8}>
          <Ionicons name={rightIcon} size={22} color={theme.colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftBtn: { position: "absolute", left: 8, height: 36, width: 36, alignItems: "center", justifyContent: "center" },
  rightBtn: { position: "absolute", right: 8, height: 36, width: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", maxWidth: "70%", textAlign: "center" },
});
