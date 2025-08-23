import React, { memo, useEffect, useRef } from "react";
import {
  View, Text, Modal, Pressable, TouchableOpacity, Animated, Easing, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

function BadgeModal({ open, badge, onClose, onShare, theme }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop;
    if (open) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        { resetBeforeIteration: true }
      );
      loop.start();
    }
    return () => loop?.stop?.();
  }, [open, scale]);

  const locked = !badge?.achieved;

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      {/* tap outside to close */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={[styles.card, { backgroundColor: theme.colors.card }]}>
          {!!badge?.icon && (
            <Animated.Image
              source={badge.icon}
              style={[styles.iconBig, locked && styles.lockedImg, { transform: [{ scale }] }]}
              resizeMode="contain"
            />
          )}

          <Text style={[styles.title, { color: theme.colors.text }]}>{badge?.title || ""}</Text>

          <Text style={[styles.msg, { color: theme.colors.subtext }]}>
            {badge
              ? locked
                ? `You're almost there — unlock this by “${badge.desc}”.`
                : `Impressive progress! You've “${badge.desc}” like a champ!`
              : ""}
          </Text>

          {locked ? (
            <View style={styles.btnCol}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.9}>
                <Text style={[styles.secondaryText, { color: theme.colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.btnCol}>
              <TouchableOpacity style={styles.primaryBtn} onPress={onShare} activeOpacity={0.9}>
                <Ionicons name="share-outline" size={18} color="#fff" />
                <Text style={styles.primaryText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.9}>
                <Text style={[styles.secondaryText, { color: theme.colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 20 },
  card: {
    width: "88%",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    alignItems: "center",
  },
  iconBig: { width: 140, height: 140, marginBottom: 12 },
  lockedImg: { opacity: 0.5 },
  title: { fontSize: 20, fontWeight: "900", marginBottom: 6 },
  msg: { fontSize: 13, fontWeight: "600", textAlign: "center", lineHeight: 18, marginBottom: 14, paddingHorizontal: 6 },
  btnCol: { alignSelf: "stretch", gap: 10, marginTop: 8 },
  primaryBtn: {
    width: "100%", backgroundColor: "#0A84FF", paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row",
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15, marginLeft: 6 },
  secondaryBtn: {
    width: "100%", backgroundColor: "rgba(0,0,0,0.06)", paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row",
  },
  secondaryText: { fontWeight: "800", fontSize: 15 },
});

export default memo(BadgeModal);
