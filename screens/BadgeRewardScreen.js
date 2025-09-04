/**
 * BadgeRewardScreen
 * ------------------------------------------------------------
 *   - Shows a hero summary (badges earned + available points).
 *   - Lets user toggle between "Badges" & "Rewards".
 *   - Supports sorting (badges: Default/Unlocked/Locked; rewards: Default/Price ↑/↓).
 *   - Opens a badge modal for details & share.
 *   - Navigates to RewardDetail, passing available point balance.
 */

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
  TouchableOpacity,
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
import {
  getRewards,
  getRedeemedTotal,
  computeAvailablePoints,
} from "../utils/rewards";
import {
  BADGE_SORTS,
  REWARD_SORTS,
  sortBadges,
  sortRewards,
} from "../utils/sorters";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  // Tabs: "badge" or "rewards"
  const [tab, setTab] = useState("badge");

  // Summary: { badgesEarned, points } — points here reflect AVAILABLE balance
  const [summary, setSummary] = useState({ badgesEarned: 0, points: 0 });

  // Full badge list (already localized & shaped by buildBadgeList)
  const [items, setItems] = useState([]);

  // Rewards dataset (localized; static list)
  const [rewards, setRewards] = useState(getRewards(t));

  // Sort state for both tabs
  const [badgeSortIx, setBadgeSortIx] = useState(0);
  const [rewardSortIx, setRewardSortIx] = useState(1); // default to Price ↑

  // Cycle the active sort mode based on current tab
  const cycleSort = () => {
    if (tab === "badge") {
      setBadgeSortIx((i) => (i + 1) % BADGE_SORTS.length);
    } else {
      setRewardSortIx((i) => (i + 1) % REWARD_SORTS.length);
    }
  };

  // Modal state for viewing a single badge & sharing
  const [activeBadge, setActiveBadge] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load/refresh:
  // - Fetch badge items + summary
  // - Fetch redeemed total
  // - Compute AVAILABLE points = earned - redeemed
  const load = useCallback(async () => {
    const { items, summary } = await buildBadgeList(t);
    const redeemedTotal = await getRedeemedTotal();
    const available = computeAvailablePoints(summary.points, redeemedTotal);
    setItems(items);
    setSummary({ ...summary, points: available });
  }, [t]);

  // Refresh whenever this screen gains focus (e.g., returning from RewardDetail)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Open badge modal
  const openBadge = useCallback((badge) => {
    setActiveBadge(badge);
    setShowModal(true);
  }, []);

  // Close badge modal
  const closeBadge = useCallback(() => setShowModal(false), []);

  // Share earned badge (no-op if still locked)
  const shareBadge = useCallback(async () => {
    if (!activeBadge?.achieved) return;
    try {
      await Share.share(buildSharePayload(activeBadge, t)); // uses localized payload when available
    } catch {
      // swallow share errors
    }
  }, [activeBadge, t]);

  // Sorted lists derived from state
  const sortedBadges = useMemo(
    () => sortBadges(items, badgeSortIx),
    [items, badgeSortIx]
  );
  const sortedRewards = useMemo(
    () => sortRewards(rewards, rewardSortIx),
    [rewards, rewardSortIx]
  );

  // FlatList helpers
  const renderBadge = useCallback(
    ({ item }) => <BadgeCard item={item} theme={theme} onPress={openBadge} />,
    [theme, openBadge]
  );
  const keyExtractor = useCallback((it) => it.id, []);
  const renderReward = useCallback(
    ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          nav.navigate("RewardDetail", {
            item,
            pointsAvailable: summary.points, // pass available balance to detail
          })
        }
      >
        <RewardCard item={item} theme={theme} />
      </TouchableOpacity>
    ),
    [nav, summary.points, theme]
  );

  // Current sort label (localized fallback to raw label)
  const sortValue =
    tab === "badge" ? BADGE_SORTS[badgeSortIx] : REWARD_SORTS[rewardSortIx];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.appBg }]}>
      {/* ---------- HERO ---------- */}
      <View style={s.heroWrap}>
        <ImageBackground
          source={require("../assets/General/badge-blue.jpg")}
          style={s.hero}
          imageStyle={{}}
        >
          {/* top-to-bottom darkening to keep text legible */}
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.heroOverlay}
          />

          {/* Back (left) */}
          <Pressable
            onPress={() => nav.goBack()}
            style={s.backBtn}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>

          {/* Title (center) */}
          <Text style={s.heroTitle}>
            {t("badges.title", "Badges & Rewards")}
          </Text>

          {/* Sort (right) */}
          <Pressable testID="sort-btn" onPress={cycleSort} style={s.sortBtn} hitSlop={10}>
            <Ionicons name="swap-vertical" size={18} color="#fff" />
          </Pressable>

          {/* Stats under title */}
          <View style={s.statsContainer}>
            {/* Badges earned */}
            <View style={s.statCellCompact}>
              <Image source={ICONS.badges} style={s.statIconImg} />
              <View style={s.statTextCol}>
                <Text style={s.statValue}>{summary.badgesEarned}</Text>
                <Text style={s.statLabel}>
                  {t("badges.stats.badges", "BADGES")}
                </Text>
              </View>
            </View>

            <View style={s.vertDivider} />

            {/* Points (available) */}
            <View style={s.statCellCompact}>
              <Image source={ICONS.points} style={s.statIconImg} />
              <View style={s.statTextCol}>
                <Text style={s.statValue}>{summary.points}</Text>
                <Text style={s.statLabel}>
                  {t("badges.stats.points", "POINTS")}
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* ---------- Tabs + sort label ---------- */}
      <View style={{ paddingHorizontal: 14, marginTop: 12, marginBottom: 2 }}>
        <SegmentToggle
          options={[
            { id: "badge", label: t("badges.tabs.badge", "Badges") },
            { id: "rewards", label: t("badges.tabs.rewards", "Rewards") },
          ]}
          value={tab}
          onChange={setTab}
        />
        <Text style={[s.sortHint, { color: theme.colors.subtext }]}>
          {t("badges.sort")}{" "}
          {tab === "badge"
            ? t(
                `badges.sortOptions.${BADGE_SORTS[badgeSortIx].toLowerCase()}`,
                BADGE_SORTS[badgeSortIx]
              )
            : t(
                `rewards.sortOptions.${REWARD_SORTS[
                  rewardSortIx
                ].toLowerCase()}`,
                REWARD_SORTS[rewardSortIx]
              )}
        </Text>
      </View>

      {/* ---------- Content ---------- */}
      {tab === "badge" ? (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}
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
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}
          data={sortedRewards}
          keyExtractor={(r) => r.id}
          renderItem={renderReward}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          initialNumToRender={8}
          windowSize={8}
          removeClippedSubviews
        />
      )}

      {/* ---------- Badge Modal ---------- */}
      <BadgeModal
        open={showModal}
        badge={activeBadge}
        onClose={closeBadge}
        onShare={shareBadge}
        theme={theme}
        t={t}
      />
    </SafeAreaView>
  );
}

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
    sortHint: {
      marginTop: 8,
      marginBottom: 2,
      fontSize: 12,
      fontWeight: "800",
    },
  });
