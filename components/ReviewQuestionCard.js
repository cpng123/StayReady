import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";

const GREEN = "#16A34A";
const RED = "#DC2626";
const BLUE = "#2563EB";

export default function ReviewQuestionCard({
  index = 0,
  total = 0,
  text = "",
  options = [],
  answerIndex = 0,
  selectedIndex,
  timesUp,
  // top-right action icon
  actionIcon = "bookmark",          // "bookmark" | "trash-outline" | any Ionicons name
  actionActive = false,             // when true and actionIcon is bookmark, show filled/red
  actionIconColor,                  // override idle color (e.g., red for trash)
  actionActiveColor,                // override active color (default red)
  onActionPress,
  style,
}) {
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const isAnswered = typeof selectedIndex === "number";
  const isCorrect = isAnswered && selectedIndex === answerIndex;
  const isTimesUp = !isAnswered && !!timesUp;
  const isWrong = isAnswered && !isCorrect;

  const stripeColor = isCorrect
    ? GREEN
    : isWrong
    ? RED
    : isTimesUp
    ? BLUE
    : theme.colors.primary;

  // Resolve icon name & color
  let iconName = actionIcon;
  if (actionIcon === "bookmark") {
    iconName = actionActive ? "bookmark" : "bookmark-outline";
  }
  const resolvedActiveColor = actionActiveColor || RED;
  const resolvedIdleColor =
    actionIconColor || (actionIcon === "trash-outline" ? RED : theme.colors.subtext);
  const iconColor = actionActive ? resolvedActiveColor : resolvedIdleColor;

  return (
    <View style={[s.card, { backgroundColor: theme.colors.card }, style]}>
      {/* left status stripe */}
      <View style={[s.stripe, { backgroundColor: stripeColor }]} />

      {/* top row: number + action */}
      <View style={s.topRow}>
        <Text style={[s.numText, { color: theme.colors.text }]}>
          #{index + 1}/{total}
        </Text>

        <TouchableOpacity activeOpacity={0.8} style={s.actionBtn} onPress={onActionPress}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* question text */}
      <Text style={[s.qText, { color: theme.colors.text }]}>{text}</Text>

      {/* answers */}
      {isAnswered ? (
        isCorrect ? (
          // correct: single green line
          <Text style={[s.answerLine, { color: GREEN }]}>
            {options[selectedIndex] ?? ""}
          </Text>
        ) : (
          // wrong: user choice (red) + correct (green)
          <>
            <Text style={[s.answerLine, { color: RED }]}>
              {options[selectedIndex] ?? ""}
            </Text>
            <Text style={[s.answerLine, { color: GREEN }]}>
              {options[answerIndex] ?? ""}
            </Text>
          </>
        )
      ) : isTimesUp ? (
        // timed out: message + correct in blue
        <>
          <Text style={[s.answerLine, { color: BLUE }]}>
            Time&apos;s up, no answer selected
          </Text>
          <Text style={[s.answerLine, { color: BLUE }]}>
            {options[answerIndex] ?? ""}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    card: {
      borderRadius: 12,
      padding: 12,
      paddingLeft: 18,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
      overflow: "hidden",
    },
    stripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 8,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    numText: { fontWeight: "800", fontSize: 16 },
    actionBtn: { padding: 6 },
    qText: { fontSize: 16, lineHeight: 20, marginBottom: 8, fontWeight: "500" },
    answerLine: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  });
