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
import { useTranslation } from "react-i18next";

// filter ids must match your guide IDs
function useFilters() {
  const { t } = useTranslation();
  return [
    { id: "all", label: t("filters.all", { ns: "common", defaultValue: "All" }) },
    { id: "flood", label: t("home.prep.topic.flood", { ns: "common" }) },
    { id: "haze", label: t("home.prep.topic.haze", { ns: "common" }) },
    { id: "storm", label: t("home.prep.topic.storm", { ns: "common" }) },
    { id: "dengue", label: t("home.prep.topic.dengue", { ns: "common" }) },
    { id: "wind", label: t("home.prep.topic.wind", { ns: "common" }) },
    { id: "aid", label: t("home.prep.topic.aid", { ns: "common" }) },
    { id: "fire", label: t("home.prep.topic.fire", { ns: "common" }) },
    { id: "kit", label: t("home.prep.topic.kit", { ns: "common" }) },
    { id: "disease", label: t("home.prep.topic.disease", { ns: "common" }) },
    { id: "earthquake", label: t("home.prep.topic.earthquake", { ns: "common" }) },
    { id: "heatstroke", label: t("home.prep.topic.heatstroke", { ns: "common" }) },
  ];
}

export default function ExternalResourceScreen({ navigation }) {
  const { theme } = useThemeContext();
  const { t, i18n } = useTranslation();
  const FILTERS = useFilters();

  // Flatten all external resources across guides, localizing title/desc here
  const allResources = useMemo(() => {
    const out = [];
    Object.values(PREPAREDNESS_GUIDES).forEach((guide) => {
      const guideId = guide.id;
      (guide.externalResources ?? []).forEach((r) => {
        out.push({
          ...r,
          key: `${guideId}-${r.id}`,
          categoryId: guideId,
          updated: r.updated ?? "",
          // localize strings for current language
          title: t(`${guideId}.externalResources.${r.id}.title`, { ns: "preparedness" }),
          desc: t(`${guideId}.externalResources.${r.id}.desc`, { ns: "preparedness" }),
        });
      });
    });
    return out;
    // re-run when language changes
  }, [t, i18n.language]);

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
      <TopBar
        title={t("preparedness_screen.external_resources", { ns: "common" })}
        onBack={() => navigation.goBack()}
      />

      <SearchRow
        value={query}
        onChangeText={setQuery}
        onSortToggle={() => setSortDesc((v) => !v)}
        // use i18n placeholder
        placeholder={t("common.search", { ns: "common" })}
        showSort
      />

      <FilterChips options={FILTERS} activeId={activeFilter} onChange={setActiveFilter} />

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
