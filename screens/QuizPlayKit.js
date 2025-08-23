// screens/QuizPlayKit.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Pressable,
  Switch,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeContext } from "../theme/ThemeProvider";
import {
  QUESTION_SECONDS,
  REVEAL_DELAY_MS,
  TOAST_THEME,
  computeXp,
  pickEncouragement,
  deriveRevealFlags,
} from "../utils/quizLogic";
import ThemeToggle from "../components/ThemeToggle";

/* --------------------------- SOUND (SFX + BGM) --------------------------- */

export function useSound() {
  const bgRef = useRef(null);
  const sfxCorrectRef = useRef(null);
  const sfxWrongRef = useRef(null);
  const sfxTimesUpRef = useRef(null);

  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(true);

  // load persisted preference and sounds
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("pref:sfxEnabled");
        if (raw != null) {
          const val = raw === "1";
          setEnabled(val);
          enabledRef.current = val;
        }
      } catch {}
      try {
        const [bg, c, w, t] = await Promise.all([
          Audio.Sound.createAsync(
            require("../assets/Sound/background.mp3"),
            { isLooping: false, volume: 0.8 },
            null,
            false
          ),
          Audio.Sound.createAsync(require("../assets/Sound/correct.mp3")),
          Audio.Sound.createAsync(require("../assets/Sound/wrong.mp3")),
          Audio.Sound.createAsync(require("../assets/Sound/times-up.mp3")),
        ]);

        if (!mounted) {
          await bg.sound?.unloadAsync();
          await c.sound?.unloadAsync();
          await w.sound?.unloadAsync();
          await t.sound?.unloadAsync();
          return;
        }

        bgRef.current = bg.sound;
        sfxCorrectRef.current = c.sound;
        sfxWrongRef.current = w.sound;
        sfxTimesUpRef.current = t.sound;

        if (enabledRef.current) {
          try {
            await bgRef.current?.playAsync();
          } catch {}
        }
      } catch {}
    })();

    return () => {
      (async () => {
        try {
          await bgRef.current?.stopAsync();
        } catch {}
        try {
          await bgRef.current?.unloadAsync();
          await sfxCorrectRef.current?.unloadAsync();
          await sfxWrongRef.current?.unloadAsync();
          await sfxTimesUpRef.current?.unloadAsync();
        } catch {}
        bgRef.current = null;
        sfxCorrectRef.current = null;
        sfxWrongRef.current = null;
        sfxTimesUpRef.current = null;
      })();
    };
  }, []);

  // persist + live-react
  useEffect(() => {
    enabledRef.current = enabled;
    (async () => {
      try {
        await AsyncStorage.setItem("pref:sfxEnabled", enabled ? "1" : "0");
      } catch {}
      if (enabled) {
        try {
          await bgRef.current?.playAsync();
        } catch {}
      } else {
        try {
          await bgRef.current?.stopAsync();
        } catch {}
      }
    })();
  }, [enabled]);

  const play = async (type) => {
    try {
      if (!enabledRef.current) return;
      if (type === "correct") return sfxCorrectRef.current?.replayAsync();
      if (type === "incorrect") return sfxWrongRef.current?.replayAsync();
      if (type === "timesup") return sfxTimesUpRef.current?.replayAsync();
    } catch {}
  };

  const stopBg = async () => {
    try {
      await bgRef.current?.stopAsync();
    } catch {}
  };

  return { enabled, setEnabled, play, stopBg };
}

/* ------------------------------- HAPTICS ---------------------------------- */

export function useHaptics() {
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("pref:hapticsEnabled");
        if (raw != null) {
          const val = raw === "1";
          setEnabled(val);
          enabledRef.current = val;
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
    (async () => {
      try {
        await AsyncStorage.setItem("pref:hapticsEnabled", enabled ? "1" : "0");
      } catch {}
    })();
  }, [enabled]);

  const notify = async (kind) => {
    if (!enabledRef.current) return;
    try {
      if (kind === "success") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else if (kind === "error") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (kind === "warning") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
      }
    } catch {}
  };

  return { enabled, setEnabled, notify };
}

/* ------------------------------- BACK CONFIRM ------------------------------ */

export function useBackConfirm(navigation) {
  const leavingRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sub = navigation.addListener("beforeRemove", (e) => {
      if (leavingRef.current) return;
      e.preventDefault();
      setVisible(true);
    });
    return sub;
  }, [navigation]);

  const allowNext = () => {
    leavingRef.current = true;
  };
  const open = () => setVisible(true);
  const close = () => setVisible(false);
  const confirmExit = () => {
    setVisible(false);
    leavingRef.current = true;
    navigation.goBack();
  };

  return { visible, open, close, confirmExit, allowNext };
}

/* ------------------------------- QUIZ ENGINE ------------------------------- */

