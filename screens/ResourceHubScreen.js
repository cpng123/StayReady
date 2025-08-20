import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PREPAREDNESS } from "../data/homeData";
import ImageOverlayCard from "../components/ImageOverlayCard";

const SCREEN_PADDING = 16;
const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - SCREEN_PADDING * 2 - GAP) / 2);

export default function ResourceHubScreen({ navigation }) {
  const Header = (
    <View style={styles.headerCopy}>
      <Text style={styles.h1}>Resource Hub</Text>
      <Text style={styles.p}>
        Stay Ready for anything — explore guides, tips, and contacts to prepare
        for disasters, respond to emergencies, and stay safe in any situation.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top hero (single image, no carousel) */}
      <View style={styles.hero}>
        <Image
          source={require("../assets/General/resource-hub.jpg")}
          style={styles.heroImg}
        />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Grid (2 columns) */}
      <FlatList
        data={PREPAREDNESS}
        keyExtractor={(i) => i.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={Header}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: 18 }}
        renderItem={({ item }) => (
          <ImageOverlayCard
            title={item.title}
            source={item.img}
            width={CARD_WIDTH}
            height={120}
            style={{ marginBottom: GAP }}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F6F6" },

  hero: {
    height: 180,
    backgroundColor: "#e7eef8",
  },
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

  headerCopy: { paddingTop: 14, paddingBottom: 8 },
  h1: { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 6 },
  p: { color: "#5F6D7E", lineHeight: 20, marginBottom: 8 },
});
