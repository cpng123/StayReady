// screens/QuizPlayScreen.js
import React, { useMemo, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QUIZ from "../data/quiz.json";

import {
  normalizeQuestions,
  QUESTION_SECONDS,
  REVEAL_DELAY_MS,
  TOAST_THEME,
  computeXp,
  pickEncouragement,
  deriveRevealFlags,
} from "../utils/quizLogic";

const H_PADDING = 20;
const QUESTION_HEIGHT = 150;

export default function QuizPlayScreen({ navigation, route }) {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const categoryId = route?.params?.categoryId;
  const setId = route?.params?.setId;
  const setTitle = route?.params?.title ?? "Quiz";

  const questions = useMemo(
    () => normalizeQuestions(QUIZ, categoryId, setId),
    [categoryId, setId]
  );

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const total = questions.length;
  const current = questions[idx];

  const [timesUp, setTimesUp] = useState(false);
  const revealTimeoutRef = useRef(null);

  // --- NEW: readiness flag to prevent blue reveal on next question ---
  const readyRef = useRef(false);

  // Timer: numeric + smooth bar
  const [time, setTime] = useState(QUESTION_SECONDS);
  const timerRef = useRef(null);

  const [trackW, setTrackW] = useState(0);
  const barW = useRef(new Animated.Value(0)).current;

  const startBar = () => {
    if (trackW <= 0) return;
    barW.stopAnimation();
    barW.setValue(trackW);
    Animated.timing(barW, {
      toValue: 0,
      duration: QUESTION_SECONDS * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  const stopAllTimers = () => {
    clearInterval(timerRef.current);
    barW.stopAnimation();
  };

  useEffect(() => {
    // reset for each question
    readyRef.current = false; // ⬅️ block times-up effect during transition
    stopAllTimers();
    clearTimeout(revealTimeoutRef.current);

    setTime(QUESTION_SECONDS);
    setSelected(null);
    setLocked(false);
    setTimesUp(false);
    setToast(null);

    timerRef.current = setInterval(() => {
      setTime((t) => Math.max(0, t - 1));
    }, 1000);

    startBar();
    const readyTimeout = setTimeout(() => {
      readyRef.current = true; // ⬅️ allow times-up effect again
    }, 100);

    return () => {
      stopAllTimers();
      clearTimeout(revealTimeoutRef.current);
      clearTimeout(readyTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    startBar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackW]);

  // Toast animation
  const [toast, setToast] = useState(null);
  const toastY = useRef(new Animated.Value(60)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (payload) => {
    setToast(payload);
    toastY.setValue(120);
    toastOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(toastY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const hideToast = () => {
    Animated.parallel([
      Animated.timing(toastY, {
        toValue: 60,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  };

  const goNext = () => {
    setLocked(false);
    setSelected(null);
    setTimesUp(false);
    hideToast();

    if (idx + 1 < total) {
      setIdx((p) => p + 1);
    } else {
      navigation.replace?.("QuizResult", {
        score,
        correct: correctCount,
        total,
        title: setTitle,
      });
    }
  };

  // Time's up path — now gated by readyRef so it can't fire during transition
  useEffect(() => {
    if (!readyRef.current) return; // ⬅️ guard
    if (time === 0 && !locked) {
      setLocked(true);
      setTimesUp(true);
      stopAllTimers();
      showToast({ type: "timesup", text: "Time's up!" });
      revealTimeoutRef.current = setTimeout(goNext, REVEAL_DELAY_MS);
    }
  }, [time, locked]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (i) => {
    if (locked || timesUp) return;
    setSelected(i);
    setLocked(true);
    stopAllTimers();

    const isCorrect = i === current.answerIndex;
    if (isCorrect) {
      const xp = computeXp(time, QUESTION_SECONDS);
      setScore((s0) => s0 + xp);
      setCorrectCount((c) => c + 1);
      showToast({ type: "correct", text: `+ ${xp} XP` });
    } else {
      showToast({ type: "incorrect", text: pickEncouragement() });
    }

    clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = setTimeout(goNext, REVEAL_DELAY_MS);
  };

  const progressText = `${idx + 1}/${total}`;

  // Hint modal
  const [hintOpen, setHintOpen] = useState(false);

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

      {/* Meta pill */}
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

      {/* Content */}
      <View style={s.content}>
        {/* Question */}
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
            onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
          >
            <Animated.View
              style={[
                s.timeFill,
                { backgroundColor: theme.colors.primary, width: barW },
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
            const { showGreen, showRed, showBlue } = deriveRevealFlags(
              i,
              current.answerIndex,
              selected,
              locked,
              timesUp && readyRef.current
            );

            const borderColor = showGreen
              ? "#16A34A"
              : showRed
              ? "#DC2626"
              : showBlue
              ? theme.colors.primary
              : "transparent";

            const textColor = showGreen
              ? "#16A34A"
              : showRed
              ? "#DC2626"
              : showBlue
              ? theme.colors.primary
              : theme.colors.text;

            return (
              <TouchableOpacity
                key={i}
                activeOpacity={locked || timesUp ? 1 : 0.9}
                onPress={() => choose(i)}
                style={[s.option, { borderColor }]}
              >
                <Text style={[s.optText, { color: textColor }]}>{opt}</Text>

                <View style={s.rightSlot}>
                  {showGreen && (
                    <View
                      style={[s.resultBadge, { backgroundColor: "#16A34A" }]}
                    >
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    </View>
                  )}
                  {showRed && (
                    <View
                      style={[s.resultBadge, { backgroundColor: "#DC2626" }]}
                    >
                      <Ionicons name="close" size={13} color="#fff" />
                    </View>
                  )}
                  {/* no badge for time's up */}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </View>

      {/* Hint button */}
      <View
        style={[
          s.hintWrap,
          { left: H_PADDING, right: H_PADDING, bottom: 12 + insets.bottom },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={[s.hintBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => setHintOpen(true)}
        >
          <Text style={s.hintText}>Hint</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Toast */}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            s.toastOverlay,
            {
              transform: [{ translateY: toastY }],
              opacity: toastOpacity,
              paddingBottom: 8 + insets.bottom,
            },
          ]}
        >
          {(() => {
            const t = TOAST_THEME[toast.type] || TOAST_THEME.correct;
            return (
              <View style={[s.toastCard, { backgroundColor: t.bg }]}>
                <Text style={s.toastTitle}>{t.title}</Text>
                <View style={s.toastPill}>
                  <Text style={[s.toastPillText, { color: t.pillText }]}>
                    {toast.text}
                  </Text>
                </View>
              </View>
            );
          })()}
        </Animated.View>
      )}

      {/* Hint Modal */}
      <Modal
        visible={hintOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHintOpen(false)}
      >
        <View style={s.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setHintOpen(false)}
          />
        </View>
        <View style={s.modalCenter} pointerEvents="box-none">
          <View style={[s.modalCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[s.modalTitle, { color: theme.colors.text }]}>
              Hint
            </Text>
            <Text style={[s.modalBody, { color: theme.colors.subtext }]}>
              {current?.hint?.trim() || "No hint available for this question."}
            </Text>
            <TouchableOpacity
              onPress={() => setHintOpen(false)}
              style={[s.modalBtn, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.9}
            >
              <Text style={s.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
      backgroundColor: theme.colors.card,
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
    timeFill: { height: "100%", borderRadius: 8 },
    timeVal: { width: 26, textAlign: "right", fontSize: 12, fontWeight: "800" },

    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 2,
      borderWidth: 2,
      backgroundColor: theme.key === "dark" ? "#111418" : theme.colors.card,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    optText: { fontSize: 15, fontWeight: "500", flexShrink: 1 },

    rightSlot: { width: 28, alignItems: "flex-end", justifyContent: "center" },
    resultBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
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

    // Toast
    toastOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "stretch",
    },
    toastCard: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingVertical: 16,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
      elevation: 4,
    },
    toastTitle: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 8,
      textAlign: "center",
    },
    toastPill: {
      alignSelf: "center",
      backgroundColor: "#fff",
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
    },
    toastPillText: { color: "#1F2937", fontWeight: "800", fontSize: 14 },

    // Hint modal
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    modalCenter: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 380,
      borderRadius: 16,
      padding: 18,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 6,
      textAlign: "center",
    },
    modalBody: { fontSize: 15, textAlign: "center", marginBottom: 14 },
    modalBtn: { borderRadius: 12, paddingVertical: 10, alignItems: "center" },
    modalBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  });
