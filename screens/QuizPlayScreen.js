// screens/QuizPlayScreen.js
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../theme/ThemeProvider";
import TopBar from "../components/TopBar";
import ConfirmModal from "../components/ConfirmModal";
import QUIZ from "../data/quiz.json";
import { normalizeQuestions } from "../utils/quizLogic";
import { markDailyCompleted } from "../utils/dailyChallenge";
import { addQuizAttempt } from "../utils/progressStats";

import {
  useQuizEngine,
  useSound,
  useHaptics,
  useBackConfirm,
  MetaPill,
  TimerBar,
  QuestionCard,
  OptionItem,
  ToastOverlay,
  HintModal,
  SettingsModal,
} from "./QuizPlayKit";

const H_PADDING = 20;

export default function QuizPlayScreen({ navigation, route }) {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const mode = route?.params?.mode; // "daily" | undefined
  const meta = route?.params?.meta || null;
  const customQuestions = route?.params?.customQuestions;

  const categoryId = route?.params?.categoryId;
  const setId = route?.params?.setId;
  const setTitle =
    route?.params?.title ?? (mode === "daily" ? "Daily Challenge" : "Quiz");

  const questions = useMemo(() => {
    if (Array.isArray(customQuestions) && customQuestions.length)
      return customQuestions;
    return normalizeQuestions(QUIZ, categoryId, setId);
  }, [customQuestions, categoryId, setId]);

  const sfx = useSound();
  const haptics = useHaptics();

  const onFinish = async ({
    score,
    correctCount,
    total,
    review,
    timeTakenSec,
  }) => {
    const passMeta = meta || {
      setId: setId ?? "set",
      setTitle,
      categoryId: categoryId ?? "cat",
      categoryLabel:
        (QUIZ?.categories || []).find((c) => c.id === categoryId)?.title ||
        "Quiz",
    };

    if (mode === "daily") {
      try {
        await markDailyCompleted(review, passMeta);
      } catch {}
    }
    try {
      await addQuizAttempt({
        type: mode === "daily" ? "daily" : "set",
        meta: passMeta,
        correct: correctCount,
        total,
        timeTakenSec,
        xpEarned: score,
      });
    } catch {}

    back.allowNext(); // bypass leave-confirm when navigating away
    navigation.replace?.("QuizResult", {
      score,
      correct: correctCount,
      total,
      title: setTitle,
      timeTakenSec,
      review,
      meta: passMeta,
    });
  };

  const engine = useQuizEngine({ questions, sfx, haptics, onFinish });
  const back = useBackConfirm(navigation);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.appBg }]}>
      {/* TopBar w/ settings */}
      <TopBar
        title={setTitle}
        onBack={() => back.open()}
        rightIcon="settings-outline"
        onRightPress={() => setSettingsOpen(true)}
      />

      {/* Meta pill */}
      <MetaPill progress={engine.progressText} score={engine.score} />

      {/* Content */}
      <View style={s.content}>
        <QuestionCard text={engine.current?.text} />

        <TimerBar
          barW={engine.barW}
          onLayout={engine.onTrackLayout}
          time={engine.time}
        />

        <View style={{ gap: 10 }}>
          {engine.current?.options?.map((opt, i) => (
            <OptionItem
              key={i}
              text={opt}
              flags={engine.flagsFor(i)}
              onPress={() => engine.choose(i)}
            />
          ))}
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

      {/* Toast */}
      <ToastOverlay
        toast={engine.toast}
        y={engine.toastY}
        opacity={engine.toastOpacity}
      />

      {/* Hint Modal */}
      <HintModal
        open={hintOpen}
        onClose={() => setHintOpen(false)}
        hint={engine.hintText}
      />

      {/* Settings Modal (now includes Haptics) */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        soundEnabled={sfx.enabled}
        setSoundEnabled={sfx.setEnabled}
        hapticEnabled={haptics.enabled}
        setHapticEnabled={haptics.setEnabled}
      />

      {/* Leave confirm */}
      <ConfirmModal
        visible={back.visible}
        title="Leave quiz?"
        message="Your progress won’t be saved. Are you sure you want to exit?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={back.confirmExit}
        onCancel={back.close}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 6 },
    timeVal: {
      width: 26,
      textAlign: "right",
      fontSize: 12,
      fontWeight: "800",
      alignSelf: "flex-end",
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
