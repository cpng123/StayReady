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

export default function SOSScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeContext();
  const isDark = theme.key === "dark";

  const soundRef = useRef(null);
  const [active, setActive] = useState(false);

  // FLASH / CAMERA
  const [camStatus, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const strobeTimerRef = useRef(null);
  const STROBE_INTERVAL_MS = 800;

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
        { shouldPlay: true, isLooping: true, volume: 1.0 } // app-level max; system volume still applies
      );
      soundRef.current = sound;

      // VIBRATION
      Vibration.vibrate([0, 1000, 500], true);

      // FLASH (only if permitted)
      if (camStatus?.granted) {
        // wait for camera to be ready; we’ll flip torch on in onCameraReady
        setTorchOn(true); // desired initial state; will be applied when ready
        strobeTimerRef.current = setInterval(() => {
          setTorchOn((v) => !v);
        }, STROBE_INTERVAL_MS);
      }

      setActive(true);
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
      // VIBRATION
      Vibration.cancel();
      // FLASH
      if (strobeTimerRef.current) {
        clearInterval(strobeTimerRef.current);
        strobeTimerRef.current = null;
      }
      setTorchOn(false);
      setActive(false);
    }
  };

  const onTap = () => {
    if (active) stopAlarm();
    else startAlarm();
  };

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
            // Keep it tiny/invisible but mounted so the session runs
            style={{
              position: "absolute",
              width: 24, // <-- slight bump helps some devices
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

        {/* Bottom banner */}
        <View
          style={[
            styles.banner,
            {
              left: 16,
              right: 16,
              bottom: bannerBottom,
              backgroundColor: isDark ? "#75041cff" : "#ED5160",
            },
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
      </SafeAreaView>
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

  banner: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
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
});
