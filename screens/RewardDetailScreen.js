// screens/RewardDetailScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { redeemItem } from "../utils/rewards";

export default function RewardDetailScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const { item, pointsAvailable = 0 } = route.params || {};
  const [available, setAvailable] = useState(Number(pointsAvailable) || 0);
  const price = Number(item?.points) || 0;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState(null); // "success" | "insufficient" | "error"

  const onRedeem = async () => {
    if (available < price) {
      setModalStatus("insufficient");
      setModalOpen(true);
      return;
    }
    const res = await redeemItem(item);
    if (res.ok) {
      setAvailable((a) => Math.max(0, a - price));
      setModalStatus("success");
    } else {
      setModalStatus("error");
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    if (modalStatus === "success") {
      nav.goBack();
    }
  };

  return (
    <View style={[s.safe, { backgroundColor: theme.colors.appBg }]}>
      {/* Top image (no rounded corners) */}
      <View style={s.heroBox}>
        <Image source={item.image} style={s.heroImage} />
        <Pressable onPress={() => nav.goBack()} hitSlop={10} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Content directly after the image (no card container) */}
      <ScrollView contentContainerStyle={s.content}>
        <Text style={[s.title, { color: theme.colors.text }]}>{item.title}</Text>

        <Text style={[s.desc, { color: theme.colors.subtext }]}>
          {item.longDesc || item.desc}
        </Text>

        {Array.isArray(item.details) && item.details.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: theme.colors.text }]}>
              Includes:
            </Text>
            {item.details.map((d, i) => (
              <View key={i} style={s.bulletRow}>
                <Text style={[s.bulletDot, { color: theme.colors.text }]}>•</Text>
                <Text style={[s.bulletText, { color: theme.colors.subtext }]}>{d}</Text>
              </View>
            ))}
          </>
        )}

        {/* Spacer so content doesn't go under the sticky bar */}
        <View style={{ height: 70 }} />
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[s.bottomBar, { backgroundColor: theme.colors.card }]}>
        <View style={s.pointsCol}>
          <Text style={[s.pointsBig, { color: theme.colors.primary }]}>{price}</Text>
          <Text style={[s.pointsLabel, { color: theme.colors.subtext }]}>
            Points Required
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[s.redeemBtn, { backgroundColor: theme.colors.primary }]}
          onPress={onRedeem}
        >
          <Text style={s.redeemText}>Redeem Now</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Outcome modal */}
      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={s.modalBackdrop}>
          <View style={[s.modalCard, { backgroundColor: theme.colors.card }]}>
            {modalStatus === "success" && (
              <>
                <Ionicons name="checkmark-circle" size={40} color="#16A34A" />
                <Text style={[s.modalTitle, { color: theme.colors.text }]}>
                  Redeemed Successfully!
                </Text>
                <Text style={[s.modalMsg, { color: theme.colors.subtext }]}>
                  {price} points have been deducted from your balance.
                </Text>
              </>
            )}

            {modalStatus === "insufficient" && (
              <>
                <Ionicons name="alert-circle" size={40} color="#DC2626" />
                <Text style={[s.modalTitle, { color: theme.colors.text }]}>
                  Not enough points
                </Text>
                <Text style={[s.modalMsg, { color: theme.colors.subtext }]}>
                  You need {price} points, but you only have {available}.
                </Text>
              </>
            )}

            {modalStatus === "error" && (
              <>
                <Ionicons name="alert-circle" size={40} color="#DC2626" />
                <Text style={[s.modalTitle, { color: theme.colors.text }]}>
                  Something went wrong
                </Text>
                <Text style={[s.modalMsg, { color: theme.colors.subtext }]}>
                  Please try again in a moment.
                </Text>
              </>
            )}

            <TouchableOpacity
              onPress={closeModal}
              activeOpacity={0.9}
              style={[s.modalBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={s.modalBtnText}>
                {modalStatus === "success" ? "Done" : "Close"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },

    /* Top image & back */
    heroBox: { position: "relative" },
    heroImage: {
      width: "100%",
      height: 210,
      resizeMode: "cover",
    },
    backBtn: {
      position: "absolute",
      left: 12,
      top: 12,
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },

    /* Content (no card container) */
    content: { padding: 16 },
    title: { fontSize: 20, fontWeight: "900", marginBottom: 8 },
    desc: { fontSize: 14, fontWeight: "600", lineHeight: 18, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 6 },
    bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
    bulletDot: { marginRight: 6, fontSize: 14, lineHeight: 18 },
    bulletText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },

    /* Sticky bottom bar */
    bottomBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
      elevation: 6,
    },
    pointsCol: { flexDirection: "column" },
    pointsBig: { fontSize: 20, fontWeight: "900" },
    pointsLabel: { fontSize: 11, fontWeight: "800" },
    redeemBtn: {
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    redeemText: { color: "#fff", fontWeight: "900", fontSize: 15 },

    /* Modal */
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      width: "88%",
      borderRadius: 16,
      alignItems: "center",
      padding: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: "900", marginTop: 8 },
    modalMsg: { fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 4 },

    // ⬇⬇ FULL-WIDTH ACTION BUTTON INSIDE THE MODAL ⬇⬇
    modalBtn: {
      marginTop: 12,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",   // take full width of modal card
    },
    modalBtnText: { color: "#fff", fontWeight: "900", fontSize: 15, textAlign: "center" },
  });
