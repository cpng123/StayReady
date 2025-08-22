// screens/ChecklistScreen.js
import React, { useMemo, useState, useEffect } from "react";
import { SafeAreaView, View, FlatList, StyleSheet } from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";

import TopBar from "../components/TopBar";
import SearchRow from "../components/SearchRow";
import FilterChips from "../components/FilterChips";
import ChecklistSectionCard from "../components/ChecklistSectionCard";
import ConfirmModal from "../components/ConfirmModal";

import { CHECKLIST_FILTERS, getSectionsByFilter } from "../data/checklist";
import {
  loadChecklistDoneMap,
  saveChecklistDoneMap,
  clearChecklistDoneMap,
  applyDoneToSections,
} from "../utils/checklistStorage";

export default function ChecklistScreen({ navigation }) {
  const { theme } = useThemeContext();

  const [filter, setFilter] = useState(CHECKLIST_FILTERS[0].id);
  const [query, setQuery] = useState("");
  const [doneMap, setDoneMap] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => setDoneMap(await loadChecklistDoneMap()))();
  }, []);

  const rawSections = useMemo(() => getSectionsByFilter(filter), [filter]);
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

  // Open/close + confirm handlers for reset
  const openResetConfirm = () => setConfirmOpen(true);
  const closeResetConfirm = () => setConfirmOpen(false);
  const confirmResetAll = async () => {
    await clearChecklistDoneMap();
    setDoneMap({});
    setConfirmOpen(false);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.appBg }]}
    >
      <TopBar
        title="StayReady Checklist"
        onBack={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={openResetConfirm}
      />

      <SearchRow
        value={query}
        onChangeText={setQuery}
        placeholder="Search"
        showSort={false}
      />

      <FilterChips
        options={CHECKLIST_FILTERS}
        activeId={filter}
        onChange={setFilter}
      />

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
        title="Reset all checks?"
        message="This will uncheck every item in all tabs."
        cancelLabel="Cancel"
        confirmLabel="Reset"
        onCancel={closeResetConfirm}
        onConfirm={confirmResetAll}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
