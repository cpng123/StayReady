import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useThemeContext } from "../theme/ThemeProvider";

const SFX_KEY = "pref:sfxEnabled";

export default function SplashScreen({ navigation }) {
  const { theme } = useThemeContext();

  // Anim values
  const logoY = useRef(new Animated.Value(20)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.9)).current;

  // Sound + setting
  const soundRef = useRef(null);
  const sfxEnabledRef = useRef(true); // default true if nothing stored

  // Durations
  const LOGO_UP = 800;
  const LOGO_DOWN = 600;
  const HALFWAY_MS = Math.round((LOGO_UP + LOGO_DOWN) / 2);

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

  const animateLogo = () => {
    // Respect sound setting
    if (sfxEnabledRef.current && soundRef.current) {
      try {
        soundRef.current.setPositionAsync(0);
        soundRef.current.playAsync();
      } catch {}
    }

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

    setTimeout(startTextAnim, HALFWAY_MS);
  };

  useEffect(() => {
    let cancelled = false;
    let t1, t2;

    (async () => {
      try {
        // Load setting first so we don't accidentally play sound if disabled
        const raw = await AsyncStorage.getItem(SFX_KEY);
        sfxEnabledRef.current = raw == null ? true : raw === "1";
      } catch {}

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
          sound.setOnPlaybackStatusUpdate(
            (s) => s.didJustFinish && sound.unloadAsync()
          );
        } else {
          // if we unmounted during preload
          await sound.unloadAsync();
        }
      } catch {}

      if (cancelled) return;

      // Start animation slightly after preload (feel free to tweak)
      t1 = setTimeout(animateLogo, 800);
      t2 = setTimeout(() => navigation.replace("Main"), 5000);
    })();

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.appBg }]}>
      <Animated.Image
        source={require("../assets/logo.png")}
        style={[
          styles.logo,
          { opacity: logoOpacity, transform: [{ translateY: logoY }] },
        ]}
        resizeMode="contain"
      />
      <Animated.Text
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
    color: "#0A84FF",
  },
});
