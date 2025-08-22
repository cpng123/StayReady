// screens/ExternalResourceScreen.js
import React, { useMemo, useState } from "react";
import { SafeAreaView, View, FlatList, StyleSheet } from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";
import { PREPAREDNESS_GUIDES } from "../data/preparednessGuides";
import ExternalResourceCard from "../components/ExternalResourceCard";

// Reusable UI
import TopBar from "../components/TopBar";
import SearchRow from "../components/SearchRow";
import FilterChips from "../components/FilterChips";

// IDs must match your guide IDs
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
      const inFilter = activeFilter === "all" ? true : it.categoryId === activeFilter;
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.appBg }]}>
      {/* Shared header block */}
      <TopBar title="External Resource" onBack={() => navigation.goBack()} />

      <SearchRow
        value={query}
        onChangeText={setQuery}
        onSortToggle={() => setSortDesc((v) => !v)}
        placeholder="Search"
        showSort
      />

      <FilterChips
        options={FILTERS}
        activeId={activeFilter}
        onChange={setActiveFilter}
      />

      {/* List */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={data}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <ExternalResourceCard item={item} theme={theme} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
