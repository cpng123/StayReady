import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";

export default function ThemeToggle({ containerStyle }) {
  const { theme, themeKey, setThemeKey } = useThemeContext();

  const setTheme = async (key) => {
    if (key === themeKey) return;
    setThemeKey(key);
    try {
      await AsyncStorage.setItem("pref:themeKey", key);
    } catch {}
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: themeKey === "dark" ? "#2a2a2dff" : "#F3F4F6",
        },
        containerStyle,
      ]}
    >
      <TouchableOpacity
        style={[styles.btn, themeKey === "light" && styles.active]}
        onPress={() => setTheme("light")}
        activeOpacity={0.8}
      >
        <Ionicons
          name="sunny"
          size={20}
          color={themeKey === "light" ? "#fff" : "#6B7280"}
        />
        <Text
          style={[
            styles.text,
            { color: themeKey === "light" ? "#fff" : "#6B7280" },
          ]}
        >
          Light
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, themeKey === "dark" && styles.active]}
        onPress={() => setTheme("dark")}
        activeOpacity={0.8}
      >
        <Ionicons
          name="moon"
          size={20}
          color={themeKey === "dark" ? "#fff" : "#6B7280"}
        />
        <Text
          style={[
            styles.text,
            { color: themeKey === "dark" ? "#fff" : "#6B7280" },
          ]}
        >
          Dark
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    padding: 6,
    flexDirection: "row",
    gap: 6,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  active: { backgroundColor: "#0A84FF" },
  text: { fontWeight: "700", fontSize: 15 },
});
