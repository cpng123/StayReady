// screens/SOSScreen.js
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../theme/ThemeProvider";

export default function SOSScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeContext();
  const isDark = theme.key === "dark";

  const onTap = () => Alert.alert("SOS", "Tapped SOS (wire up logic later).");
  const onHold = () =>
    Alert.alert("SOS (Hold)", "Held SOS (wire up help message later).");

  // keep the banner above your 55px tab bar + tiny gap
  const TAB_BAR_HEIGHT = 55;
  const BANNER_GAP = 10;
  const bannerBottom = insets.bottom + TAB_BAR_HEIGHT + BANNER_GAP;

  const RING_COLORS = isDark
    ? ["#FFFFFF26", "#FFFFFF1F", "#FFFFFF14"] // subtle white rings in dark
    : ["#FDE5E5", "#F9D2D2", "#F6BABA"];

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "transparent" : "#FFF6F5" }}>
      {/* Dark mode background gradient */}
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
          <Text style={[styles.subtitle, { color: isDark ? "#d4d4d4ff" : "#5F6D7E" }]}>
            Tap to alert,{"\n"}hold to send help messages.
          </Text>
        </View>

        {/* Bigger SOS button with larger concentric rings */}
        <View style={styles.centerWrap}>
          {/* outer soft rings */}
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

          {/* core tap area: red gradient in light, white pill in dark */}
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
                <Text style={[styles.coreText, { color: "#B7404E", fontWeight: "700" }]}>
                  SOS
                </Text>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={["#FF6161", "#F34040"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.core}
              >
                <Text style={[styles.coreText, { color: "#fff" }]}>SOS</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom banner pinned above tab bar */}
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
          <View
            style={[
              styles.bannerIcon,
              { backgroundColor: "#fff" },
            ]}
          >
            <Ionicons
              name="alert"
              size={32}
              color={isDark ? "#75041cff" : "#ED5160"}
            />
          </View>
          <Text style={[styles.bannerText, { color: "#fff" }]}>
            Alarm will sound even if your phone is in silent mode.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const CORE_SIZE = 220;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
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
    height: 380, // room for the larger rings
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.65,
  },
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
  core: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  coreText: {
    fontSize: 80,
    letterSpacing: 5,
    fontWeight: "600",
  },

  // pinned banner
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
  bannerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
});
