// components/ExternalResourceCard.js
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from "react-native";

/**
 * ExternalResourceCard
 * Props:
 *  - item: { id, title, desc, url, logo }
 *  - theme: { colors: { card, text, subtext } }
 *  - style (optional): container style override
 */
export default function ExternalResourceCard({ item, theme, style }) {
  const open = async () => {
    try {
      const ok = await Linking.canOpenURL(item?.url);
      if (ok) await Linking.openURL(item.url);
    } catch {
      // no-op
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.9}
      onPress={open}
      style={[
        styles.extRow,
        { backgroundColor: theme?.colors?.card ?? "#fff" },
        style,
      ]}
    >
      <View style={styles.extLogoWrap}>
        {!!item?.logo && <Image source={item.logo} style={styles.extLogo} />}
      </View>

      <View style={styles.extTextWrap}>
        <Text
          numberOfLines={2}
          style={[styles.extTitle, { color: theme?.colors?.text ?? "#111" }]}
        >
          {item?.title}
        </Text>
        <Text
          numberOfLines={3}
          style={[styles.extDesc, { color: theme?.colors?.subtext ?? "#555" }]}
        >
          {item?.desc}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  extRow: {
    flexDirection: "row",
    height: 85,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  extLogoWrap: {
    width: 105,
    height: "100%",
    borderTopLeftRadius: CARD_RADIUS,
    borderBottomLeftRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  extLogo: { width: "100%", height: "100%", resizeMode: "cover" },
  extTextWrap: { flex: 1, paddingHorizontal: 8, paddingVertical: 10, justifyContent: "center" },
  extTitle: { fontWeight: "800", fontSize: 14, marginBottom: 3 },
  extDesc: { fontSize: 11 },
});
