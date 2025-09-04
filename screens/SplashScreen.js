/**
 * SplashScreen
 * -----------------------------------------------------------------------------
 * A lightweight, theme-aware splash experience with a playful logo bounce,
 * staged text reveal, and an intro sound.
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useThemeContext } from "../theme/ThemeProvider";

const SFX_KEY = "pref:sfxEnabled";

export default function SplashScreen({ navigation }) {
  const { theme } = useThemeContext();

  // Animated values
  // Logo: start slightly below (translateY=20), fade in from 0
  const logoY = useRef(new Animated.Value(20)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // App name: fade in + gentle scale-up
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.9)).current;

  // Sound state
  // Keep the Sound instance and the persisted SFX preference in refs so we can
  // consult them during animation start without triggering re-renders.
  const soundRef = useRef(null);
  const sfxEnabledRef = useRef(true); // default to ON if nothing stored

  // Timing constants
  const LOGO_UP = 800; // ms for logo to move up
  const LOGO_DOWN = 600; // ms for logo to bounce back down
  const HALFWAY_MS = Math.round((LOGO_UP + LOGO_DOWN) / 2); // trigger text

  // Kick off the text fade + scale (called mid-way through logo anim)
  const startTextAnim = () => {
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(textScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Master animation: optional SFX → logo up/bounce → text reveal
  const animateLogo = () => {
    // Respect user's SFX preference
    if (sfxEnabledRef.current && soundRef.current) {
      try {
        soundRef.current.setPositionAsync(0);
        soundRef.current.playAsync();
      } catch {}
    }

    // Run the logo movement and fade in together
    Animated.parallel([
      Animated.sequence([
        Animated.timing(logoY, {
          toValue: -30,
          duration: LOGO_UP,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.timing(logoY, {
          toValue: 0,
          duration: LOGO_DOWN,
          useNativeDriver: true,
          easing: Easing.bounce,
        }),
      ]),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: LOGO_UP + LOGO_DOWN,
        useNativeDriver: true,
      }),
    ]).start();

    // Reveal the text around the midpoint for a layered feel
    setTimeout(startTextAnim, HALFWAY_MS);
  };

  useEffect(() => {
    let cancelled = false; // guard against async after unmount
    let t1, t2; // timeouts for anim start and navigation

    (async () => {
      // Load SFX preference *before* any potential playback
      try {
        const raw = await AsyncStorage.getItem(SFX_KEY);
        sfxEnabledRef.current = raw == null ? true : raw === "1";
      } catch {}

      // Prepare audio (playable under iOS silent switch) and preload intro
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          require("../assets/Sound/intro.mp3"),
          { shouldPlay: false, isLooping: false, volume: 1.0 }
        );

        if (!cancelled) {
          soundRef.current = sound;
          // Auto-unload when it finishes (no loop)
          sound.setOnPlaybackStatusUpdate(
            (s) => s.didJustFinish && sound.unloadAsync()
          );
        } else {
          // If unmounted during preload, release immediately
          await sound.unloadAsync();
        }
      } catch {}

      if (cancelled) return;

      // Stagger animation kickoff slightly to ensure assets are ready
      t1 = setTimeout(animateLogo, 800);

      // Navigate away after ~5 seconds (animation + dwell)
      t2 = setTimeout(() => navigation.replace("Main"), 5000);
    })();

    // Cleanup: cancel timers, unload sound if present
    return () => {
      cancelled = true;
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [navigation]);

  // Render
  return (
    <View
      testID="splash-root"
      style={[styles.container, { backgroundColor: theme.colors.appBg }]}
    >
      {/* Animated logo (rise → bounce, fade in) */}
      <Animated.Image
        testID="splash-logo"
        source={require("../assets/logo.png")}
        style={[
          styles.logo,
          { opacity: logoOpacity, transform: [{ translateY: logoY }] },
        ]}
        resizeMode="contain"
      />

      {/* Animated app name (fade + scale) */}
      <Animated.Text
        testID="splash-title"
        style={[
          styles.appName,
          { opacity: textOpacity, transform: [{ scale: textScale }] },
        ]}
      >
        StayReady
      </Animated.Text>
    </View>
  );
}

// Basic layout/typography; colors for text come from theme in render
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 18,
  },
  appName: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#0A84FF", // accent color; override via theme if desired
  },
});
