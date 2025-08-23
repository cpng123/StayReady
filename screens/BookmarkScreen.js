// screens/BookmarkScreen.js
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
import { getAllBookmarks, removeBookmark, subscribeBookmarks } from "../utils/bookmarks";

const CHIP_OPTIONS = [
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

const RED = "#DC2626";

export default function BookmarkScreen() {
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("all");
  const [items, setItems] = useState([]);

  // delete confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState(null);

  const load = async () => setItems(await getAllBookmarks());

  useEffect(() => {
    load();
    const unsub = subscribeBookmarks(load);
    return unsub;
  }, []);

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

  const hasAny = items.length > 0;

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

  const EmptyState = () => (
    <View style={s.emptyWrap}>
      <Ionicons name="bookmark-outline" size={48} color={theme.colors.subtext} />
      <Text style={[s.emptyTitle, { color: theme.colors.text }]}>
        {hasAny ? "No matches here" : "No bookmarked questions"}
      </Text>
      <Text style={[s.emptyBody, { color: theme.colors.subtext }]}>
        {hasAny
          ? "Try a different category or clear your search."
          : "Tap the bookmark icon on any question to save it here."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <TopBar title="Bookmarked Questions" onBack={() => navigation.goBack()} />
      <SearchRow value={query} onChangeText={setQuery} showSort={false} />
      <FilterChips options={CHIP_OPTIONS} activeId={chip} onChange={setChip} />

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 8, flexGrow: 1 }}
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
            // Trash icon — force red
            actionIcon="trash-outline"
            actionIconColor={RED}
            onActionPress={() => requestDelete(item.id)}
            style={{ backgroundColor: theme.colors.card }}
          />
        )}
      />

      <ConfirmModal
        visible={confirmOpen}
        title="Delete bookmark?"
        message="This question will be removed from your bookmarks."
        confirmLabel="Delete"
        cancelLabel="Cancel"
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
    emptyTitle: { fontSize: 18, fontWeight: "800", marginTop: 10, marginBottom: 6, textAlign: "center" },
    emptyBody: { fontSize: 14, fontWeight: "600", textAlign: "center", lineHeight: 20 },
  });
