import React, { useMemo, useState, useEffect, useCallback } from "react";
import { SafeAreaView, View, FlatList, StyleSheet } from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";

import TopBar from "../components/TopBar";
import SearchRow from "../components/SearchRow";
import FilterChips from "../components/FilterChips";
import ChecklistSectionCard from "../components/ChecklistSectionCard";
import ConfirmModal from "../components/ConfirmModal";

import { getChecklistFilters, getSectionsByFilter } from "../data/checklist";
import {
  loadChecklistDoneMap,
  saveChecklistDoneMap,
  clearChecklistDoneMap,
  applyDoneToSections,
} from "../utils/checklistStorage";

export default function ChecklistScreen({ navigation }) {
  const { theme } = useThemeContext();
  // Pull both namespaces
  const { t } = useTranslation(["common", "checklist"]);

  // Helper: data/checklist.js currently uses keys like "checklist.titles.X".
  // This wrapper auto-prefixes with "checklist:" if no namespace is present.
  const tChecklist = useCallback(
    (key, fallback) => {
      const k = key.includes(":") ? key : `checklist:${key}`;
      return t(k, { defaultValue: fallback });
    },
    [t]
  );

  // translated tabs
  const FILTERS = useMemo(() => getChecklistFilters(tChecklist), [tChecklist]);

  // keep a stable default id; fall back to first tab if needed
  const [filter, setFilter] = useState("safety");

  useEffect(() => {
    if (!FILTERS.find((f) => f.id === filter) && FILTERS[0]) {
      setFilter(FILTERS[0].id);
    }
  }, [FILTERS, filter]);

  const [query, setQuery] = useState("");
  const [doneMap, setDoneMap] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => setDoneMap(await loadChecklistDoneMap()))();
  }, []);

  const rawSections = useMemo(
    () => getSectionsByFilter(filter, tChecklist),
    [filter, tChecklist]
  );
  const sections = useMemo(
    () => applyDoneToSections(rawSections, doneMap),
    [rawSections, doneMap]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => (i.text || "").toLowerCase().includes(q)),
      }))
      .filter((s) => s.items.length > 0);
  }, [sections, query]);

  const onToggle = async (_sectionId, itemId) => {
    setDoneMap((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      saveChecklistDoneMap(next);
      return next;
    });
  };

  // reset handlers
  const openResetConfirm = () => setConfirmOpen(true);
  const closeResetConfirm = () => setConfirmOpen(false);
  const confirmResetAll = async () => {
    await clearChecklistDoneMap();
    setDoneMap({});
    setConfirmOpen(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.appBg }]}>
      <TopBar
        title={t("checklist:screen_title", "StayReady Checklist")}
        onBack={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={openResetConfirm}
      />

      <SearchRow
        value={query}
        onChangeText={setQuery}
        placeholder={t("common.search", { ns: "common" })}
        showSort={false}
      />

      <FilterChips options={FILTERS} activeId={filter} onChange={setFilter} />

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={visible}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <ChecklistSectionCard section={item} onToggle={onToggle} />
        )}
        showsVerticalScrollIndicator={false}
      />

      <ConfirmModal
        visible={confirmOpen}
        title={t("checklist:reset_title", "Reset all checks?")}
        message={t(
          "checklist:reset_message",
          "This will uncheck every item in all tabs."
        )}
        cancelLabel={t("common:cancel", "Cancel")}
        confirmLabel={t("checklist:reset_confirm", "Reset")}
        onCancel={closeResetConfirm}
        onConfirm={confirmResetAll}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
