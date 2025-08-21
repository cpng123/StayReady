import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { PREPAREDNESS_GUIDES } from "../data/preparednessGuides";
import ExternalResourceCard from "../components/ExternalResourceCard";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "flood", label: "Flood" },
  { id: "haze", label: "Haze" },
  { id: "storm", label: "Thunderstorm" },
  { id: "dengue", label: "Dengue" },
  { id: "wind", label: "Wind" },
  { id: "aid", label: "First Aid" },
  { id: "fire", label: "Fire" },
  { id: "kit", label: "Emergency Kit" },
  { id: "disease", label: "Disease" },
  { id: "earthquake", label: "Earthquake" },
];

export default function ExternalResourceScreen({ navigation }) {
  const { theme } = useThemeContext();

  // Flatten all external resources across guides
  const allResources = useMemo(() => {
    const out = [];
    Object.values(PREPAREDNESS_GUIDES).forEach((guide) => {
      (guide.externalResources ?? []).forEach((r) => {
        out.push({
          ...r,
          key: `${guide.id}-${r.id}`,
          categoryId: guide.id,
          categoryTitle: guide.title,
          updated: r.updated ?? "",
        });
      });
    });
    return out;
  }, []);

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortDesc, setSortDesc] = useState(true);

  // Search + filter + sort
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = allResources.filter((it) => {
      const inFilter =
        activeFilter === "all" ? true : it.categoryId === activeFilter;
      if (!inFilter) return false;
      if (!q) return true;
      const hay = `${it.title ?? ""} ${it.desc ?? ""}`.toLowerCase();
      return hay.includes(q);
    });

    rows.sort((a, b) => {
      const ua = a.updated || "";
      const ub = b.updated || "";
      if (ua && ub && ua !== ub) {
        return sortDesc ? ub.localeCompare(ua) : ua.localeCompare(ub);
      }
      return sortDesc
        ? (a.title || "").localeCompare(b.title || "")
        : (b.title || "").localeCompare(a.title || "");
    });

    return rows;
  }, [allResources, activeFilter, query, sortDesc]);

  const renderItem = ({ item }) => (
    <View>
      <ExternalResourceCard item={item} theme={theme} />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.appBg }]}
    >
      {/* Fixed Top Bar */}
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={30} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          External Resource
        </Text>
      </View>

      {/* Search + Sort */}
      <View
        style={[
          styles.searchRow,
          {
            backgroundColor: theme.key === "dark" ? "#101316" : "#F2F4F7",
            borderColor: theme.key === "dark" ? "#1F2937" : "#E5E7EB",
          },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={theme.key === "dark" ? "#9CA3AF" : "#6B7280"}
        />
        <TextInput
          placeholder="Search"
          placeholderTextColor={theme.key === "dark" ? "#9CA3AF" : "#6B7280"}
          style={[styles.searchInput, { color: theme.colors.text }]}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={() => setSortDesc((v) => !v)}
          activeOpacity={0.6}
          style={styles.sortIconBtn}
        >
          <Ionicons
            name="swap-vertical"
            size={20}
            color={theme.key === "dark" ? "#E5E7EB" : "#374151"}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const active = item.id === activeFilter;
            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(item.id)}
                activeOpacity={0.85}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: theme.colors.primary }
                    : {
                        backgroundColor:
                          theme.key === "dark" ? "#1F2937" : "#EAECEF",
                      },
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

      {/* Resource List */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={data}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  topbar: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  backBtn: {
    position: "absolute",
    left: 8,
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800" },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    paddingVertical: 5,
  },
  sortIconBtn: {
    marginLeft: 8,
    padding: 4,
  },

  filterRow: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: "700" },
});
