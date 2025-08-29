/**
 * ExternalResourceScreen
 * -----------------------------------------------------------------------------
 *   Browse external links (articles, PDFs, official pages) curated per
 *   Preparedness Guide. Users can:
 *     - Search by title/description
 *     - Filter by topic (guide)
 *     - Sort (by Updated date desc/asc, then by Title A→Z/Z→A)
 */

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

// Build localized filter options.
function useFilters() {
  const { t } = useTranslation();
  return [
    {
      id: "all",
      label: t("filters.all", { ns: "common", defaultValue: "All" }),
    },
    { id: "flood", label: t("home.prep.topic.flood", { ns: "common" }) },
    { id: "haze", label: t("home.prep.topic.haze", { ns: "common" }) },
    { id: "storm", label: t("home.prep.topic.storm", { ns: "common" }) },
    { id: "dengue", label: t("home.prep.topic.dengue", { ns: "common" }) },
    { id: "wind", label: t("home.prep.topic.wind", { ns: "common" }) },
    { id: "aid", label: t("home.prep.topic.aid", { ns: "common" }) },
    { id: "fire", label: t("home.prep.topic.fire", { ns: "common" }) },
    { id: "kit", label: t("home.prep.topic.kit", { ns: "common" }) },
    { id: "disease", label: t("home.prep.topic.disease", { ns: "common" }) },
    {
      id: "earthquake",
      label: t("home.prep.topic.earthquake", { ns: "common" }),
    },
    {
      id: "heatstroke",
      label: t("home.prep.topic.heatstroke", { ns: "common" }),
    },
  ];
}

export default function ExternalResourceScreen({ navigation }) {
  const { theme } = useThemeContext();
  const { t, i18n } = useTranslation();
  const FILTERS = useFilters();

  // Flatten + localize all resources.
  // - key: stable, unique per resource (guideId-resourceId)
  // - categoryId: used for chip-filtering (matches guide.id)
  // - updated: string for sorting (e.g., "2025-04-20" or "Apr 2025")
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
          // Localize strings for current language (with preparedness ns)
          title: t(`${guideId}.externalResources.${r.id}.title`, {
            ns: "preparedness",
          }),
          desc: t(`${guideId}.externalResources.${r.id}.desc`, {
            ns: "preparedness",
          }),
        });
      });
    });
    return out;
    // Re-run when language changes so titles/desc are refreshed
  }, [t, i18n.language]);

  // UI state
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortDesc, setSortDesc] = useState(true); // true = latest first

  // Derived list:
  //  - Filter by topic/category
  //  - Text search across localized title + desc
  //  - Sort by `updated` (desc/asc), with title as tiebreaker for consistency
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Filter + search
    let rows = allResources.filter((it) => {
      const inFilter =
        activeFilter === "all" ? true : it.categoryId === activeFilter;
      if (!inFilter) return false;
      if (!q) return true;
      const hay = `${it.title ?? ""} ${it.desc ?? ""}`.toLowerCase();
      return hay.includes(q);
    });

    // Sort: updated (if provided) then title
    rows.sort((a, b) => {
      const ua = a.updated || "";
      const ub = b.updated || "";
      if (ua && ub && ua !== ub) {
        // String compare is OK when format is ISO-ish; otherwise this becomes
        // a stable lexical ordering (better than nothing).
        return sortDesc ? ub.localeCompare(ua) : ua.localeCompare(ub);
      }
      // Tiebreaker by title
      return sortDesc
        ? (a.title || "").localeCompare(b.title || "")
        : (b.title || "").localeCompare(a.title || "");
    });

    return rows;
  }, [allResources, activeFilter, query, sortDesc]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.appBg }]}
    >
      {/* Title bar */}
      <TopBar
        title={t("preparedness_screen.external_resources", { ns: "common" })}
        onBack={() => navigation.goBack()}
      />

      {/* Search + Sort toggle */}
      <SearchRow
        value={query}
        onChangeText={setQuery}
        onSortToggle={() => setSortDesc((v) => !v)}
        placeholder={t("common.search", { ns: "common" })}
        showSort
      />

      {/* Category chips */}
      <FilterChips
        options={FILTERS}
        activeId={activeFilter}
        onChange={setActiveFilter}
      />

      {/* Results list */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={data}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <ExternalResourceCard item={item} theme={theme} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
