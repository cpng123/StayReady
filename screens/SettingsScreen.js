import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
  ScrollView,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeContext } from "../theme/ThemeProvider";
import TopBar from "../components/TopBar";
import ThemeToggle from "../components/ThemeToggle";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../i18n";

/* ----------------------- storage keys ----------------------- */
const K_LANG = "pref:language";
const K_NOTIF = "pref:notificationsEnabled";
const K_SFX = "pref:sfxEnabled";
const K_HAPTIC = "pref:hapticsEnabled";

/* Simple language list for the demo */
const LANGS = [
  { id: "en", label: "English" },
  { id: "zh", label: "中文 (Chinese)" },
  { id: "ms", label: "Bahasa Melayu" },
  { id: "ta", label: "தமிழ் (Tamil)" },
];

export default function SettingsScreen() {
  const nav = useNavigation();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { t, i18n } = useTranslation();

  // prefs
  const [language, setLanguage] = useState(
    i18n.language?.split("-")[0] || "en"
  );
  const [notif, setNotif] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);

  // modals
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [tempLanguage, setTempLanguage] = useState(language); // for the modal "Done" flow

  /* load persisted values */
  useEffect(() => {
    (async () => {
      try {
        const [l, n, sfx, hap] = await Promise.all([
          AsyncStorage.getItem(K_LANG),
          AsyncStorage.getItem(K_NOTIF),
          AsyncStorage.getItem(K_SFX),
          AsyncStorage.getItem(K_HAPTIC),
        ]);

        // language
        const savedLang = (l || i18n.language || "en").split("-")[0];
        setLanguage(savedLang);
        setTempLanguage(savedLang);
        if (savedLang !== i18n.language) {
          await setAppLanguage(savedLang);
        }

        if (n != null) setNotif(n === "1");
        if (sfx != null) setSound(sfx === "1");
        if (hap != null) setVibration(hap === "1");
      } catch {}
    })();
  }, [i18n]);

  /* persist on change */
  useEffect(() => {
    AsyncStorage.setItem(K_LANG, language).catch(() => {});
  }, [language]);
  useEffect(() => {
    AsyncStorage.setItem(K_NOTIF, notif ? "1" : "0").catch(() => {});
  }, [notif]);
  useEffect(() => {
    AsyncStorage.setItem(K_SFX, sound ? "1" : "0").catch(() => {});
  }, [sound]);
  useEffect(() => {
    AsyncStorage.setItem(K_HAPTIC, vibration ? "1" : "0").catch(() => {});
  }, [vibration]);

  /* rows */
  const Row = ({ icon, label, right, onPress, disabled }) => (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[s.row, { backgroundColor: theme.colors.card }]}
    >
      <View style={s.rowLeft}>
        {icon}
        <Text style={[s.rowLabel, { color: theme.colors.text }]}>{label}</Text>
      </View>
      <View style={s.rowRight}>{right}</View>
    </TouchableOpacity>
  );

  const SectionTitle = ({ children }) => (
    <Text style={[s.sectionTitle, { color: theme.colors.text }]}>
      {children}
    </Text>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.appBg }]}>
      <TopBar title={t("settings.title")} onBack={() => nav.goBack()} />

      {/* SCROLLABLE PAGE CONTENT */}
      <ScrollView contentContainerStyle={s.content}>
        {/* profile card */}
        <View style={[s.profileCard, { backgroundColor: theme.colors.card }]}>
          <View style={s.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={[s.profileName, { color: theme.colors.text }]}>
              Tester
            </Text>
            <Text style={[s.profileEmail, { color: theme.colors.subtext }]}>
              example123@gmail.com
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.subtext}
          />
        </View>

        <SectionTitle>{t("settings.pref_controls")}</SectionTitle>

        <Row
          icon={
            <Ionicons name="language" size={18} color={theme.colors.text} />
          }
          label={t("settings.language")}
          onPress={() => {
            setTempLanguage(language);
            setLangOpen(true);
          }}
          right={
            <View style={s.rightInline}>
              <Text style={[s.rightText, { color: theme.colors.subtext }]}>
                {LANGS.find((l) => l.id === language)?.label || "English"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.subtext}
              />
            </View>
          }
        />

        <Row
          icon={
            <Ionicons
              name="color-palette-outline"
              size={18}
              color={theme.colors.text}
            />
          }
          label={t("settings.theme")}
          onPress={() => setThemeOpen(true)}
          right={
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.subtext}
            />
          }
        />

        <Row
          icon={
            <Ionicons
              name="notifications-outline"
              size={18}
              color={theme.colors.text}
            />
          }
          label={t("settings.notifications")}
          right={<Switch value={notif} onValueChange={setNotif} />}
        />

        <Row
          icon={
            <Ionicons
              name="volume-high-outline"
              size={18}
              color={theme.colors.text}
            />
          }
          label={t("settings.sound")}
          right={<Switch value={sound} onValueChange={setSound} />}
        />

        <Row
          icon={
            <MaterialCommunityIcons
              name="vibrate"
              size={20}
              color={theme.colors.text}
            />
          }
          label={t("settings.vibration")}
          right={<Switch value={vibration} onValueChange={setVibration} />}
        />

        <SectionTitle>{t("settings.preparedness_settings")}</SectionTitle>

        <Row
          icon={
            <Ionicons
              name="location-outline"
              size={18}
              color={theme.colors.text}
            />
          }
          label={t("settings.location")}
          onPress={() => nav.navigate("LocationSettings")}
          right={
            <View style={s.rightInline}>
              <Text style={[s.rightText, { color: theme.colors.subtext }]}>
                {t("settings.country_sg")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.subtext}
              />
            </View>
          }
        />

        <Row
          icon={
            <Ionicons name="call-outline" size={18} color={theme.colors.text} />
          }
          label={t("settings.emergency_contacts_setup")}
          onPress={() => nav.navigate("EmergencyContacts")}
          right={
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.subtext}
            />
          }
        />

        <SectionTitle>{t("settings.account_settings")}</SectionTitle>

        <Row
          icon={
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={theme.colors.text}
            />
          }
          label={t("settings.change_password")}
          onPress={() => nav.navigate("ChangePassword")}
          right={
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.subtext}
            />
          }
        />

        <Row
          icon={
            <Ionicons
              name="log-out-outline"
              size={18}
              color={theme.colors.text}
            />
          }
          label={t("settings.logout")}
          onPress={() => nav.navigate("Logout")}
          right={
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.subtext}
            />
          }
        />

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Language modal WITH Done button */}
      <Modal
        visible={langOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setLangOpen(false)} />
        <View style={s.modalCenter} pointerEvents="box-none">
          <View style={[s.modalCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[s.modalTitle, { color: theme.colors.text }]}>
              {t("settings.choose_language")}
            </Text>

            <FlatList
              data={LANGS}
              keyExtractor={(x) => x.id}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => {
                const active = item.id === tempLanguage;
                return (
                  <TouchableOpacity
                    style={[
                      s.langRow,
                      {
                        borderColor: active
                          ? theme.colors.primary
                          : "transparent",
                        backgroundColor:
                          theme.key === "dark" ? "#111418" : "#F3F4F6",
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setTempLanguage(item.id)}
                  >
                    <Text
                      style={[
                        s.langLabel,
                        {
                          color: active
                            ? theme.colors.primary
                            : theme.colors.text,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingTop: 8 }}
            />

            <TouchableOpacity
              style={[s.modalBtn, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.9}
              onPress={async () => {
                // Persist + apply globally
                setLanguage(tempLanguage);
                await setAppLanguage(tempLanguage);
                setLangOpen(false);
              }}
            >
              <Text style={s.modalBtnText}>{t("settings.done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Theme modal (unchanged) */}
      <Modal
        visible={themeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeOpen(false)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setThemeOpen(false)}
        />
        <View style={s.modalCenter} pointerEvents="box-none">
          <View style={[s.modalCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[s.modalTitle, { color: theme.colors.text }]}>
              {t("settings.theme")}
            </Text>
            <View style={{ marginTop: 6 }}>
              <ThemeToggle />
            </View>
            <TouchableOpacity
              style={[s.modalBtn, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.9}
              onPress={() => setThemeOpen(false)}
            >
              <Text style={s.modalBtnText}>{t("settings.done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ----------------------------- styles ----------------------------- */

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    content: { padding: 14, gap: 10 },

    /* profile */
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      padding: 12,
      gap: 12,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#F59E0B",
    },
    profileName: { fontSize: 16, fontWeight: "900" },
    profileEmail: { fontSize: 12, fontWeight: "600" },

    /* sections */
    sectionTitle: {
      marginTop: 8,
      marginBottom: 2,
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 0.2,
    },

    /* rows */
    row: {
      minHeight: 52,
      borderRadius: 12,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    rowLabel: { fontWeight: "800", fontSize: 14 },
    rightInline: { flexDirection: "row", alignItems: "center", gap: 6 },
    rightText: { fontSize: 12, fontWeight: "800" },

    /* modals */
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    modalCenter: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      borderRadius: 16,
      padding: 14,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    modalTitle: {
      fontWeight: "900",
      fontSize: 18,
      marginBottom: 6,
      textAlign: "center",
    },
    modalBtn: {
      marginTop: 10,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      alignSelf: "stretch", // full width
    },
    modalBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },

    /* language list rows */
    langRow: {
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1.5,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    langLabel: { fontWeight: "800" },
  });
