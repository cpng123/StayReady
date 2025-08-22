// components/FilterChips.js
import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";

export default function FilterChips({ options, activeId, onChange }) {
  const { theme } = useThemeContext();
  const dark = theme.key === "dark";

  return (
    <View style={{ marginBottom: 12 }}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={options}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => {
          const active = item.id === activeId;
          return (
            <TouchableOpacity
              onPress={() => onChange(item.id)}
              activeOpacity={0.85}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: theme.colors.primary }
                  : { backgroundColor: dark ? "#1F2937" : "#EAECEF" },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? "#fff" : theme.colors.text },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: "700" },
});
