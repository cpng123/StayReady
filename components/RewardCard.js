// components/RewardCard.js
import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const CARD_H = 86;
const IMG_W = 96;

export default function RewardCard({ item, theme }) {
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[s.card, { backgroundColor: theme.colors.card }]}>
      <View style={s.imgWrap}>
        <Image source={item.image} style={s.img} />
      </View>

      <View style={s.right}>
        <Text style={[s.title, { color: theme.colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[s.desc, { color: theme.colors.subtext }]} numberOfLines={2}>
          {item.desc}
        </Text>
        <Text style={[s.points, { color: theme.colors.primary }]}>
          {item.points} points
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    card: {
      height: CARD_H,
      borderRadius: 14,
      overflow: "hidden", // left corners apply to image
      flexDirection: "row",
      alignItems: "stretch",
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    imgWrap: {
      width: IMG_W,
      height: "100%",
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
      overflow: "hidden",
      alignSelf: "stretch",
    },
    img: {
      width: "100%",
      height: "100%",
      resizeMode: "cover", // full container height, flush-left
      // right edge stays square (no right rounding)
    },
    right: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      justifyContent: "center",
    },
    title: { fontWeight: "800", fontSize: 15, marginBottom: 2 },
    desc: { fontSize: 12, fontWeight: "600" },
    points: { marginTop: 6, fontSize: 12, fontWeight: "900" },
  });
