// screens/HomeScreen.js
import React, { useState, useMemo, useEffect } from "react";
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
import { CONTACTS, getHomeWarnings } from "../data/homeData";
import { useNavigation } from "@react-navigation/native";
import WarningCard from "../components/WarningCard";
import ImageOverlayCard from "../components/ImageOverlayCard";
import { PREPAREDNESS, getHomePreparedness, ROUTINE } from "../data/homeData";
import ConfirmModal from "../components/ConfirmModal";
import { useThemeContext } from "../theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { resolveLocationLabel } from "../utils/locationService";
import { useTranslation } from "react-i18next";

const HOME_PREPAREDNESS = getHomePreparedness(4);
const HOME_WARNINGS = getHomeWarnings(4);
const UNICEF_URL =
  "https://help.unicef.org/?country=SG&&campaignid=20648257412&gad_source=1&gad_campaignid=20642170995&gbraid=0AAAAADCOMi5mkgs50IleVtR5hH2KuG99d&gclid=Cj0KCQjwwZDFBhCpARIsAB95qO1fDQ_3Zci8KlH2BnokWscSyGWcXPp0eIsVwbqGRySaNc0yEdvi0pEaAjXdEALw_wcB&gclsrc=aw.ds";

export default function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Dynamic header location label
  const [headerLoc, setHeaderLoc] = useState(
    t("settings.country_sg", "Singapore")
  );
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await resolveLocationLabel();
        const country = t("settings.country_sg", "Singapore");
        const regionName = t(
          `location.region_names.${String(res.region || "").toLowerCase()}`,
          res.region
        );
        const label = res.address
          ? `${res.address}${res.postal ? " " + res.postal : ""}, ${country}`
          : `${regionName} ${t("home.region", "Region")}, ${country}`;
        if (mounted) setHeaderLoc(label);
      } catch {
        if (mounted) setHeaderLoc(t("settings.country_sg", "Singapore"));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [t]);

  const openDonation = async () => {
    try {
      const supported = await Linking.canOpenURL(UNICEF_URL);
      if (supported) await Linking.openURL(UNICEF_URL);
      else Alert.alert(t("common.error"), t("home.donate.error_try_later"));
    } catch {
      Alert.alert(t("common.error"), t("home.donate.error_open"));
    }
  };

  const [confirm, setConfirm] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const openConfirm = (title, message, onConfirm) =>
    setConfirm({ visible: true, title, message, onConfirm });

  const closeConfirm = () => setConfirm((c) => ({ ...c, visible: false }));

  const dialNumber = async (num) => {
    const url = `tel:${num}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else
        Alert.alert(t("common.not_supported"), t("home.call_manual", { num }));
    } catch {
      Alert.alert(t("common.error"), t("home.dial_error"));
    }
  };

  const handleContactPress = (item) => {
    if (item.id === "sos") {
      navigation.navigate("SOSTab");
    } else {
      openConfirm(
        t("home.confirm_call_title", { title: item.title }),
        t("home.confirm_call_body", { number: item.number }),
        () => {
          closeConfirm();
          dialNumber(item.number);
        }
      );
    }
  };

  const renderContact = ({ item }) => {
    // Translate titles/subtitles by id, with English fallback from data file
    const tTitle = t(`home.contacts.card.${item.id}.title`, item.title);
    const tSub = t(`home.contacts.card.${item.id}.subtitle`, item.subtitle);

    return (
      <TouchableOpacity
        style={styles.contactCard}
        activeOpacity={0.85}
        onPress={() => handleContactPress(item)}
      >
        <Image source={item.img} style={styles.contactIcon} />
        <View style={styles.contactTexts}>
          <Text style={styles.contactTitle}>{tTitle}</Text>
          <Text style={styles.contactSub} numberOfLines={2}>
            {tSub}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.locationWrap}>
            <Ionicons
              name="location-outline"
              size={22}
              color={theme.colors.primary}
            />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.subtle}>{t("home.your_location")}</Text>
              <Text style={styles.locationText}>{headerLoc}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: theme.key === "dark" ? "#1F2937" : "#EAF2FF" },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Donation */}
        <View style={styles.donateCard}>
          <Image
            source={require("../assets/General/donation.jpg")}
            style={styles.donateImage}
            resizeMode="cover"
          />
          {theme.key === "dark" && (
            <LinearGradient
              colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.donateGradient}
              pointerEvents="none"
            />
          )}
          <View style={styles.donateOverlay}>
            <Text style={styles.donateTitle}>{t("home.donate.title")}</Text>
            <TouchableOpacity
              style={styles.donateBtn}
              activeOpacity={0.8}
              onPress={openDonation}
            >
              <Text style={styles.donateBtnText}>{t("home.donate.cta")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>
          {t("home.section.emergencies_info")}
        </Text>

        {/* Map Card */}
        <View style={styles.mapCard}>
          <View style={styles.mapCanvas}>
            <MaterialIcons
              name="map"
              size={40}
              color={theme.key === "dark" ? "#9CA3AF" : "#8AA0C8"}
            />
            <Text style={styles.mapPlaceholderText}>
              {t("home.map.placeholder")}
            </Text>
          </View>
          <Ionicons
            name="location-sharp"
            size={22}
            color={theme.colors.danger}
            style={styles.mapPin}
          />
          <View style={styles.hazardBanner}>
            <Ionicons name="shield-checkmark" size={34} color="#fff" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.hazardTitle}>{t("home.hazard.none")}</Text>
              <Text style={styles.hazardSubtitle}>
                {t("home.hazard.slogan")}
              </Text>
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle2}>{t("home.contacts.title")}</Text>
        </View>
        <Text style={styles.sectionNote}>{t("home.contacts.note")}</Text>

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

        {/* Early Warning */}
        <View style={styles.ewHeaderRow}>
          <View style={styles.ewHeaderLeft}>
            <Text style={styles.sectionTitle2}>{t("home.early.title")}</Text>
            <Text style={styles.sectionSubtitle}>
              {t("home.early.subtitle")}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("EarlyWarning")}
          >
            <Text style={styles.seeMore}>{t("home.see_more")}</Text>
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

        {/* Disaster Preparedness */}
        <View style={styles.ewHeaderRow}>
          <View style={styles.ewHeaderLeft}>
            <Text style={styles.sectionTitle2}>{t("home.prep.title")}</Text>
            <Text style={styles.sectionSubtitle}>
              {t("home.prep.subtitle")}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ResourceTab")}
          >
            <Text style={styles.seeMore}>{t("home.see_more")}</Text>
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
            <ImageOverlayCard
              title={t(`home.prep.topic.${item.id}`, item.title)}
              source={item.img}
              onPress={() =>
                navigation.navigate("PreparednessGuide", { id: item.id })
              }
            />
          )}
        />

        {/* Routine Preparations */}
        <View style={{ height: 6 }} />
        <View style={styles.ewHeaderRow}>
          <View style={styles.ewHeaderLeft}>
            <Text style={styles.sectionTitle2}>{t("home.routine.title")}</Text>
            <Text style={styles.sectionSubtitle}>
              {t("home.routine.subtitle")}
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
          renderItem={({ item }) => {
            const key =
              item.id === "routine-checklist"
                ? "home.routine.card.checklist"
                : item.id === "routine-external"
                ? "home.routine.card.external"
                : "home.routine.card.quiz";
            return (
              <ImageOverlayCard
                title={t(key, item.title)}
                source={item.img}
                onPress={() => {
                  if (item.id === "routine-external") {
                    navigation.navigate("ExternalResources");
                  } else if (item.id === "routine-quiz")
                    navigation.navigate("GamesTab");
                  else if (item.id === "routine-checklist")
                    navigation.navigate("Checklist");
                }}
                testID={`routine-card-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={t(key, item.title)}
              />
            );
          }}
        />

        <View style={{ height: 20 }} />
      </ScrollView>

      <ConfirmModal
        visible={confirm.visible}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={t("common.proceed", "Proceed")}
        cancelLabel={t("common.cancel", "Cancel")}
        onCancel={closeConfirm}
        onConfirm={confirm.onConfirm}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.appBg },
    content: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 40 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    locationWrap: { flexDirection: "row", alignItems: "center" },
    subtle: { fontSize: 12, color: theme.colors.subtext },
    locationText: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
    iconBtn: {
      height: 36,
      width: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    donateCard: {
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 6,
      backgroundColor: theme.colors.card,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 3,
    },
    donateImage: { width: "100%", height: 160 },
    donateGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
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
      color: theme.colors.text,
      lineHeight: 22,
    },
    donateBtn: {
      alignSelf: "flex-start",
      paddingHorizontal: 28,
      paddingVertical: 10,
      backgroundColor: theme.colors.primary,
      borderRadius: 15,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 2,
    },
    donateBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.colors.text,
      marginTop: 18,
      marginBottom: 10,
    },
    sectionHeader: {
      marginBottom: 2,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    sectionTitle2: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.colors.text,
    },
    sectionNote: { color: theme.colors.subtext, fontSize: 12, marginBottom: 5 },
    sectionSubtitle: { color: theme.colors.subtext, fontSize: 12 },
    seeMore: { color: theme.colors.primary, fontWeight: "700" },
    edgeToEdge: { marginHorizontal: -16 },
    ewHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      marginBottom: 6,
    },
    ewHeaderLeft: { flexShrink: 1 },
    mapCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
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
      backgroundColor: theme.key === "dark" ? "#1F2937" : "#E6EEF9",
      alignItems: "center",
      justifyContent: "center",
    },
    mapPlaceholderText: { marginTop: 6, color: theme.colors.subtext },
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
      backgroundColor: theme.colors.success,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 2,
    },
    hazardTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
    hazardSubtitle: { color: "#E9FFF1", fontSize: 12, marginTop: 2 },
    contactCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 8,
      elevation: 2,
    },
    contactIcon: {
      width: 44,
      height: 44,
      resizeMode: "contain",
      marginRight: 12,
    },
    contactTexts: { flex: 1, alignItems: "center", justifyContent: "center" },
    contactTitle: {
      fontSize: 24,
      fontWeight: "600",
      color: theme.colors.text,
      lineHeight: 24,
      textAlign: "center",
    },
    contactSub: {
      fontSize: 12,
      lineHeight: 14,
      color: theme.colors.subtext,
      textAlign: "center",
    },
  });
