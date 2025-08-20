import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Text } from "react-native";
import { Audio } from "expo-av";

export default function SplashScreen({ navigation }) {
  // Anim values
  const logoY = useRef(new Animated.Value(20)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.9)).current;

  // Sound ref (preloaded)
  const soundRef = useRef(null);

  // Durations
  const LOGO_UP = 800;
  const LOGO_DOWN = 600;
  const HALFWAY_MS = Math.round((LOGO_UP + LOGO_DOWN) / 2);

  // Preload sound once
  useEffect(() => {
    let isMounted = true;
    (async () => {
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
        if (isMounted) {
          soundRef.current = sound;
          sound.setOnPlaybackStatusUpdate(
            (s) => s.didJustFinish && sound.unloadAsync()
          );
        }
      } catch (e) {
        console.warn("Sound preload failed:", e);
      }
    })();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

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
    // PLAY instantly (preloaded), don't await
    if (soundRef.current) {
      soundRef.current.setPositionAsync(0);
      soundRef.current.playAsync();
    }

    // Kick off logo animation at the same tick
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
    const t = setTimeout(() => {
      animateLogo();
    }, 1000);

    // Navigate when animation finishes
    const navT = setTimeout(() => {
      navigation.replace("Home"); // replaces stack so back button doesn’t return to Splash
    }, 4000); // adjust delay = animation length + extra

    return () => {
      clearTimeout(t);
      clearTimeout(navT);
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
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
    backgroundColor: "#FFF9F2",
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
