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
import { getNotificationsEnabled, setNotificationsEnabled, initNotifications } from "../utils/notify";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeContext } from "../theme/ThemeProvider";
import TopBar from "../components/TopBar";
import ThemeToggle from "../components/ThemeToggle";
import ConfirmModal from "../components/ConfirmModal";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../i18n";
import { clearCache, resetAll } from "../utils/storage";

import { KEYS } from "../utils/storage";
const K_LANG = KEYS.PREF_LANG;
const K_SFX = KEYS.PREF_SFX;
const K_HAPTIC = KEYS.PREF_HAPTICS;

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

  // new confirm modals for data actions
  const [clearOpen, setClearOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  /* load persisted values */
  useEffect(() => {
    (async () => {
      try {
        const [l, sfx, hap, notifEnabled] = await Promise.all([
          AsyncStorage.getItem(K_LANG),
          AsyncStorage.getItem(K_SFX),
          AsyncStorage.getItem(K_HAPTIC),
          getNotificationsEnabled(),
        ]);

        // language
        const savedLang = (l || i18n.language || "en").split("-")[0];
        setLanguage(savedLang);
        setTempLanguage(savedLang);
        if (savedLang !== i18n.language) {
          await setAppLanguage(savedLang);
        }

        setNotif(!!notifEnabled);
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
    (async () => {
      await setNotificationsEnabled(notif); // writes notify:enabled & cancels scheduled when OFF
      if (notif) {
        // make sure channel/permission exists when turning ON
        await initNotifications();
      }
    })();
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
      <TopBar
        title={t("settings.title", "Settings")}
        onBack={() => nav.goBack()}
      />

      {/* SCROLLABLE PAGE CONTENT */}
      <ScrollView contentContainerStyle={s.content}>
        <SectionTitle>
          {t("settings.pref_controls", "Preferences & Controls")}
        </SectionTitle>

        <Row
          icon={
            <Ionicons name="language" size={18} color={theme.colors.text} />
          }
          label={t("settings.language", "Language")}
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
          label={t("settings.theme", "Theme")}
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
          label={t("settings.notifications", "Notifications")}
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
          label={t("settings.sound", "Sound effects")}
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
          label={t("settings.vibration", "Haptics")}
          right={<Switch value={vibration} onValueChange={setVibration} />}
        />

        {/* ---------------- Preparedness-specific settings ---------------- */}
        <SectionTitle>
          {t(
            "settings.preparedness_settings",
            "Preparedness-specific Settings"
          )}
        </SectionTitle>

        <Row
          icon={
            <Ionicons
              name="location-outline"
              size={18}
              color={theme.colors.text}
            />
          }
          label={t("settings.location", "Location")}
          onPress={() => nav.navigate("LocationSettings")}
          right={
            <View style={s.rightInline}>
              <Text style={[s.rightText, { color: theme.colors.subtext }]}>
                {t("settings.country_sg", "Singapore")}
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
          label={t("settings.emergency_contacts_setup", "Emergency Contacts")}
          onPress={() => nav.navigate("EmergencyContacts")}
          right={
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.subtext}
            />
          }
        />

        {/* ---------------- Data management (replaces account settings) ---------------- */}
        <SectionTitle>
          {t("settings.data_management", "Data Management")}
        </SectionTitle>

        <Row
          icon={
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={theme.colors.text}
            />
          }
          label={t("settings.clear_cache", "Clear cache")}
          onPress={() => setClearOpen(true)}
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
              name="alert-circle-outline"
              size={20}
              color={theme.colors.text}
            />
          }
          label={t("settings.reset_all", "Reset all data")}
          onPress={() => setResetOpen(true)}
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

      {/* Language modal (unchanged except Done flow) */}
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
              {t("settings.choose_language", "Choose language")}
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
                setLanguage(tempLanguage);
                await setAppLanguage(tempLanguage);
                setLangOpen(false);
              }}
            >
              <Text style={s.modalBtnText}>{t("settings.done", "Done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Theme modal */}
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
              {t("settings.theme", "Theme")}
            </Text>
            <View style={{ marginTop: 6 }}>
              <ThemeToggle />
            </View>
            <TouchableOpacity
              style={[s.modalBtn, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.9}
              onPress={() => setThemeOpen(false)}
            >
              <Text style={s.modalBtnText}>{t("settings.done", "Done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ Confirm clear cache */}
      <ConfirmModal
        visible={clearOpen}
        title={t("settings.clear_cache_title", "Clear cache?")}
        message={t(
          "settings.clear_cache_msg",
          "This will remove temporary data like images, prefetches, and cached lookups. Your bookmarks and preferences will remain."
        )}
        confirmLabel={t("settings.clear", "Clear")}
        cancelLabel={t("common.cancel", "Cancel")}
        onConfirm={async () => {
          try {
            await clearCache();
          } catch {}
          setClearOpen(false);
        }}
        onCancel={() => setClearOpen(false)}
      />

      {/* ✅ Confirm reset all */}
      <ConfirmModal
        visible={resetOpen}
        title={t("settings.reset_all_title", "Reset all data?")}
        message={t(
          "settings.reset_all_msg",
          "This will delete ALL local data: bookmarks, quiz history, preferences, and caches. This cannot be undone."
        )}
        confirmLabel={t("settings.reset", "Reset")}
        cancelLabel={t("common.cancel", "Cancel")}
        onConfirm={async () => {
          try {
            await resetAll();
          } catch {}
          setResetOpen(false);
        }}
        onCancel={() => setResetOpen(false)}
      />
    </SafeAreaView>
  );
}

/* ----------------------------- styles ----------------------------- */

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    content: { padding: 14, gap: 10, marginTop: -10 },

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
      alignSelf: "stretch",
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
