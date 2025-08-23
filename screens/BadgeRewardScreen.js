// screens/BadgeRewardScreen.js
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ImageBackground,
  Image,
  FlatList,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
  Share,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useThemeContext } from "../theme/ThemeProvider";
import SegmentToggle from "../components/SegmentToggle";
import { buildBadgeList } from "../utils/badges";
import { LinearGradient } from "expo-linear-gradient";

const ICONS = {
  badges: require("../assets/General/badge.png"),
  points: require("../assets/General/point.png"),
};

export default function BadgeRewardScreen() {
  const nav = useNavigation();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [tab, setTab] = useState("badge");
  const [summary, setSummary] = useState({ badgesEarned: 0, points: 0 });
  const [items, setItems] = useState([]);

  // Modal state
  const [activeBadge, setActiveBadge] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Breathing animation for the badge image
  const scale = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (!showModal) return;
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: true }
    );
    breathe.start();
    return () => breathe.stop();
  }, [showModal, scale]);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const { items, summary } = await buildBadgeList();
        setItems(items);
        setSummary(summary);
      })();
    }, [])
  );

  const openBadge = (badge) => {
    setActiveBadge(badge);
    setShowModal(true);
  };
  const closeBadge = () => setShowModal(false);

  const shareBadge = async () => {
    if (!activeBadge?.achieved) return;
    try {
      await Share.share({
        title: `Unlocked: ${activeBadge.title}`,
        message: `I just unlocked the "${activeBadge.title}" badge! ${activeBadge.desc}`,
      });
    } catch (e) {
      console.log("Share cancelled/error:", e?.message);
    }
  };

  const getCongratsText = (b) => {
    if (!b) return "";
    if (b.id?.startsWith("fast"))
      return "Impressive progress! You’ve finished a quiz under 1 minute like a champ!";
    if (b.id?.startsWith("perfect"))
      return "Perfect score! Keep that streak of excellence going!";
    if (b.id?.startsWith("daily"))
      return "Daily dedication pays off—nice consistency!";
    if (b.id?.startsWith("xp-"))
      return "Your XP keeps stacking—awesome effort!";
    if (b.id?.startsWith("streak")) return "You’re on fire—what a streak!";
    return "Great job! Keep it up!";
  };

  const renderBadge = ({ item }) => {
    const locked = !item.achieved;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => openBadge(item)}
        style={[s.badgeCard, { backgroundColor: theme.colors.card }]}
      >
        {/* Icon with overlay mute when locked */}
        <View style={s.badgeIconBox}>
          <Image
            source={item.icon}
            style={[s.badgeIcon, !item.achieved && s.lockedImg]}
            resizeMode="contain"
          />

          {locked && <View style={s.lockedOverlay} />}
        </View>

        <View style={s.badgeRight}>
          <Text
            style={[s.badgeTitle, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[s.badgeDesc, { color: theme.colors.subtext }]}
            numberOfLines={2}
          >
            {item.desc}
          </Text>

          <View style={s.progressRow}>
            <View
              style={[
                s.progressTrack,
                {
                  backgroundColor: theme.key === "dark" ? "#2A2F3A" : "#E5E7EB",
                },
              ]}
            >
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${item.progress}%`,
                    backgroundColor: item.achieved
                      ? theme.colors.primary
                      : "#60A5FA",
                  },
                ]}
              />
            </View>
            <Text
              style={[
                s.rightPct,
                {
                  color: item.achieved
                    ? theme.colors.primary
                    : theme.colors.subtext,
                },
              ]}
            >
              {item.progress}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

          <Pressable
            onPress={() => nav.goBack()}
            style={s.backBtn}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>

          <Text style={s.heroTitle}>Badge &amp; Reward</Text>

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

      {/* Tabs */}
      <View style={{ paddingHorizontal: 14, marginTop: 12 }}>
        <SegmentToggle
          options={[
            { id: "badge", label: "Badge" },
            { id: "rewards", label: "Rewards" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {/* List / Content */}
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

      {/* BADGE MODAL */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent
        onRequestClose={closeBadge}
      >
        {/* Outer press closes when tapping outside the card */}
        <Pressable style={s.modalOverlay} onPress={closeBadge}>
          {/* Inner press absorbs touches so overlay doesn't close */}
          <Pressable
            onPress={() => {}}
            style={[s.modalCard, { backgroundColor: theme.colors.card }]}
          >
            {activeBadge?.icon && (
              <Animated.Image
                source={activeBadge.icon}
                style={[
                  s.modalIconBig,
                  !activeBadge?.achieved && s.lockedImg,
                  { transform: [{ scale }] },
                ]}
                resizeMode="contain"
              />
            )}

            <Text style={[s.modalTitle, { color: theme.colors.text }]}>
              {activeBadge?.title || ""}
            </Text>

            <Text style={[s.modalMsg, { color: theme.colors.subtext }]}>
              {activeBadge
                ? activeBadge.achieved
                  ? `Impressive progress! You've “${activeBadge.desc}” like a champ!`
                  : `You're almost there — unlock this by “${activeBadge.desc}”.`
                : ""}
            </Text>

            {activeBadge?.achieved ? (
              <View style={s.modalBtnCol}>
                <TouchableOpacity
                  style={s.primaryBtn}
                  onPress={shareBadge}
                  activeOpacity={0.9}
                >
                  <Ionicons name="share-outline" size={18} color="#fff" />
                  <Text style={s.primaryBtnText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.secondaryBtn}
                  onPress={closeBadge}
                  activeOpacity={0.9}
                >
                  <Text style={s.secondaryBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.modalBtnCol}>
                <TouchableOpacity
                  style={s.secondaryBtn}
                  onPress={closeBadge}
                  activeOpacity={0.9}
                >
                  <Text style={s.secondaryBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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

    // BADGE ROW
    badgeCard: {
      borderRadius: 14,
      padding: 8,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    // icon wrapper + image + overlay (list)
    badgeIconBox: {
      width: 62,
      height: 62,
      position: "relative",
    },
    badgeIcon: { width: 62, height: 62 },
    modalIconBig: { width: 140, height: 140, marginBottom: 12 },

    badgeRight: { flex: 1 },
    badgeTitle: { fontWeight: "800", fontSize: 16 },
    badgeDesc: { fontSize: 12, fontWeight: "600" },
    lockedImg: { opacity: 0.5 },
    progressRow: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    progressTrack: { flex: 1, height: 6, borderRadius: 8, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 8 },
    rightPct: {
      width: 40,
      textAlign: "right",
      fontWeight: "800",
      fontSize: 12,
      paddingRight: 10,
    },

    // MODAL
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      width: "88%",
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingTop: 22,
      paddingBottom: 14,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
      alignItems: "center",
    },

    modalTitle: { fontSize: 20, fontWeight: "900", marginBottom: 6 },
    modalMsg: {
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 14,
      paddingHorizontal: 6,
    },
    modalBtnCol: {
      alignSelf: "stretch",
      gap: 10,
      marginTop: 8,
    },
    primaryBtn: {
      width: "100%",
      backgroundColor: "#0A84FF",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    primaryBtnText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 15,
      marginLeft: 6,
    },
    secondaryBtn: {
      width: "100%",
      backgroundColor: "rgba(0,0,0,0.06)",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    secondaryBtnText: {
      color: theme.colors.text,
      fontWeight: "800",
      fontSize: 15,
      marginLeft: 0,
    },
  });