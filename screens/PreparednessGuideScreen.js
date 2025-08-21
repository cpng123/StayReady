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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getGuideById } from "../data/preparednessGuides";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PADDING = 16;
const GAP = 12;
const TILE_WIDTH = Math.floor((SCREEN_WIDTH - H_PADDING * 2 - GAP) / 2);
const CARD_RADIUS = 16;

// Small card in the horizontal reasons list
function ReasonCard({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.reasonCard}
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
      <Text style={styles.reasonText} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Simple info modal for a reason
function ReasonModal({ visible, onClose, reason }) {
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
        <View style={styles.modalCard}>
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
            <Text style={styles.modalTitle}>{reason?.label ?? "Reason"}</Text>
          </View>
          <Text style={styles.modalBody}>
            {reason?.text
              ? reason.text
              : "More details about this reason will appear here..."}
          </Text>
          <View style={{ height: 12 }} />
          <TouchableOpacity
            style={styles.modalBtn}
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
function SectionGrid({ section }) {
  const data = section?.items ?? [];
  if (!data.length) return null;
  const lastRowStart = data.length - (data.length % 2 === 0 ? 2 : 1);

  return (
    <View style={styles.bodyWrap}>
      <Text style={styles.h2}>{section.title}</Text>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        // small padding if you still want a tiny space under the section
        contentContainerStyle={{ paddingBottom: 4 }}
        renderItem={({ item, index }) => {
          const isLastRow = index >= lastRowStart;
          return (
            <View
              style={[
                styles.tileCard,
                { width: TILE_WIDTH, marginBottom: isLastRow ? 0 : GAP },
              ]}
            >
              <Image source={item.img} style={styles.tileImg} />
              <Text style={styles.tileCaption}>{item.text}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

export default function PreparednessGuideScreen({ navigation, route }) {
  const guideId = route?.params?.id;
  const guide = getGuideById(guideId) || getGuideById("flood");
  const { title, description, hero, reasons, sections = [] } = guide;

  const [reasonOpen, setReasonOpen] = useState(false);
  const [activeReason, setActiveReason] = useState(null);
  const openReason = (r) => {
    setActiveReason(r);
    setReasonOpen(true);
  };
  const closeReason = () => setReasonOpen(false);

  // Build main FlatList sections
  const SECTIONS = useMemo(() => {
    const base = [{ type: "reasons" }, { type: "stats" }];
    const grids = sections.map((s, idx) => ({
      type: "grid",
      key: `grid-${idx}`,
      section: s,
    }));
    return [...base, ...grids];
  }, [sections]);

  const ListHeader = (
    <>
      {/* Hero with back button */}
      <View style={styles.hero}>
        <Image source={hero} style={styles.heroImg} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Title + description */}
      <View style={styles.bodyWrap}>
        <Text style={styles.title}>{title} Preparedness</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
    </>
  );

  const renderSection = ({ item }) => {
    if (item.type === "reasons") {
      return (
        <View style={styles.bodyWrap}>
          <Text style={styles.h2}>Why {title} Happen</Text>
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
              />
            )}
          />
        </View>
      );
    }
    if (item.type === "stats") {
      return (
        <View style={styles.bodyWrap}>
          <Text style={styles.h2}>Quick Facts (Stats)</Text>
          <View style={styles.statsCard}>
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
      return <SectionGrid section={item.section} />;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F6F6" },

  // Hero
  hero: { height: 170, backgroundColor: "#E8EEF8" },
  heroImg: { width: SCREEN_WIDTH, height: "100%", resizeMode: "cover" },
  backBtn: {
    position: "absolute",
    left: 12,
    top: 12,
    height: 36,
    width: 36,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  bodyWrap: { paddingHorizontal: H_PADDING, paddingTop: 12 },

  title: { fontSize: 20, fontWeight: "800", color: "#111" },
  desc: { marginTop: 6, color: "#5F6D7E", lineHeight: 20 },

  h2: {
    marginTop: 5,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },

  edgeToEdge: { marginHorizontal: -H_PADDING },

  // Reason card
  reasonCard: {
    width: 90,
    backgroundColor: "#fff",
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
    color: "#111",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 16,
  },

  // Stats
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: CARD_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  // Grid tiles
  tileCard: {
    backgroundColor: "#fff",
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
    color: "#111",
    textAlign: "center",
  },

  // Modal
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  modalBody: {
    color: "#5F6D7E",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  modalBtn: {
    backgroundColor: "#0A84FF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
