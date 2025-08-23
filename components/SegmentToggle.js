// components/SegmentToggle.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";

export default function SegmentToggle({ options, value, onChange }) {
  const { theme } = useThemeContext();
  return (
    <View
      style={{
        borderRadius: 12,
        padding: 6,
        flexDirection: "row",
        gap: 6,
        backgroundColor: theme.key === "dark" ? "#2a2a2dff" : "#e0e1e4ff",
      }}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={{
              flex: 1,
              borderRadius: 10,
              paddingVertical: 8,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
              backgroundColor: active ? "#0A84FF" : "transparent",
            }}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.9}
          >
            <Text
              style={{
                fontWeight: "700",
                fontSize: 15,
                color: active ? "#fff" : "#6B7280",
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
