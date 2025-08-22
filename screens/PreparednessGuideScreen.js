// screens/PreparednessGuideScreen.js
import React, { useState, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  Pressable,
  Linking,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getGuideById } from "../data/preparednessGuides";
import { useThemeContext } from "../theme/ThemeProvider";
import ExternalResourceCard from "../components/ExternalResourceCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PADDING = 16;
const GAP = 12;
const TILE_WIDTH = Math.floor((SCREEN_WIDTH - H_PADDING * 2 - GAP) / 2);
const CARD_RADIUS = 16;

// Small card in the horizontal reasons list
function ReasonCard({ icon, label, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[styles.reasonCard, { backgroundColor: theme.colors.card }]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <Image
        source={icon}
        style={{
          width: 45,
          height: 45,
          marginBottom: 8,
          resizeMode: "contain",
        }}
      />
      <Text
        style={[styles.reasonText, { color: theme.colors.text }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Simple info modal for a reason
function ReasonModal({ visible, onClose, reason, theme }) {
  if (!visible) return null;
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>
      <View style={styles.modalCenter} pointerEvents="box-none">
        <View
          style={[styles.modalCard, { backgroundColor: theme.colors.card }]}
        >
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            {reason?.icon ? (
              <Image
                source={reason.icon}
                style={{
                  width: 80,
                  height: 80,
                  resizeMode: "contain",
                  marginBottom: 12,
                }}
              />
            ) : null}
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {reason?.label ?? "Reason"}
            </Text>
          </View>
          <Text style={[styles.modalBody, { color: theme.colors.subtext }]}>
            {reason?.text
              ? reason.text
              : "More details about this reason will appear here..."}
          </Text>
          <View style={{ height: 12 }} />
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
            onPress={onClose}
            activeOpacity={0.9}
          >
            <Text style={styles.modalBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Grid section (2 columns, image on top, caption below)
function SectionGrid({ section, theme }) {
  const data = section?.items ?? [];
  if (!data.length) return null;
  const lastRowStart = data.length - (data.length % 2 === 0 ? 2 : 1);

  return (
    <View style={styles.bodyWrap}>
      <Text style={[styles.h2, { color: theme.colors.text }]}>
        {section.title}
      </Text>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 4 }}
        renderItem={({ item, index }) => {
          const isLastRow = index >= lastRowStart;
          return (
            <View
              style={[
                styles.tileCard,
                {
                  width: TILE_WIDTH,
                  marginBottom: isLastRow ? 0 : GAP,
                  backgroundColor: theme.colors.card,
                },
              ]}
            >
              <Image source={item.img} style={styles.tileImg} />
              <Text style={[styles.tileCaption, { color: theme.colors.text }]}>
                {item.text}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

// --- Big promo card -----------------------------------------
function InteractiveLearning({ theme, onPress }) {
  return (
    <View style={styles.bodyWrap}>
      <Text style={[styles.h2, { color: theme.colors.text }]}>
        Interactive Learning
      </Text>

      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <ImageBackground
          source={require("../assets/General/interactive-learning.jpg")}
          style={styles.interactiveCard}
          imageStyle={{ borderRadius: CARD_RADIUS }}
        >
          {/* a subtle left-to-right overlay so white text always reads */}
          <View style={styles.interactiveTint} />

          <View style={styles.interactiveContent}>
            <Text style={styles.interactiveTitle}>Test your knowledge</Text>
            <Text style={styles.interactiveSub}>
              See how much you know about{"\n"}staying safe.
            </Text>

            <View style={styles.interactiveBtn}>
              <Ionicons name="play" size={16} color="#0A84FF" />
              <Text
                style={[
                  styles.interactiveBtnText,
                  { color: theme.colors.primary },
                ]}
              >
                Play & Learn
              </Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}

// --- External section wrapper --------------------------------
function ExternalResources({ resources = [], theme, navigation }) {
  if (!resources.length) return null;
  return (
    <View style={styles.bodyWrap}>
      <View style={styles.extHeaderRow}>
        <Text
          style={[
            styles.h2,
            styles.extHeaderTitle,
            { color: theme.colors.text },
          ]}
        >
          External Resources
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("ExternalResources")}
        >
          <Text style={[styles.seeMore, { color: theme.colors.primary }]}>
            See More
          </Text>
        </TouchableOpacity>
      </View>

      {resources.map((r) => (
        <ExternalResourceCard
          key={r.id}
          item={r}
          theme={theme}
          navigation={navigation}
        />
      ))}
    </View>
  );
}

export default function PreparednessGuideScreen({ navigation, route }) {
  const { theme } = useThemeContext(); // Get the current theme
  const guideId = route?.params?.id;
  const guide = getGuideById(guideId) || getGuideById("flood");
  const { title, description, hero, reasons, sections = [] } = guide;

  // Map guide IDs to quiz category IDs if any differ
  const QUIZ_ID_MAP = {
    thunderstorm: "storm",
    firstaid: "aid",
    emergencykit: "kit",
  };
  const quizCategoryId = QUIZ_ID_MAP[guideId] || guideId;

  const [reasonOpen, setReasonOpen] = useState(false);
  const [activeReason, setActiveReason] = useState(null);
  const openReason = (r) => {
    setActiveReason(r);
    setReasonOpen(true);
  };
  const closeReason = () => setReasonOpen(false);

  // Build main FlatList sections
  const SECTIONS = useMemo(() => {
    const head = [{ type: "reasons" }, { type: "stats" }];
    const grids = sections.map((s, idx) => ({
      type: "grid",
      key: `grid-${idx}`,
      section: s,
    }));
    const tail = [{ type: "interactive" }];
    if (guide.externalResources?.length) tail.push({ type: "external" });
    return [...head, ...grids, ...tail];
  }, [sections, guide.externalResources]);

  const ListHeader = (
    <>
      {/* Hero with back button */}
      <View style={styles.hero}>
        <Image source={hero} style={styles.heroImg} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.colors.overlay }]}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Title + description */}
      <View style={styles.bodyWrap}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title} Preparedness
        </Text>
        <Text style={[styles.desc, { color: theme.colors.subtext }]}>
          {description}
        </Text>
      </View>
    </>
  );

  const renderSection = ({ item }) => {
    if (item.type === "reasons") {
      return (
        <View style={styles.bodyWrap}>
          <Text style={[styles.h2, { color: theme.colors.text }]}>
            Why {title} Happen
          </Text>
          <FlatList
            data={reasons}
            keyExtractor={(i) => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.edgeToEdge}
            contentContainerStyle={{
              paddingVertical: 6,
              paddingHorizontal: H_PADDING - 1,
            }}
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
            renderItem={({ item: r }) => (
              <ReasonCard
                icon={r.icon}
                label={r.label}
                onPress={() => openReason(r)}
                theme={theme}
              />
            )}
          />
        </View>
      );
    }
    if (item.type === "stats") {
      return (
        <View style={styles.bodyWrap}>
          <Text style={[styles.h2, { color: theme.colors.text }]}>
            Quick Facts (Stats)
          </Text>
          <View
            style={[styles.statsCard, { backgroundColor: theme.colors.card }]}
          >
            {/* Placeholder image; replace later with a real chart */}
            <Image
              source={require("../assets/icon.png")}
              style={{ width: "100%", height: 140, borderRadius: 12 }}
              resizeMode="cover"
            />
          </View>
        </View>
      );
    }
    if (item.type === "grid") {
      return <SectionGrid section={item.section} theme={theme} />;
    }
    if (item.type === "interactive") {
      return (
        <InteractiveLearning
          theme={theme}
          onPress={() =>
            navigation.navigate("QuizSets", {
              categoryId: quizCategoryId,
              title: guide.title,
            })
          }
        />
      );
    }
    if (item.type === "external") {
      return (
        <ExternalResources
          resources={guide.externalResources}
          theme={theme}
          navigation={navigation}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.appBg }]}
    >
      <FlatList
        data={SECTIONS}
        keyExtractor={(s, i) => s.key ?? `${s.type}-${i}`}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <ReasonModal
        visible={reasonOpen}
        onClose={closeReason}
        reason={activeReason}
        theme={theme}
      />
    </SafeAreaView>
  );
}

// Update styles to use theme colors where needed
const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: { height: 170 },
  heroImg: { width: SCREEN_WIDTH, height: "100%", resizeMode: "cover" },
  backBtn: {
    position: "absolute",
    left: 12,
    top: 12,
    height: 36,
    width: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  bodyWrap: { paddingHorizontal: H_PADDING, paddingTop: 12 },
  title: { fontSize: 20, fontWeight: "800" },
  desc: { marginTop: 6, lineHeight: 20 },
  h2: { marginTop: 5, marginBottom: 8, fontSize: 18, fontWeight: "800" },
  edgeToEdge: { marginHorizontal: -H_PADDING },
  reasonCard: {
    width: 90,
    borderRadius: CARD_RADIUS,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  reasonText: {
    textAlign: "center",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 16,
  },
  statsCard: {
    borderRadius: CARD_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tileCard: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tileImg: { width: "100%", height: 110, resizeMode: "cover" },
  tileCaption: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    lineHeight: 16,
    textAlign: "center",
  },
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
  modalTitle: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  modalBody: { fontSize: 16, textAlign: "center", marginBottom: 10 },
  modalBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  interactiveCard: {
    height: 140,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    justifyContent: "center",
  },
  interactiveTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  interactiveContent: { paddingHorizontal: 16, paddingVertical: 12 },
  interactiveTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  interactiveSub: {
    color: "#F3F4F6",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  interactiveBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  interactiveBtnText: { fontWeight: "800" },
  extHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
    marginBottom: 8,
  },
  extHeaderTitle: { marginBottom: 0 },
  seeMore: { fontWeight: "700" },
  extRow: {
    flexDirection: "row",
    height: 85,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  extLogoWrap: {
    width: 105,
    height: "100%",
    borderTopLeftRadius: CARD_RADIUS,
    borderBottomLeftRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  extLogo: { width: "100%", height: "100%", resizeMode: "cover" },
  extTextWrap: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: "center",
  },
  extTitle: { fontWeight: "800", fontSize: 14 },
  extDesc: { fontSize: 11 },
});
