// screens/SOSScreen.js
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

export default function SOSScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeContext();
  const isDark = theme.key === "dark";

  const soundRef = useRef(null);
  const [active, setActive] = useState(false);

  // keep a ref in sync so timers read the latest
  const activeRef = useRef(false);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // one-shot dispatch guard + timer
  const sendTimerRef = useRef(null);
  const sentOnceRef = useRef(false);

  // FLASH / CAMERA
  const [camStatus, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const strobeTimerRef = useRef(null);
  const STROBE_INTERVAL_MS = 800;

  // Guardrail modal
  const [guardOpen, setGuardOpen] = useState(false);

  // Configure audio (bypass iOS mute switch)
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

  // Ask camera permission once (for flashlight)
  useEffect(() => {
    (async () => {
      if (!camStatus?.granted) {
        await requestPermission();
      }
    })();
  }, [camStatus, requestPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm().catch(() => {});
    };
  }, []);

  const startAlarm = async () => {
    try {
      // AUDIO
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

      // VIBRATION
      Vibration.vibrate([0, 1000, 500], true);

      // FLASH (only if permitted)
      if (camStatus?.granted) {
        setTorchOn(true);
        strobeTimerRef.current = setInterval(() => {
          setTorchOn((v) => !v);
        }, STROBE_INTERVAL_MS);
      }

      // state flags
      setActive(true);
      activeRef.current = true;
      sentOnceRef.current = false;

      // after 3s, if still active, send alerts
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
          // swallow for demo
        }
      }, 3000);
    } catch (e) {
      // ignore for demo
    }
  };

  const stopAlarm = async () => {
    try {
      // AUDIO
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } finally {
      // cancel timers/flags
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

      // state
      setActive(false);
      activeRef.current = false;
    }
  };

  // When user taps the SOS button
  const onTap = async () => {
    if (active) {
      stopAlarm();
      return;
    }
    // Not active: check if any contacts exist; show guardrail if 0
    try {
      const contacts = await getContacts();
      if (!contacts || contacts.length === 0) {
        setGuardOpen(true);
      } else {
        startAlarm();
      }
    } catch {
      // If anything goes wrong reading contacts, still allow alarm to start
      startAlarm();
    }
  };

  // Long press placeholder
  const onHold = () => {
    // reserved for future help-message flow
  };

  // Layout constants
  const TAB_BAR_HEIGHT = 55;
  const BANNER_GAP = 10;
  const bannerBottom = insets.bottom + TAB_BAR_HEIGHT + BANNER_GAP;

  const RING_COLORS = isDark
    ? ["#FFFFFF26", "#FFFFFF1F", "#FFFFFF14"]
    : ["#FDE5E5", "#F9D2D2", "#F6BABA"];

  return (
    <View
      style={{ flex: 1, backgroundColor: isDark ? "transparent" : "#FFF6F5" }}
    >
      {isDark && (
        <LinearGradient
          colors={["#6E0F20", "#B32638"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { marginTop: 40 }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            SOS Emergency Alarm
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: isDark ? "#d4d4d4ff" : "#5F6D7E" },
            ]}
          >
            Tap to {active ? "stop alarm" : "alert"},{"\n"}hold to send help
            messages.
          </Text>
        </View>

        {/* Invisible Camera (only mounted when active & permission granted) */}
        {active && camStatus?.granted && (
          <CameraView
            facing="back"
            enableTorch={camReady && torchOn}
            style={{
              position: "absolute",
              width: 24,
              height: 24,
              opacity: 0.001,
            }}
            onCameraReady={() => setCamReady(true)}
          />
        )}

        {/* SOS Button */}
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
            onLongPress={onHold}
            delayLongPress={450}
            style={[
              styles.coreWrap,
              isDark && { shadowOpacity: 0.25, shadowRadius: 22 },
            ]}
          >
            {isDark ? (
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
                  {active ? "STOP" : "SOS"}
                </Text>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={
                  active ? ["#FF9E9E", "#FF6F6F"] : ["#FF6161", "#F34040"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.core}
              >
                <Text style={[styles.coreText, { color: "#fff" }]}>
                  {active ? "STOP" : "SOS"}
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom dock: banner + full-width contacts button */}
        <View
          style={[
            styles.bottomDock,
            { left: 16, right: 16, bottom: bannerBottom },
          ]}
        >
          {/* Banner */}
          <View
            style={[
              styles.banner,
              { backgroundColor: isDark ? "#75041cff" : "#ED5160" },
            ]}
          >
            <View style={[styles.bannerIcon, { backgroundColor: "#fff" }]}>
              <Ionicons
                name="alert"
                size={32}
                color={isDark ? "#75041cff" : "#ED5160"}
              />
            </View>
            <Text style={[styles.bannerText, { color: "#fff" }]}>
              {active
                ? `Alarm is ON.${
                    camStatus?.granted
                      ? " Flashlight strobing."
                      : " Enable camera permission to use flashlight."
                  } Raise volume for sound; vibration is active.`
                : "Tap to activate SOS alarm (sound, vibration & light)."}
            </Text>
          </View>

          {/* Full-width themed contacts button */}
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
              size={18}
              color={isDark ? "#fff" : theme.colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.contactsBtnText,
                { color: isDark ? "#fff" : theme.colors.primary },
              ]}
            >
              Manage emergency contacts
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Guardrail modal (0 contacts) */}
      <ConfirmModal
        visible={guardOpen}
        title="Add an emergency contact?"
        message="Auto alerts need at least one emergency contact. You can still start the alarm now, but no messages will be sent."
        confirmLabel="Add contact"
        cancelLabel="Not now"
        onCancel={() => {
          setGuardOpen(false);
          // user chose to proceed without contacts → start alarm
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
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: {
    marginTop: 10,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },

  centerWrap: {
    marginTop: 32,
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

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  bannerIcon: {
    width: 35,
    height: 35,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  bannerText: { flex: 1, fontSize: 16, fontWeight: "500" },

  contactsBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    backgroundColor: "#EEF5FF",
  },
  contactsBtnDark: {
    backgroundColor: "#1F2430",
  },
  contactsBtnText: { fontWeight: "800", fontSize: 14 },
});