export function useQuizEngine({ questions = [], sfx, haptics, onFinish }) {
  const total = Array.isArray(questions) ? questions.length : 0;
  const [idx, setIdx] = useState(0);
  const current = questions[idx] || {};

  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);

  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // ✅ Keep refs in sync to avoid stale-closure bug
  const scoreRef = useRef(0);
  const correctRef = useRef(0);

  const [time, setTime] = useState(QUESTION_SECONDS);
  const timerRef = useRef(null);
  const quizStartRef = useRef(null);
  const [elapsedSec, setElapsedSec] = useState(0);

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
  const onTrackLayout = (e) => setTrackW(e.nativeEvent.layout.width);

  const stopAllTimers = () => {
    clearInterval(timerRef.current);
    barW.stopAnimation();
  };

  const [timesUp, setTimesUp] = useState(false);
  const readyRef = useRef(false);
  const revealTimeoutRef = useRef(null);

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

  const reviewRef = useRef([]);
  const recordResult = ({ selectedIndex, timesUp }) => {
    const q = current || {};
    reviewRef.current[idx] = {
      id: q.id ?? `q-${idx}`,
      text: q.text,
      options: q.options,
      answerIndex: q.answerIndex,
      selectedIndex:
        typeof selectedIndex === "number" ? selectedIndex : undefined,
      timesUp: !!timesUp,
    };
  };

  useEffect(() => {
    if (!quizStartRef.current) quizStartRef.current = Date.now();
  }, []);

  useEffect(() => {
    readyRef.current = false;
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
      readyRef.current = true;
    }, 100);

    return () => {
      stopAllTimers();
      clearTimeout(revealTimeoutRef.current);
      clearTimeout(readyTimeout);
    };
  }, [idx]);

  useEffect(() => {
    startBar();
  }, [trackW]);

  useEffect(() => {
    if (!readyRef.current) return;
    if (time === 0 && !locked) {
      setLocked(true);
      setTimesUp(true);
      recordResult({ selectedIndex: undefined, timesUp: true });
      stopAllTimers();
      sfx?.play?.("timesup");
      haptics?.notify?.("warning");
      showToast({ type: "timesup", text: "Time's up!" });
      revealTimeoutRef.current = setTimeout(goNext, REVEAL_DELAY_MS);
    }
  }, [time, locked]);

  const choose = (i) => {
    if (locked || timesUp) return;
    setSelected(i);
    setLocked(true);
    stopAllTimers();
    recordResult({ selectedIndex: i, timesUp: false });

    const isCorrect = i === current.answerIndex;
    if (isCorrect) {
      const xp = computeXp(time, QUESTION_SECONDS);

      // ✅ Update state AND refs in sync
      setScore((s0) => {
        const next = s0 + xp;
        scoreRef.current = next;
        return next;
      });
      setCorrectCount((c) => {
        const next = c + 1;
        correctRef.current = next;
        return next;
      });

      sfx?.play?.("correct");
      haptics?.notify?.("success");
      showToast({ type: "correct", text: `+ ${xp} XP` });
    } else {
      sfx?.play?.("incorrect");
      haptics?.notify?.("error");
      showToast({ type: "incorrect", text: pickEncouragement() });
    }

    clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = setTimeout(goNext, REVEAL_DELAY_MS);
  };

  const goNext = async () => {
    const consumed = Math.max(0, QUESTION_SECONDS - time);
    const totalSec2 = elapsedSec + consumed;
    setElapsedSec(totalSec2);

    setLocked(false);
    setSelected(null);
    setTimesUp(false);
    hideToast();

    if (idx + 1 < total) {
      setIdx((p) => p + 1);
    } else {
      const timeTakenSec = Math.max(
        0,
        Math.round((Date.now() - (quizStartRef.current || Date.now())) / 1000)
      );
      await sfx?.stopBg?.();

      // ✅ Use refs to avoid stale values
      const finalCorrect = correctRef.current;
      const finalScore = scoreRef.current;

      onFinish?.({
        score: finalScore,
        correctCount: finalCorrect,
        total,
        review: reviewRef.current.slice(),
        timeTakenSec,
      });
    }
  };

  const flagsFor = (i) =>
    deriveRevealFlags(
      i,
      current.answerIndex,
      selected,
      locked,
      timesUp && readyRef.current
    );

  return {
    current,
    idx,
    total,
    progressText: `${Math.min(idx + 1, total)}/${total}`,
    score, // state for live UI
    time,
    choose,
    flagsFor,
    barW,
    onTrackLayout,
    toast,
    toastY,
    toastOpacity,
    hintText: current?.hint?.trim() || "",
  };
}

/* --------------------------- PRESENTATIONAL UI ---------------------------- */

export function MetaPill({ progress, score }) {
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[s.metaPill, { backgroundColor: theme.colors.primary }]}>
      <View style={s.metaCol}>
        <MaterialCommunityIcons
          name="comment-question"
          size={19}
          color="#fff"
        />
        <Text style={[s.metaText, { color: "#fff" }]}>{progress}</Text>
      </View>
      <View
        style={[s.metaDivider, { backgroundColor: "rgba(255,255,255,0.5)" }]}
      />
      <View style={s.metaCol}>
        <MaterialCommunityIcons name="star-circle" size={19} color="#fff" />
        <Text style={[s.metaText, { color: "#fff" }]}>{score}</Text>
      </View>
    </View>
  );
}

