import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Linking,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { CONTACTS, WARNINGS, getHomeWarnings } from "../data/homeData";
import { useNavigation } from "@react-navigation/native";
import WarningCard from "../components/WarningCard";
import ImageOverlayCard from "../components/ImageOverlayCard";
import { PREPAREDNESS, getHomePreparedness, ROUTINE } from "../data/homeData";

const HOME_PREPAREDNESS = getHomePreparedness(4);
const HOME_WARNINGS = getHomeWarnings(4);
const UNICEF_URL =
  "https://help.unicef.org/?country=SG&&campaignid=20648257412&gad_source=1&gad_campaignid=20642170995&gbraid=0AAAAADCOMi5mkgs50IleVtR5hH2KuG99d&gclid=Cj0KCQjwwZDFBhCpARIsAB95qO1fDQ_3Zci8KlH2BnokWscSyGWcXPp0eIsVwbqGRySaNc0yEdvi0pEaAjXdEALw_wcB&gclsrc=aw.ds";

export default function HomeScreen() {
  const navigation = useNavigation();

  const openDonation = async () => {
    try {
      const supported = await Linking.canOpenURL(UNICEF_URL);
      if (supported) await Linking.openURL(UNICEF_URL);
      else Alert.alert("Unable to open link", "Please try again later.");
    } catch (e) {
      Alert.alert("Link error", "Could not open the donation page.");
    }
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactCard}>
      {/* Left: big icon */}
      <Image source={item.img} style={styles.contactIcon} />

      {/* Right: title + subtitle */}
      <View style={styles.contactTexts}>
        <Text style={styles.contactTitle}>{item.title}</Text>
        <Text style={styles.contactSub} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== Top Bar: Location + Bell ===== */}
        <View style={styles.topBar}>
          <View style={styles.locationWrap}>
            <Ionicons name="location-outline" size={22} color="#0A84FF" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.subtle}>Your Location</Text>
              <Text style={styles.locationText}>Commonwealth, Singapore</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color="#0A84FF" />
          </TouchableOpacity>
        </View>

        {/* ===== Donation Banner Card ===== */}
        <View style={styles.donateCard}>
          <Image
            source={require("../assets/General/donation.jpg")}
            style={styles.donateImage}
            resizeMode="cover"
          />
          <View style={styles.donateOverlay}>
            <Text style={styles.donateTitle}>
              When Seconds{"\n"}Matters, So Does{"\n"}Your Support
            </Text>

            <TouchableOpacity
              style={styles.donateBtn}
              activeOpacity={0.8}
              onPress={openDonation}
            >
              <Text style={styles.donateBtnText}>Donate Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Section Title ===== */}
        <Text style={styles.sectionTitle}>Emergencies Information</Text>

        {/* ===== Map Card (hard-coded placeholder) ===== */}
        <View style={styles.mapCard}>
          <View style={styles.mapCanvas}>
            <MaterialIcons name="map" size={40} color="#8AA0C8" />
            <Text style={styles.mapPlaceholderText}>
              Singapore Map (static)
            </Text>
          </View>
          <Ionicons
            name="location-sharp"
            size={22}
            color="#E74C3C"
            style={styles.mapPin}
          />
          <View style={styles.hazardBanner}>
            <Ionicons name="shield-checkmark" size={34} color="#fff" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.hazardTitle}>No Hazards Detected</Text>
              <Text style={styles.hazardSubtitle}>Stay Alert, Stay Safe</Text>
            </View>
          </View>
        </View>

        {/* ===== Emergency Contacts (Horizontal) ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle2}>Emergency Contacts</Text>
        </View>
        <Text style={styles.sectionNote}>
          Call these numbers during a disaster or emergency only.
        </Text>

        <FlatList
          data={CONTACTS}
          keyExtractor={(i) => i.id}
          renderItem={renderContact}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.edgeToEdge}
          contentContainerStyle={{ paddingVertical: 5, paddingHorizontal: 15 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />

        {/* ===== Early Warning (Horizontal) ===== */}
        <View style={styles.ewHeaderRow}>
          <View style={styles.ewHeaderLeft}>
            <Text style={styles.sectionTitle2}>Early Warning</Text>
            <Text style={styles.sectionSubtitle}>
              Monitoring common hazards
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("EarlyWarning")}
          >
            <Text style={styles.seeMore}>See More</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={HOME_WARNINGS}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.edgeToEdge}
          contentContainerStyle={{ paddingVertical: 5, paddingHorizontal: 15 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <WarningCard item={item} width={200} imageHeight={120} />
          )}
        />

        {/* ===== Disaster Preparedness (Horizontal) ===== */}
        <View style={styles.ewHeaderRow}>
          <View style={styles.ewHeaderLeft}>
            <Text style={styles.sectionTitle2}>Disaster Preparedness</Text>
            <Text style={styles.sectionSubtitle}>
              Learn safety tips for any emergency.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ResourceHub")}
          >
            <Text style={styles.seeMore}>See More</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={HOME_PREPAREDNESS}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.edgeToEdge}
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 15 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <ImageOverlayCard title={item.title} source={item.img} />
          )}
        />

        {/* ===== Routine Preparations (Horizontal) ===== */}
        <View style={{ height: 6 }} />

        <View style={styles.ewHeaderRow}>
          <View style={styles.ewHeaderLeft}>
            <Text style={styles.sectionTitle2}>Routine Preparations</Text>
            <Text style={styles.sectionSubtitle}>
              Build daily readiness to keep you and your family safe.
            </Text>
          </View>
        </View>

        <FlatList
          data={ROUTINE}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.edgeToEdge}
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 15 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <ImageOverlayCard title={item.title} source={item.img} />
          )}
        />

        {/* spacing bottom */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  content: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 40 },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  locationWrap: { flexDirection: "row", alignItems: "center" },
  subtle: { fontSize: 12, color: "#7C8795" },
  locationText: { fontSize: 15, fontWeight: "700", color: "#111" },
  iconBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
  },

  // Donation card
  donateCard: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    marginTop: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  donateImage: { width: "100%", height: 160 },
  donateOverlay: {
    position: "absolute",
    left: 20,
    top: 18,
    right: 14,
    bottom: 16,
    justifyContent: "space-between",
  },
  donateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 22,
  },
  donateBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 28,
    paddingVertical: 10,
    backgroundColor: "#0A84FF",
    borderRadius: 15,
    shadowColor: "#0A84FF",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  donateBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  // Section headers
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeader: {
    marginBottom: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionTitle2: { fontSize: 18, fontWeight: "800", color: "#111" },
  sectionNote: { color: "#6B7788", fontSize: 12, marginBottom: 5 },
  sectionSubtitle: { color: "#6B7788", fontSize: 12 },
  seeMore: { color: "#0A84FF", fontWeight: "700" },
  edgeToEdge: { marginHorizontal: -16 },

  // Map card (static)
  mapCard: {
    backgroundColor: "#fff",
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  mapCanvas: {
    height: 200,
    backgroundColor: "#E6EEF9",
    alignItems: "center",
    justifyContent: "center",
  },
  mapPlaceholderText: { marginTop: 6, color: "#6C7A92" },
  mapPin: { position: "absolute", top: 12, right: 12 },
  hazardBanner: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#03A55A",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  hazardTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
  hazardSubtitle: { color: "#E9FFF1", fontSize: 12, marginTop: 2 },

  // Make the card a horizontal row
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },

  // Big icon on left
  contactIcon: {
    width: 52,
    height: 52,
    resizeMode: "contain",
    marginRight: 12,
  },

  // Right column takes remaining space
  contactTexts: {
    flex: 1,
    alignItems: "center", // center horizontally within right portion
    justifyContent: "center", // center vertically within right portion
  },

  // Title + subtitle stacked, centered vertically
  contactTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#111",
    lineHeight: 28,
    textAlign: "center",
  },
  contactSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 14,
    color: "#637083",
    textAlign: "center",
  },

  // Early Warning
  ewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 6,
  },
  ewHeaderLeft: {
    flexShrink: 1,
  },

  // Warning cards
  warnCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  warnImg: { width: "100%", height: 120 },
  levelBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  warnBody: { padding: 12 },
  warnTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 6,
  },
  warnDesc: { color: "#5E6A7D", fontSize: 12, lineHeight: 16 },
  warnTime: {
    marginTop: 8,
    color: "#A1AAB6",
    fontSize: 11,
    textAlign: "right",
  },
});
