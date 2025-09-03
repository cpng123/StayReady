/**
 * File: components/ConfirmModal.js
 * Purpose: Themed confirmation dialog with subtle fade/scale animations.
 *
 * Responsibilities:
 *  - Show a title, optional message, and Confirm/Cancel actions.
 *  - Animate in when opened and animate out before unmount to avoid flicker.
 *  - Respect app theme (overlay, surfaces, text, primary color).
 *
 * Notes:
 *  - Controlled component: parent owns `visible`; this component manages an
 *    internal `showing` flag to allow the close animation to finish.
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Modal, View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { useThemeContext } from "../theme/ThemeProvider";

export default function ConfirmModal({
  visible,
  title = "Confirm",
  message = "",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  const { theme } = useThemeContext();

  // Memoize style sheet per theme
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Keep mounted while closing animation plays
  const [showing, setShowing] = useState(visible);

  // Animated values
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  // Open/close animations
  useEffect(() => {
    if (visible) {
      setShowing(true);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.96, duration: 150, useNativeDriver: true }),
      ]).start(() => setShowing(false));
    }
  }, [visible, fade, scale]);

  if (!showing) return null;

  return (
    <Modal transparent visible={showing} animationType="none" onRequestClose={onCancel}>
      {/* Dim backdrop (tap to cancel) */}
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      </Animated.View>

      {/* Centered card */}
      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          {/* Actions */}
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onCancel}>
              <Text style={[styles.btnText, styles.btnGhostText]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onConfirm}>
              <Text style={[styles.btnText, styles.btnPrimaryText]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Theme-scoped styles
const makeStyles = (theme) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay, // themed dim layer
    },
    centerWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: theme.colors.card, // themed surface
      borderRadius: 16,
      padding: 18,
      shadowColor: "#000",
      shadowOpacity: theme.key === "dark" ? 0.25 : 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    title: { fontSize: 18, fontWeight: "800", color: theme.colors.text },
    message: { marginTop: 8, color: theme.colors.subtext, lineHeight: 20 },
    row: { marginTop: 16, flexDirection: "row", gap: 10 },
    btn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    // Light uses a soft blue; dark uses a neutral chip
    btnGhost: {
      backgroundColor: theme.key === "dark" ? "#1F2430" : "#EEF5FF",
    },
    btnGhostText: {
      color: theme.colors.primary,
      fontWeight: "800",
      fontSize: 15,
    },
    btnPrimary: {
      backgroundColor: theme.colors.primary,
    },
    btnPrimaryText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 15,
    },
    btnText: { fontWeight: "800", fontSize: 15 },
  });
