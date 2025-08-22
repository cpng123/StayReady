// screens/QuizPlayScreen.js
import React, { useMemo, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QUIZ from "../data/quiz.json";

const H_PADDING = 20;
const QUESTION_HEIGHT = 150;

export default function QuizPlayScreen({ navigation, route }) {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const categoryId = route?.params?.categoryId;
  const setId = route?.params?.setId;
  const setTitle = route?.params?.title ?? "Quiz";

  const { questions } = useMemo(() => {
    const cat = (QUIZ?.categories || []).find((c) => c.id === categoryId) ??
      (QUIZ?.categories || [])[0] ?? { title: "Quiz", sets: [] };

    const set = (cat.sets || []).find((x) => x.id === setId) ??
      (cat.sets || [])[0] ?? { questions: [] };

    const getFirst = (...vals) =>
      vals.find((v) => typeof v === "string" && v.trim().length) || "";

    const qnorm = (set.questions || []).map((q, idx) => {
      const options =
        q.options?.map((o) => (typeof o === "string" ? o : o?.text ?? "")) ??
        [];
      const text = getFirst(q.text, q.question, q.prompt, q.title, q.q);
      const answerIndex =
        typeof q.answerIndex === "number"
          ? q.answerIndex
          : typeof q.answer === "number"
          ? q.answer
          : typeof q.correct === "number"
          ? q.correct
          : 0;
      const hint = getFirst(q.hint, q.explanation, q.why, q.note);

      return {
        id: q.id ?? `q-${idx}`,
        text: text || `Question ${idx + 1}`,
        options,
        answerIndex,
        hint,
      };
    });

    return { questions: qnorm };
  }, [categoryId, setId]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);

  const total = questions.length;
  const current = questions[idx];

  const [time, setTime] = useState(20);
  const timerRef = useRef(null);
  useEffect(() => {
    clearInterval(timerRef.current);
    setTime(20);
    timerRef.current = setInterval(
      () => setTime((t) => Math.max(0, t - 1)),
      1000
    );
    return () => clearInterval(timerRef.current);
  }, [idx]);

  const choose = (i) => {
    if (locked) return;
    setSelected(i);
    setLocked(true);
    if (i === current.answerIndex) setScore((s0) => s0 + 100);
    setTimeout(() => {
      setLocked(false);
      setSelected(null);
      setIdx((p) => (p + 1 < total ? p + 1 : p));
    }, 700);
  };

  const progressText = `${idx + 1}/${total}`;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.appBg }]}>
      {/* Top bar */}
      <View style={s.topbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          style={s.navBtn}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.colors.text }]} numberOfLines={1}>
          {setTitle}
        </Text>
        <TouchableOpacity activeOpacity={0.8} style={s.navBtn}>
          <Ionicons
            name="bookmark-outline"
            size={22}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Meta pill (blue background; white text/divider/icons) */}
      <View style={[s.metaPill, { backgroundColor: theme.colors.primary }]}>
        <View style={s.metaCol}>
          <MaterialCommunityIcons
            name="comment-question"
            size={19}
            color="#fff"
          />
          <Text style={[s.metaText, { color: "#fff" }]}>{progressText}</Text>
        </View>
        <View
          style={[s.metaDivider, { backgroundColor: "rgba(255,255,255,0.5)" }]}
        />
        <View style={s.metaCol}>
          <MaterialCommunityIcons name="star-circle" size={19} color="#fff" />

          <Text style={[s.metaText, { color: "#fff" }]}>{score}</Text>
        </View>
      </View>

      {/* Content rail */}
      <View style={s.content}>
        {/* Question card (fixed height & centered) */}
        <View style={[s.qCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[s.qText, { color: theme.colors.text }]}>
            {current?.text}
          </Text>
        </View>

        {/* Timer */}
        <View style={s.timeRow}>
          <Text style={[s.timeLabel, { color: theme.colors.subtext }]}>
            Time
          </Text>
          <View
            style={[
              s.timeTrack,
              { backgroundColor: theme.key === "dark" ? "#1F2937" : "#E5E7EB" },
            ]}
          >
            <View
              style={[
                s.timeFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${(time / 20) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[s.timeVal, { color: theme.colors.subtext }]}>
            {time}
          </Text>
        </View>

        {/* Options */}
        <View style={{ gap: 10 }}>
          {current?.options?.map((opt, i) => {
            const isCorrect = locked && i === current.answerIndex;
            const isWrong =
              locked && i === selected && i !== current.answerIndex;
            const isSelected = selected === i;

            const baseBg = theme.key === "dark" ? "#111418" : theme.colors.card;

            const bg = isCorrect
              ? "rgba(22,163,74,0.14)"
              : isWrong
              ? "rgba(220,38,38,0.14)"
              : isSelected
              ? "rgba(29,78,216,0.12)"
              : baseBg;

            const border = isCorrect
              ? "#16A34A"
              : isWrong
              ? "#DC2626"
              : isSelected
              ? theme.colors.primary
              : "transparent";

            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.9}
                onPress={() => choose(i)}
                style={[s.option, { backgroundColor: bg, borderColor: border }]}
              >
                <Text style={[s.optText, { color: theme.colors.text }]}>
                  {opt}
                </Text>

                {isCorrect || isWrong ? (
                  <View
                    style={[
                      s.resultBadge,
                      { borderColor: isCorrect ? "#16A34A" : "#DC2626" },
                      {
                        backgroundColor: isCorrect
                          ? "rgba(22,163,74,0.12)"
                          : "rgba(220,38,38,0.12)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={isCorrect ? "checkmark" : "close"}
                      size={14}
                      color={isCorrect ? "#16A34A" : "#DC2626"}
                    />
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Spacer so Hint button doesn't cover options */}
        <View style={{ height: 90 }} />
      </View>

      {/* Hint button pinned to bottom (same width as content) */}
      <View
        style={[
          s.hintWrap,
          { left: H_PADDING, right: H_PADDING, bottom: 12 + insets.bottom },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={[s.hintBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={s.hintText}>Hint</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },

    topbar: {
      height: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    },
    navBtn: { width: 36, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 20, fontWeight: "800" },

    metaPill: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      paddingVertical: 7,
      paddingHorizontal: 16,
      marginBottom: 8,
      gap: 12,
      shadowColor: "#000",
      shadowOpacity: 0.07,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    metaCol: { flexDirection: "row", alignItems: "center", gap: 8 },
    metaText: { fontSize: 15, fontWeight: "700" },
    metaDivider: { width: 1.5, height: 16, borderRadius: 1 },
    metaIcon: { width: 18, height: 18, tintColor: "#fff" },

    content: { flex: 1, paddingHorizontal: H_PADDING, paddingTop: 6 },

    qCard: {
      height: QUESTION_HEIGHT,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    qText: {
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 22,
    },

    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
      marginBottom: 15,
    },
    timeLabel: { fontSize: 12, fontWeight: "800" },
    timeTrack: { flex: 1, height: 6, borderRadius: 8, overflow: "hidden" },
    timeFill: { height: "100%" },
    timeVal: { width: 26, textAlign: "right", fontSize: 12, fontWeight: "800" },

    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginBottom: 2,
      borderWidth: 2,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    optText: { fontSize: 15, fontWeight: "500" },

    resultBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },

    hintWrap: { position: "absolute" },
    hintBtn: {
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      marginBottom: 15,
    },
    hintText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  });