export function QuestionCard({ text }) {
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[s.qCard, { backgroundColor: theme.colors.card }]}>
      <Text style={[s.qText, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
}

export function TimerBar({ barW, onLayout, time }) {
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={s.timeRow}>
      <Text style={[s.timeLabel, { color: theme.colors.subtext }]}>Time</Text>
      <View
        style={[
          s.timeTrack,
          { backgroundColor: theme.key === "dark" ? "#1F2937" : "#E5E7EB" },
        ]}
        onLayout={onLayout}
      >
        <Animated.View
          style={[
            s.timeFill,
            { backgroundColor: theme.colors.primary, width: barW },
          ]}
        />
      </View>
      <Text style={[s.timeVal, { color: theme.colors.subtext }]}>{time}</Text>
    </View>
  );
}

export function OptionItem({ text, flags, disabled, onPress }) {
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const borderColor = flags.showGreen
    ? "#16A34A"
    : flags.showRed
    ? "#DC2626"
    : flags.showBlue
    ? theme.colors.primary
    : "transparent";

  const textColor = flags.showGreen
    ? "#16A34A"
    : flags.showRed
    ? "#DC2626"
    : flags.showBlue
    ? theme.colors.primary
    : theme.colors.text;

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.9}
      onPress={onPress}
      disabled={disabled}
      style={[s.option, { borderColor }]}
    >
      <Text style={[s.optText, { color: textColor }]}>{text}</Text>
      <View style={s.rightSlot}>
        {flags.showGreen && (
          <View style={[s.resultBadge, { backgroundColor: "#16A34A" }]}>
            <Ionicons name="checkmark" size={13} color="#fff" />
          </View>
        )}
        {flags.showRed && (
          <View style={[s.resultBadge, { backgroundColor: "#DC2626" }]}>
            <Ionicons name="close" size={13} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function ToastOverlay({ toast, y, opacity }) {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(theme), [theme]);

  if (!toast) return null;
  const t = TOAST_THEME[toast.type] || TOAST_THEME.correct;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.toastOverlay,
        {
          transform: [{ translateY: y }],
          opacity,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={[s.toastCard, { backgroundColor: t.bg }]}>
        <Text style={s.toastTitle}>{t.title}</Text>
        <View style={s.toastPill}>
          <Text style={[s.toastPillText, { color: t.pillText }]}>
            {toast.text}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export function HintModal({ open, onClose, hint }) {
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>
      <View style={s.modalCenter} pointerEvents="box-none">
        <View style={[s.modalCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[s.modalTitle, { color: theme.colors.text }]}>Hint</Text>
          <Text style={[s.modalBody, { color: theme.colors.subtext }]}>
            {hint?.trim() || "No hint available for this question."}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={[s.modalBtn, { backgroundColor: theme.colors.primary }]}
            activeOpacity={0.9}
          >
            <Text style={s.modalBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function SettingsModal({
  open,
  onClose,
  soundEnabled,
  setSoundEnabled,
  hapticEnabled,
  setHapticEnabled,
}) {
  const { theme, themeKey, setThemeKey } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const setTheme = async (key) => {
    setThemeKey(key);
    try {
      await AsyncStorage.setItem("pref:themeKey", key);
    } catch {}
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>
      <View style={s.modalCenter} pointerEvents="box-none">
        <View
          style={[
            s.modalCard,
            { backgroundColor: theme.colors.card, paddingBottom: 12 },
          ]}
        >
          <Text style={[s.modalTitle, { color: theme.colors.text }]}>
            Quiz Settings
          </Text>

          {/* Sound */}
          <View style={s.rowBetween}>
            <Text
              style={[
                s.modalBody,
                { color: theme.colors.text, marginBottom: 0 },
              ]}
            >
              Sound effects
            </Text>
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
          </View>

          {/* Haptics */}
          <View style={[s.rowBetween, { marginBottom: 20 }]}>
            <Text
              style={[
                s.modalBody,
                { color: theme.colors.text, marginBottom: 0 },
              ]}
            >
              Haptics
            </Text>
            <Switch value={hapticEnabled} onValueChange={setHapticEnabled} />
          </View>

          {/* Theme */}
          <ThemeToggle />

          <TouchableOpacity
            onPress={onClose}
            style={[
              s.modalBtn,
              { backgroundColor: theme.colors.primary, marginTop: 20 },
            ]}
            activeOpacity={0.9}
          >
            <Text style={s.modalBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* --------------------------------- STYLES --------------------------------- */

const makeStyles = (theme) =>
  StyleSheet.create({
    // meta pill
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

    // question
    qCard: {
      height: 150,
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

    // timer
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
    timeVal: {
      width: 14,
      textAlign: "right",
      fontSize: 12,
      fontWeight: "800",
      marginLeft: 6,
    },

    // option
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

    // toast
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

    // modals
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
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 8,
      textAlign: "center",
    },
    modalBody: { fontSize: 16, textAlign: "left", marginBottom: 10 },
    modalBtn: { borderRadius: 12, paddingVertical: 10, alignItems: "center" },
    modalBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    themePill: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      borderWidth: 1.5,
    },
  });
