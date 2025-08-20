// screens/PreparednessGuideScreen.js
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getGuideById } from "../data/preparednessGuides";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ---- Small card used in the horizontal "reasons" list ----
function ReasonCard({ icon, label }) {
  return (
    <View style={styles.reasonCard}>
      <View style={styles.reasonIconWrap}>
        {/* icon is a static require() number */}
        <Image
          source={icon}
          style={{ width: 28, height: 28, resizeMode: "contain" }}
        />
      </View>
      <Text style={styles.reasonText} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export default function PreparednessGuideScreen({ navigation, route }) {
  const guide = getGuideById(route?.params?.id) || getGuideById("flood");
  const { title, description, hero, reasons } = guide;

  // Hard-coded stats (12 bars)
  const STATS = [3, 4, 5, 10, 2, 9, 3, 6, 4, 7, 5, 13];
  const maxVal = Math.max(...STATS);
  const BAR_HEIGHT = 120;

  return (
    <SafeAreaView style={styles.safe}>
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

        {/* Why it happens */}
        <Text style={styles.h2}>Why {title} Happen</Text>
        <FlatList
          data={reasons}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 6 }}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          renderItem={({ item }) => (
            <ReasonCard icon={item.icon} label={item.label} />
          )}
        />

        {/* Quick facts (simple bar chart) */}
        <Text style={[styles.h2, { marginTop: 12 }]}>Quick Facts (Stats)</Text>
        <View style={styles.statsCard}>
          <View style={styles.chartRow}>
            {STATS.map((v, idx) => {
              const h = Math.max(8, (v / maxVal) * BAR_HEIGHT);
              return <View key={idx} style={[styles.bar, { height: h }]} />;
            })}
          </View>
          <View style={styles.chartBaseline} />
        </View>

        {/* Prepare Before (placeholder) */}
        <Text style={[styles.h2, { marginTop: 14 }]}>Prepare Before</Text>
        <Text style={styles.placeholder}>
          (We’ll add the card grid here in the next step.)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F6F6" },

  hero: {
    height: 170,
    backgroundColor: "#E8EEF8",
  },
  heroImg: {
    width: SCREEN_WIDTH,
    height: "100%",
    resizeMode: "cover",
  },
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

  bodyWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#111" },
  desc: { marginTop: 6, color: "#5F6D7E", lineHeight: 20 },

  h2: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },

  // Reasons
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
  reasonIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  reasonText: {
    textAlign: "center",
    color: "#111",
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 16,
  },

  // Stats card
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
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 130,
    paddingHorizontal: 6,
  },
  bar: {
    width: 12,
    borderRadius: 6,
    backgroundColor: "#0A84FF",
  },
  chartBaseline: {
    marginTop: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E8ECF5",
  },

  placeholder: { color: "#6B7788" },
});
