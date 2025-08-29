/**
 * BookmarkScreen
 * ------------------------------------------------------------
 *   - Displays the user's bookmarked quiz questions.
 *   - Provides search + category chips to filter results.
 *   - Allows deleting a single bookmark with a confirmation modal.
 */

import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, FlatList, View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import TopBar from "../components/TopBar";
import SearchRow from "../components/SearchRow";
import FilterChips from "../components/FilterChips";
import ReviewQuestionCard from "../components/ReviewQuestionCard";
import ConfirmModal from "../components/ConfirmModal";
import {
  getAllBookmarks,
  removeBookmark,
  subscribeBookmarks,
} from "../utils/bookmarks";
import { useTranslation } from "react-i18next";

const RED = "#DC2626";

export default function BookmarkScreen() {
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation("common");

  // -------- Filters & inputs --------
  // Build localized chip options (fallbacks provided)
  const CHIP_OPTIONS = useMemo(
    () => [
      { id: "all", label: t("bookmarks.chips.all", "All") },
      { id: "flood", label: t("bookmarks.chips.flood", "Flood") },
      { id: "haze", label: t("bookmarks.chips.haze", "Haze") },
      { id: "storm", label: t("bookmarks.chips.storm", "Thunderstorm") },
      { id: "dengue", label: t("bookmarks.chips.dengue", "Dengue") },
      { id: "wind", label: t("bookmarks.chips.wind", "Wind") },
      { id: "aid", label: t("bookmarks.chips.aid", "First Aid") },
      { id: "fire", label: t("bookmarks.chips.fire", "Fire") },
      { id: "kit", label: t("bookmarks.chips.kit", "Emergency Kit") },
      { id: "disease", label: t("bookmarks.chips.disease", "Disease") },
      {
        id: "earthquake",
        label: t("bookmarks.chips.earthquake", "Earthquake"),
      },
    ],
    [t]
  );

  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("all");

  // -------- Data state --------
  // The full list of bookmarks
  const [items, setItems] = useState([]);

  // Delete confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState(null);

  // Load current bookmarks
  const load = async () => setItems(await getAllBookmarks());

  // Initial load + keep list live via subscription
  useEffect(() => {
    load();
    const unsub = subscribeBookmarks(load);
    return unsub;
  }, []);

  // Derived: filtered & searched bookmarks
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => (chip === "all" ? true : it.categoryId === chip))
      .filter((it) =>
        q
          ? (it.text || "").toLowerCase().includes(q) ||
            (it.setTitle || "").toLowerCase().includes(q)
          : true
      );
  }, [items, chip, query]);

  // Whether there are any bookmarks at all (affects empty copy)
  const hasAny = items.length > 0;

  // -------- Delete flow --------
  const requestDelete = (id) => {
    setPendingId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (pendingId) await removeBookmark(pendingId);
    setConfirmOpen(false);
    setPendingId(null);
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingId(null);
  };

  // -------- Empty state --------
  const EmptyState = () => (
    <View style={s.emptyWrap}>
      <Ionicons
        name="bookmark-outline"
        size={48}
        color={theme.colors.subtext}
      />
      <Text style={[s.emptyTitle, { color: theme.colors.text }]}>
        {hasAny
          ? t("bookmarks.empty.no_matches_title", "No matches here")
          : t("bookmarks.empty.none_title", "No bookmarked questions")}
      </Text>
      <Text style={[s.emptyBody, { color: theme.colors.subtext }]}>
        {hasAny
          ? t(
              "bookmarks.empty.no_matches_body",
              "Try a different category or clear your search."
            )
          : t(
              "bookmarks.empty.none_body",
              "Tap the bookmark icon on any question to save it here."
            )}
      </Text>
    </View>
  );

  // -------- Render --------
  return (
    <SafeAreaView style={s.safe}>
      <TopBar
        title={t("bookmarks.title", "Bookmarked Questions")}
        onBack={() => navigation.goBack()}
      />

      {/* Search + category chips */}
      <SearchRow value={query} onChangeText={setQuery} showSort={false} />
      <FilterChips options={CHIP_OPTIONS} activeId={chip} onChange={setChip} />

      {/* Bookmarks list */}
      <FlatList
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          flexGrow: 1,
        }}
        data={filtered}
        keyExtractor={(it) => it.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item, index }) => (
          <ReviewQuestionCard
            index={index}
            total={filtered.length}
            text={item.text}
            options={item.options}
            answerIndex={item.answerIndex}
            selectedIndex={item.selectedIndex}
            timesUp={item.timesUp}
            actionIcon="trash-outline"
            actionIconColor={RED}
            onActionPress={() => requestDelete(item.id)}
            style={{ backgroundColor: theme.colors.card }}
          />
        )}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        visible={confirmOpen}
        title={t("bookmarks.confirm.title", "Delete bookmark?")}
        message={t(
          "bookmarks.confirm.message",
          "This question will be removed from your bookmarks."
        )}
        confirmLabel={t("bookmarks.confirm.delete", "Delete")}
        cancelLabel={t("bookmarks.confirm.cancel", "Cancel")}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.appBg },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      marginTop: 10,
      marginBottom: 6,
      textAlign: "center",
    },
    emptyBody: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
      lineHeight: 20,
    },
  });
