/**
 * ChecklistScreen
 * ----------------------------------------------------------------------
 *   Display the preparedness checklist split across filter "tabs" with:
 *     - Full-text search
 *     - Per-item check/uncheck with persistence
 *     - Reset-all confirmation
 */

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
  // Pull both namespaces; we’ll mostly use "checklist"
  const { t } = useTranslation(["common", "checklist"]);

  // This wrapper ensures keys are looked up under the "checklist" namespace
  // when the caller omits an explicit namespace.
  const tChecklist = useCallback(
    (key, fallback) => {
      const k = key.includes(":") ? key : `checklist:${key}`;
      return t(k, { defaultValue: fallback });
    },
    [t]
  );

  /* ------------------------------ Filters/Tabs ----------------------------- */
  // Localized filters (e.g., Safety / Flood / Haze ...)
  const FILTERS = useMemo(() => getChecklistFilters(tChecklist), [tChecklist]);

  // Keep a stable default filter; ensure it exists after language updates
  const [filter, setFilter] = useState("safety");
  useEffect(() => {
    if (!FILTERS.find((f) => f.id === filter) && FILTERS[0]) {
      setFilter(FILTERS[0].id);
    }
  }, [FILTERS, filter]);

  /* --------------------------------- Search -------------------------------- */
  const [query, setQuery] = useState("");

  /* --------------------------- Checked-state map --------------------------- */
  // doneMap: { [itemId: string]: boolean }
  const [doneMap, setDoneMap] = useState({});
  useEffect(() => {
    (async () => setDoneMap(await loadChecklistDoneMap()))();
  }, []);

  /* -------------------------- Sections (data layer) ------------------------ */
  // Raw sections for the current filter (already localized)
  const rawSections = useMemo(
    () => getSectionsByFilter(filter, tChecklist),
    [filter, tChecklist]
  );
  // Sections with `done` merged in from persisted map
  const sections = useMemo(
    () => applyDoneToSections(rawSections, doneMap),
    [rawSections, doneMap]
  );

  // Search filter (case-insensitive on item.text)
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

  /* ----------------------------- Item toggling ----------------------------- */
  const onToggle = useCallback((_sectionId, itemId) => {
    setDoneMap((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      // Persist asynchronously; no need to await
      saveChecklistDoneMap(next);
      return next;
    });
  }, []);

  /* ------------------------------- Reset all ------------------------------- */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const openResetConfirm = useCallback(() => setConfirmOpen(true), []);
  const closeResetConfirm = useCallback(() => setConfirmOpen(false), []);
  const confirmResetAll = useCallback(async () => {
    await clearChecklistDoneMap();
    setDoneMap({});
    setConfirmOpen(false);
  }, []);

  /* --------------------------------- Render -------------------------------- */
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.appBg }]}
    >
      {/* Top bar with reset button (right) */}
      <TopBar
        title={t("checklist:screen_title", "StayReady Checklist")}
        onBack={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={openResetConfirm}
      />

      {/* Search field (local filter only) */}
      <SearchRow
        value={query}
        onChangeText={setQuery}
        placeholder={t("common:search", "Search")}
        showSort={false}
      />

      {/* Filter chips (tabs) */}
      <FilterChips options={FILTERS} activeId={filter} onChange={setFilter} />

      {/* Sections list */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={visible}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <ChecklistSectionCard section={item} onToggle={onToggle} />
        )}
        showsVerticalScrollIndicator={false}
        // Lightweight perf hints for mid-size lists:
        initialNumToRender={8}
        windowSize={8}
        removeClippedSubviews
      />

      {/* Reset confirmation modal */}
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
