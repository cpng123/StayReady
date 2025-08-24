// screens/BadgeRewardScreen.js
import React, { useMemo, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ImageBackground,
  Image,
  FlatList,
  StyleSheet,
  Pressable,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../theme/ThemeProvider";
import SegmentToggle from "../components/SegmentToggle";
import BadgeCard from "../components/BadgeCard";
import BadgeModal from "../components/BadgeModal";
import { buildBadgeList, buildSharePayload } from "../utils/badges";
import RewardCard from "../components/RewardCard";
import { getRewards } from "../utils/rewards";
import {
  BADGE_SORTS,
  REWARD_SORTS,
  sortBadges,
  sortRewards,
} from "../utils/sorters";

/* ---------- constants ---------- */

const ICONS = {
  badges: require("../assets/General/badge.png"),
  points: require("../assets/General/point.png"),
};

/* ---------- component ---------- */

export default function BadgeRewardScreen() {
  const nav = useNavigation();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [tab, setTab] = useState("badge");
  const [summary, setSummary] = useState({ badgesEarned: 0, points: 0 });
  const [items, setItems] = useState([]);
  const [rewards, setRewards] = useState(getRewards());

  // Sort state
  const [badgeSortIx, setBadgeSortIx] = useState(0);
  const [rewardSortIx, setRewardSortIx] = useState(1); // keep your existing default (Price ↑)

  const cycleSort = () => {
    if (tab === "badge") {
      setBadgeSortIx((i) => (i + 1) % BADGE_SORTS.length);
    } else {
      setRewardSortIx((i) => (i + 1) % REWARD_SORTS.length);
    }
  };

  // Modal state
  const [activeBadge, setActiveBadge] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    const { items, summary } = await buildBadgeList();
    setItems(items);
    setSummary(summary);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openBadge = useCallback((badge) => {
    setActiveBadge(badge);
    setShowModal(true);
  }, []);

  const closeBadge = useCallback(() => setShowModal(false), []);

  const shareBadge = useCallback(async () => {
    if (!activeBadge?.achieved) return;
    try {
      await Share.share(buildSharePayload(activeBadge));
    } catch {}
  }, [activeBadge]);

  const sortedBadges = useMemo(
    () => sortBadges(items, badgeSortIx),
    [items, badgeSortIx]
  );
  const sortedRewards = useMemo(
    () => sortRewards(rewards, rewardSortIx),
    [rewards, rewardSortIx]
  );

  const renderBadge = useCallback(
    ({ item }) => <BadgeCard item={item} theme={theme} onPress={openBadge} />,
    [theme, openBadge]
  );
  const keyExtractor = useCallback((it) => it.id, []);
  const renderReward = useCallback(
    ({ item }) => <RewardCard item={item} theme={theme} />,
    [theme]
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.appBg }]}>

      {/* HERO */}
      <View style={s.heroWrap}>
        <ImageBackground
          source={require("../assets/General/badge-blue.jpg")}
          style={s.hero}
          imageStyle={{}}
        >
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.heroOverlay}
          />

          {/* Back (left) */}
          <Pressable onPress={() => nav.goBack()} style={s.backBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>

          {/* Title (center) */}
          <Text style={s.heroTitle}>Badge &amp; Reward</Text>

          {/* Sort (right) */}
          <Pressable onPress={cycleSort} style={s.sortBtn} hitSlop={10}>
            <Ionicons name="swap-vertical" size={18} color="#fff" />
          </Pressable>

          {/* Stats under title */}
          <View style={s.statsContainer}>
            {/* Badges */}
            <View style={s.statCellCompact}>
              <Image source={ICONS.badges} style={s.statIconImg} />
              <View style={s.statTextCol}>
                <Text style={s.statValue}>{summary.badgesEarned}</Text>
                <Text style={s.statLabel}>BADGES</Text>
              </View>
            </View>

            <View style={s.vertDivider} />

            {/* Points */}
            <View style={s.statCellCompact}>
              <Image source={ICONS.points} style={s.statIconImg} />
              <View style={s.statTextCol}>
                <Text style={s.statValue}>{summary.points}</Text>
                <Text style={s.statLabel}>POINTS</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Tabs + sort label */}
      <View style={{ paddingHorizontal: 14, marginTop: 12, marginBottom: 2 }}>
        <SegmentToggle
          options={[
            { id: "badge", label: "Badge" },
            { id: "rewards", label: "Rewards" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <Text style={[s.sortHint, { color: theme.colors.subtext }]}>
          Sort: {tab === "badge" ? BADGE_SORTS[badgeSortIx] : REWARD_SORTS[rewardSortIx]}
        </Text>
      </View>

      {/* Content */}
      {tab === "badge" ? (
        <FlatList
          contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
          data={sortedBadges}
          keyExtractor={keyExtractor}
          renderItem={renderBadge}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          initialNumToRender={10}
          windowSize={8}
          removeClippedSubviews
        />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
          data={sortedRewards}
          keyExtractor={(r) => r.id}
          renderItem={renderReward}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          initialNumToRender={8}
          windowSize={8}
          removeClippedSubviews
        />
      )}

      {/* Badge Modal */}
      <BadgeModal
        open={showModal}
        badge={activeBadge}
        onClose={closeBadge}
        onShare={shareBadge}
        theme={theme}
      />
    </SafeAreaView>
  );
}

/* ---------- styles ---------- */

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },

    // HERO
    heroWrap: { width: "100%" },
    hero: {
      width: "100%",
      height: 160,
      justifyContent: "flex-start",
      paddingTop: 8,
      alignItems: "center",
    },
    backBtn: {
      position: "absolute",
      left: 14,
      top: 10,
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      backgroundColor: "rgba(0,0,0,0.25)",
    },
    sortBtn: {
      position: "absolute",
      right: 14,
      top: 10,
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      backgroundColor: "rgba(0,0,0,0.25)",
    },
    heroOverlay: { ...StyleSheet.absoluteFillObject },
    heroTitle: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "900",
      marginTop: 8,
      letterSpacing: 0.3,
      textShadowColor: "rgba(0,0,0,0.6)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },

    // Stats
    statsContainer: {
      marginTop: 35,
      marginBottom: 25,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 6,
    },
    statCellCompact: {
      minWidth: 110,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    statIconImg: {
      width: 30,
      height: 30,
      marginRight: 12,
      resizeMode: "contain",
    },
    statTextCol: { alignItems: "center", justifyContent: "center" },
    statValue: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
    statLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
      marginTop: 1,
      color: "#FFFFFF",
    },
    vertDivider: {
      width: 1,
      height: 40,
      backgroundColor: "rgba(255,255,255,0.75)",
      marginHorizontal: 6,
    },
    sortHint: { marginTop: 8, marginBottom: -6, fontSize: 12, fontWeight: "800" },
  });
