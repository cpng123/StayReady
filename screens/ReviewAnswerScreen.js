import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, FlatList, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useThemeContext } from "../theme/ThemeProvider";
import TopBar from "../components/TopBar";
import ReviewQuestionCard from "../components/ReviewQuestionCard";
import { isBookmarked, toggleBookmark, toBookmarkItem } from "../utils/bookmarks";

export default function ReviewAnswerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useThemeContext();
  const s = useMemo(() => ({ safe: { flex: 1, backgroundColor: theme.colors.appBg } }), [theme]);

  const { title = "Review Questions", review = [], meta = {} } = route.params || {};
  // meta can contain: { categoryId, categoryLabel, setId, setTitle }

  const [bmMap, setBmMap] = useState({}); // { [id]: true }

  useEffect(() => {
    (async () => {
      const entries = {};
      for (let i = 0; i < review.length; i++) {
        const q = review[i];
        const id = q.id ?? `${meta.setId ?? "set"}:${i}:${q.text?.slice(0,40)}`;
        entries[id] = await isBookmarked(id);
      }
      setBmMap(entries);
    })();
  }, [review, meta.setId]);

  const onToggle = async (q, index) => {
    const id = q.id ?? `${meta.setId ?? "set"}:${index}:${q.text?.slice(0,40)}`;
    const payload = toBookmarkItem({
      id,
      categoryId: meta.categoryId,
      categoryLabel: meta.categoryLabel ?? "All",
      setId: meta.setId,
      setTitle: meta.setTitle,
      question: q.text,
      options: q.options,
      answerIndex: q.answerIndex,
      selectedIndex: q.selectedIndex,
      timesUp: q.timesUp,
    });
    const active = await toggleBookmark(payload);
    setBmMap((m) => ({ ...m, [id]: active }));
  };

  return (
    <SafeAreaView style={s.safe}>
      <TopBar title={title} onBack={() => navigation.goBack()} />
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 8 }}
        data={review}
        keyExtractor={(_, i) => String(i)}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item, index }) => {
          const id = item.id ?? `${meta.setId ?? "set"}:${index}:${item.text?.slice(0,40)}`;
          const active = !!bmMap[id];
          return (
            <ReviewQuestionCard
              index={index}
              total={review.length}
              text={item.text}
              options={item.options}
              answerIndex={item.answerIndex}
              selectedIndex={item.selectedIndex}
              timesUp={item.timesUp}
              actionIcon="bookmark"
              actionActive={active}
              onActionPress={() => onToggle(item, index)}
              style={{ backgroundColor: theme.colors.card }}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}
