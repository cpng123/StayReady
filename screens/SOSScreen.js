/**
 * SOSScreen
 * -----------------------------------------------------------------------------
 * A high-visibility SOS activator that uses sound, vibration, and flashlight
 * strobing to attract attention and optionally dispatches messages to saved
 * emergency contacts.
 */

import React, { useRef, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../theme/ThemeProvider";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import { getContacts, dispatchEmergency } from "../utils/emergencyContacts";
import { useNavigation } from "@react-navigation/native";
import ConfirmModal from "../components/ConfirmModal";
import { useTranslation } from "react-i18next";

export default function SOSScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeContext();
  const isDark = theme.key === "dark";
  const { t } = useTranslation();

  // Alarm state
  const soundRef = useRef(null); // looping siren sound instance
  const [active, setActive] = useState(false); // UI state: SOS on/off

  // mirror `active` in a ref so delayed callbacks see fresh value
  const activeRef = useRef(false);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // single-dispatch guard + delayed send timer
  const sendTimerRef = useRef(null);
  const sentOnceRef = useRef(false);

  // Flashlight / Camera (torch)
  const [camStatus, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const strobeTimerRef = useRef(null);
  const STROBE_INTERVAL_MS = 800; // flip torch every 0.8s

  // Guard-rail modal when no contacts exist
  const [guardOpen, setGuardOpen] = useState(false);

  // Configure audio so siren plays under iOS mute switch and keeps focus
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      allowsRecordingIOS: false,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    }).catch(() => {});
  }, []);

  // Request camera permission upfront; needed to control torch
  useEffect(() => {
    (async () => {
      if (!camStatus?.granted) {
        await requestPermission();
      }
    })();
  }, [camStatus, requestPermission]);

  // Hard cleanup on unmount (ensure alarm stops)
  useEffect(() => {
    return () => {
      stopAlarm().catch(() => {});
    };
  }, []);

  // Start the SOS alarm:
  // - configure audio + start looping siren
  // - begin repeating vibration
  // - start torch strobe (if permission granted)
  // - after 3s, auto-dispatch to contacts (once) if still active
  const startAlarm = async () => {
    try {
      // AUDIO (make sure we're in a permissive mode)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        allowsRecordingIOS: false,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/Sound/alert.mp3"),
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;

      // VIBRATION (pattern: start immediately, on 1000ms, off 500ms, repeat)
      Vibration.vibrate([0, 1000, 500], true);

      // FLASH (requires camera permission)
      if (camStatus?.granted) {
        setTorchOn(true);
        strobeTimerRef.current = setInterval(() => {
          setTorchOn((v) => !v);
        }, STROBE_INTERVAL_MS);
      }

      // Mark as active and reset the single-dispatch guard
      setActive(true);
      activeRef.current = true;
      sentOnceRef.current = false;

      // After 3 seconds of continuous activation, dispatch alerts (once)
      clearTimeout(sendTimerRef.current);
      sendTimerRef.current = setTimeout(async () => {
        if (!activeRef.current || sentOnceRef.current) return;
        try {
          const contacts = await getContacts();
          if (Array.isArray(contacts) && contacts.length > 0) {
            await dispatchEmergency(contacts);
          }
          sentOnceRef.current = true;
        } catch {
          // Swallow for demo; production could log/report
        }
      }, 3000);
    } catch (e) {
      // Non-fatal for demo; consider user feedback in production
    }
  };

  // Stop everything and clean up:
  // - stop/unload siren
  // - cancel timers and guards
  // - stop vibration
  // - stop strobe + turn torch off
  // - reset active state
  const stopAlarm = async () => {
    try {
      // AUDIO
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } finally {
      // Timers & guards
      clearTimeout(sendTimerRef.current);
      sendTimerRef.current = null;
      sentOnceRef.current = false;

      // VIBRATION
      Vibration.cancel();

      // FLASH
      if (strobeTimerRef.current) {
        clearInterval(strobeTimerRef.current);
        strobeTimerRef.current = null;
      }
      setTorchOn(false);

      // State
      setActive(false);
      activeRef.current = false;
    }
  };

  // Main button handler: toggles alarm; shows guard-rail if no contacts yet
  const onTap = async () => {
    if (active) {
      stopAlarm();
      return;
    }
    try {
      const contacts = await getContacts();
      if (!contacts || contacts.length === 0) {
        setGuardOpen(true);
      } else {
        startAlarm();
      }
    } catch {
      // If we fail to read contacts, still allow alarm to start
      startAlarm();
    }
  };

  // Layout constants / styling helpers
  const TAB_BAR_HEIGHT = 55;
  const BANNER_GAP = 10;
  const bannerBottom = insets.bottom + TAB_BAR_HEIGHT + BANNER_GAP;

  // Subtle background ring palette varies by theme
  const RING_COLORS = isDark
    ? ["#FFFFFF26", "#FFFFFF1F", "#FFFFFF14"]
    : ["#FDE5E5", "#F9D2D2", "#F6BABA"];

  // i18n subtitle (two-line), with injected delay for clarity
  const delaySeconds = 3;
  const subtitle = active
    ? `${t("sos.subtitle_active_line1")}\n${t("sos.subtitle_active_line2", {
        delay: delaySeconds,
      })}`
    : `${t("sos.subtitle_idle_line1")}\n${t("sos.subtitle_idle_line2", {
        delay: delaySeconds,
      })}`;

  return (
    <View
      style={{ flex: 1, backgroundColor: isDark ? "transparent" : "#FFF6F5" }}
    >
      {/* Dark theme gets a richer red gradient behind the content */}
      {isDark && (
        <LinearGradient
          colors={["#6E0F20", "#B32638"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <SafeAreaView style={styles.safe}>
        {/* Header (title + two-line subtitle) */}
        <View style={[styles.header, { marginTop: 40 }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t("sos.title")}
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: isDark ? "#d4d4d4ff" : "#5F6D7E" },
            ]}
          >
            {subtitle}
          </Text>
        </View>

        {/* Invisible Camera (only when active & permitted) drives the torch */}
        {active && camStatus?.granted && (
          <CameraView
            facing="back"
            enableTorch={camReady && torchOn}
            style={{
              position: "absolute",
              width: 24,
              height: 24,
              opacity: 0.001, // make it effectively invisible
            }}
            onCameraReady={() => setCamReady(true)}
          />
        )}

        {/* Central SOS button with concentric background rings */}
        <View style={styles.centerWrap}>
          <View
            style={[
              styles.ring,
              { width: 340, height: 340, backgroundColor: RING_COLORS[0] },
            ]}
          />
          <View
            style={[
              styles.ring,
              { width: 300, height: 300, backgroundColor: RING_COLORS[1] },
            ]}
          />
          <View
            style={[
              styles.ring,
              { width: 260, height: 260, backgroundColor: RING_COLORS[2] },
            ]}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onTap}
            delayLongPress={450}
            style={[
              styles.coreWrap,
              isDark && { shadowOpacity: 0.25, shadowRadius: 22 },
            ]}
          >
            {isDark ? (
              // Dark theme: lighter core for contrast
              <LinearGradient
                colors={["#e4e4e4ff", "#e4e4e4ff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.core}
              >
                <Text
                  style={[
                    styles.coreText,
                    { color: "#B7404E", fontWeight: "700" },
                  ]}
                >
                  {active ? t("sos.button_stop") : t("sos.button_sos")}
                </Text>
              </LinearGradient>
            ) : (
              // Light theme: red gradient core
              <LinearGradient
                colors={
                  active ? ["#FF9E9E", "#FF6F6F"] : ["#FF6161", "#F34040"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.core}
              >
                <Text style={[styles.coreText, { color: "#fff" }]}>
                  {active ? t("sos.button_stop") : t("sos.button_sos")}
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom dock: Manage Contacts CTA */}
        <View
          style={[
            styles.bottomDock,
            { left: 16, right: 16, bottom: bannerBottom },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("EmergencyContacts")}
            activeOpacity={0.9}
            style={[
              styles.contactsBtn,
              isDark ? styles.contactsBtnDark : styles.contactsBtnLight,
            ]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name="people-outline"
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.contactsBtnText, { color: "#fff" }]}>
              {t("sos.manage_contacts")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Guard-rail modal (user has 0 contacts) */}
      <ConfirmModal
        visible={guardOpen}
        title={t("sos.guard_title")}
        message={t("sos.guard_message")}
        confirmLabel={t("sos.guard_add_contact")}
        cancelLabel={t("sos.guard_not_now")}
        onCancel={() => {
          setGuardOpen(false);
          // User chose to proceed without contacts → still start the alarm
          startAlarm();
        }}
        onConfirm={() => {
          setGuardOpen(false);
          navigation.navigate("EmergencyContacts");
        }}
      />
    </View>
  );
}

const CORE_SIZE = 220;

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  header: { alignItems: "center" },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: {
    marginTop: 10,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },

  centerWrap: {
    marginTop: 35,
    alignItems: "center",
    justifyContent: "center",
    height: 380,
  },
  ring: { position: "absolute", borderRadius: 999, opacity: 0.65 },

  coreWrap: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  core: { flex: 1, alignItems: "center", justifyContent: "center" },
  coreText: { fontSize: 80, letterSpacing: 5, fontWeight: "600" },

  bottomDock: {
    position: "absolute",
  },

  contactsBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  contactsBtnLight: {
    backgroundColor: "#ED5160",
  },
  contactsBtnDark: {
    backgroundColor: "#7c0b23ff",
  },
  contactsBtnText: { fontWeight: "800", fontSize: 16 },
});
