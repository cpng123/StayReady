// screens/BadgeRewardScreen.js
import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, ImageBackground, FlatList, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useThemeContext } from "../theme/ThemeProvider";
import TopBar from "../components/TopBar";
import SegmentToggle from "../components/SegmentToggle";
import { buildBadgeList } from "../utils/badges";

export default function BadgeRewardScreen() {
  const nav = useNavigation();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [tab, setTab] = useState("badge"); // "badge" | "rewards"
  const [summary, setSummary] = useState({ badgesEarned: 0, points: 0 });
  const [items, setItems] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const { items, summary } = await buildBadgeList();
        setItems(items);
        setSummary(summary);
      })();
    }, [])
  );

  const HeaderHero = (
    <ImageBackground
      source={require("../assets/General/badge-blue.jpg")}
      style={s.hero}
      imageStyle={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
    >
      <Text style={s.heroTitle}>Badge & Reward</Text>
      <View style={s.counters}>
        <View style={[s.counterBox, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={s.counterValue}>{summary.badgesEarned}</Text>
          <Text style={s.counterLabel}>BADGES</Text>
        </View>
        <View style={{ width: 10 }} />
        <View style={[s.counterBox, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={s.counterValue}>{summary.points}</Text>
          <Text style={s.counterLabel}>POINTS</Text>
        </View>
      </View>
    </ImageBackground>
  );

  const renderBadge = ({ item }) => (
    <View style={[s.badgeCard, { backgroundColor: theme.colors.card }]}>
      <View style={s.badgeRow}>
        <View style={s.badgeLeft}>
          <View style={s.badgeIconWrap}>
            <ImageBackground
              source={item.icon}
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.badgeTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            <Text style={[s.badgeDesc, { color: theme.colors.subtext }]}>
              {item.desc}
            </Text>
          </View>
        </View>

        <Text
          style={[
            s.rightPct,
            { color: item.achieved ? theme.colors.primary : theme.colors.subtext },
          ]}
        >
          {item.progress}%
        </Text>
      </View>

      <View
        style={[
          s.progressTrack,
          { backgroundColor: theme.key === "dark" ? "#2A2F3A" : "#E5E7EB" },
        ]}
      >
        <View
          style={[
            s.progressFill,
            {
              width: `${item.progress}%`,
              backgroundColor: item.achieved ? theme.colors.primary : "#60A5FA",
            },
          ]}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.appBg }]}>
      <TopBar title="Badge & Reward" onBack={() => nav.goBack()} />

      {HeaderHero}

      <View style={{ paddingHorizontal: 14, marginTop: 10 }}>
        {/* looks like your drawer Theme toggle, but it's a local two-tab control */}
        <SegmentToggle
          options={[
            { id: "badge", label: "Badge" },
            { id: "rewards", label: "Rewards" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === "badge" ? (
        <FlatList
          contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderBadge}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      ) : (
        <View style={{ padding: 24 }}>
          <Text style={{ color: theme.colors.subtext }}>
            Rewards coming soon.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    hero: {
      height: 150,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 4,
      justifyContent: "center",
    },
    heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 10 },
    counters: { flexDirection: "row" },
    counterBox: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
    },
    counterValue: { color: "#fff", fontWeight: "900", fontSize: 18 },
    counterLabel: { color: "#E5ECFF", fontWeight: "700", fontSize: 12, marginTop: 2 },

    badgeCard: {
      borderRadius: 14,
      padding: 12,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    badgeLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    badgeIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.key === "dark" ? "#0f1115" : "#F3F4F6",
    },
    badgeTitle: { fontWeight: "800", fontSize: 15 },
    badgeDesc: { fontSize: 12, fontWeight: "600", marginTop: 2 },
    rightPct: { fontWeight: "800", fontSize: 12 },
    progressTrack: { height: 6, borderRadius: 8, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 8 },
  });
