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
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getGuideById } from "../data/preparednessGuides";
import { useThemeContext } from "../theme/ThemeProvider";
import ExternalResourceCard from "../components/ExternalResourceCard";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PADDING = 16;
const GAP = 12;
const TILE_WIDTH = Math.floor((SCREEN_WIDTH - H_PADDING * 2 - GAP) / 2);
const CARD_RADIUS = 16;

/* ---------------- Small card in the horizontal reasons list ---------------- */
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

/* --------------------------- Reason info modal ----------------------------- */
function ReasonModal({ visible, onClose, reason, theme, t }) {
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
              {reason?.label ??
                t("preparedness_screen.reason_fallback", {
                  ns: "common",
                  defaultValue: "Reason",
                })}
            </Text>
          </View>
          <Text style={[styles.modalBody, { color: theme.colors.subtext }]}>
            {reason?.text
              ? reason.text
              : t("preparedness_screen.reason_more_details", {
                  ns: "common",
                  defaultValue:
                    "More details about this reason will appear here...",
                })}
          </Text>
          <View style={{ height: 12 }} />
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
            onPress={onClose}
            activeOpacity={0.9}
          >
            <Text style={styles.modalBtnText}>
              {t("common.close", { ns: "common" })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* -------- Grid section (2 columns, image on top, caption below) ------------ */
function SectionGrid({ section, sectionKey, guideId, theme, t }) {
  const effectiveKey = sectionKey || section?.id || section?.key;
  const items = section?.items ?? [];
  if (!items.length || !effectiveKey) return null;

  const lastRowStart = items.length - (items.length % 2 === 0 ? 2 : 1);

  return (
    <View style={styles.bodyWrap}>
      <Text style={[styles.h2, { color: theme.colors.text }]}>
        {t(`${guideId}.sections.${effectiveKey}.title`, { ns: "preparedness" })}
      </Text>
      <FlatList
        data={items}
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
                {t(`${guideId}.sections.${effectiveKey}.items.${item.id}`, {
                  ns: "preparedness",
                })}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

/* --------------------------- Big promo card ------------------------------- */
function InteractiveLearning({ theme, onPress, t }) {
  return (
    <View style={styles.bodyWrap}>
      <Text style={[styles.h2, { color: theme.colors.text }]}>
        {t("preparedness_screen.interactive_learning", { ns: "common" })}
      </Text>

      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <ImageBackground
          source={require("../assets/General/interactive-learning.jpg")}
          style={styles.interactiveCard}
          imageStyle={{ borderRadius: CARD_RADIUS }}
        >
          <View style={styles.interactiveTint} />
          <View style={styles.interactiveContent}>
            <Text style={styles.interactiveTitle}>
              {t("preparedness_screen.interactive_title", { ns: "common" })}
            </Text>
            <Text style={styles.interactiveSub}>
              {t("preparedness_screen.interactive_sub", { ns: "common" })}
            </Text>
            <View style={styles.interactiveBtn}>
              <Ionicons name="play" size={16} color="#0A84FF" />
              <Text
                style={[
                  styles.interactiveBtnText,
                  { color: theme.colors.primary },
                ]}
              >
                {t("preparedness_screen.interactive_cta", { ns: "common" })}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------------- External resources section ------------------------ */
function ExternalResources({ resources = [], theme, navigation, guideId, t }) {
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
          {t("preparedness_screen.external_resources", { ns: "common" })}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("ExternalResources")}
        >
          <Text style={[styles.seeMore, { color: theme.colors.primary }]}>
            {t("common.see_more", { ns: "common" })}
          </Text>
        </TouchableOpacity>
      </View>

      {resources.map((r) => (
        <ExternalResourceCard
          key={r.id}
          item={{
            ...r,
            title: t(`${guideId}.externalResources.${r.id}.title`, {
              ns: "preparedness",
            }),
            desc: t(`${guideId}.externalResources.${r.id}.desc`, {
              ns: "preparedness",
            }),
          }}
          theme={theme}
          navigation={navigation}
        />
      ))}
    </View>
  );
}

export default function PreparednessGuideScreen({ navigation, route }) {
  const { theme } = useThemeContext();
  const { t } = useTranslation();

  const guideId = route?.params?.id;
  const guide = getGuideById(guideId) || getGuideById("flood");

  const { hero, reasons = [], sections = [] } = guide;

  const translatedTitle = t(`${guideId}.title`, { ns: "preparedness" });
  const translatedDescription = t(`${guideId}.description`, {
    ns: "preparedness",
  });

  const QUIZ_ID_MAP = {
    thunderstorm: "storm",
    firstaid: "aid",
    emergencykit: "kit",
  };
  const quizCategoryId = QUIZ_ID_MAP[guideId] || guideId || "flood";

  const [reasonOpen, setReasonOpen] = useState(false);
  const [activeReason, setActiveReason] = useState(null);

  const openReason = (r) => {
    const label = t(`${guideId}.reasons.${r.id}.label`, { ns: "preparedness" });
    const text = t(`${guideId}.reasons.${r.id}.text`, { ns: "preparedness" });
    setActiveReason({ ...r, label, text });
    setReasonOpen(true);
  };
  const closeReason = () => setReasonOpen(false);

  const SECTION_KEY_MAP = {
    wind: {
      "wind-prep": "prepareBefore",
      "wind-during": "protectDuring",
      "wind-after": "recoverAfter",
    },
    aid: {
      "aid-before": "before",
      "aid-during": "during",
      "aid-after": "after",
    },
    disease: {
      "disease-prevent": "preventBefore",
      "disease-during": "protectDuring",
      "disease-after": "recoverAfter",
    },
  };

  const normalizeKey = (gid, k) => SECTION_KEY_MAP[gid]?.[k] || k;

  // Build main FlatList sections (removed 'stats')
  const SECTIONS = useMemo(() => {
    const head = [{ type: "reasons" }];
    const grids = sections.map((s, idx) => ({
      type: "grid",
      section: s,
      key: s.id || s.key || `section-${idx}`,
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
          {t("preparedness_screen.title_suffix", {
            ns: "common",
            title: translatedTitle,
          })}
        </Text>

        <Text style={[styles.desc, { color: theme.colors.subtext }]}>
          {translatedDescription}
        </Text>
      </View>
    </>
  );

  const renderSection = ({ item }) => {
    if (item.type === "reasons") {
      return (
        <View style={styles.bodyWrap}>
          <Text style={[styles.h2, { color: theme.colors.text }]}>
            {t("preparedness_screen.why_title", {
              ns: "common",
              topic: translatedTitle,
            })}
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
                label={t(`${guideId}.reasons.${r.id}.label`, {
                  ns: "preparedness",
                })}
                onPress={() => openReason(r)}
                theme={theme}
              />
            )}
          />
        </View>
      );
    }
    if (item.type === "grid") {
      return (
        <SectionGrid
          section={{
            ...item.section,
            id: normalizeKey(guideId, item.section.id || item.section.key),
          }}
          sectionKey={normalizeKey(
            guideId,
            item.section.id || item.section.key
          )}
          guideId={guideId || "flood"}
          theme={theme}
          t={t}
        />
      );
    }
    if (item.type === "interactive") {
      return (
        <InteractiveLearning
          theme={theme}
          t={t}
          onPress={() =>
            navigation.navigate("QuizSets", {
              categoryId: quizCategoryId,
              title: translatedTitle,
            })
          }
        />
      );
    }
    if (item.type === "external") {
      return (
        <ExternalResources
          resources={guide.externalResources}
          guideId={guideId || "flood"}
          theme={theme}
          navigation={navigation}
          t={t}
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
        t={t}
      />
    </SafeAreaView>
  );
}

/* --------------------------------- Styles --------------------------------- */
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

  // (Removed statsCard since Quick Stats section is gone)

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
});
