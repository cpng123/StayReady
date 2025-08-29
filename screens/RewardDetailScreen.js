/**
 * RewardDetailScreen
 * -----------------------------------------------------------------------------
 * Detail page for a single reward item with the ability to redeem it for points.
 */

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
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { redeemItem } from "../utils/rewards";
import { useTranslation } from "react-i18next";

export default function RewardDetailScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation();

  const { item: rawItem, pointsAvailable = 0 } = route.params || {};
  const baseKey = rawItem?.id ? `rewards.catalog.${rawItem.id}` : null;

  // Localize fields safely with fallbacks to raw item values
  const item = {
    ...rawItem,
    title: baseKey
      ? t(`${baseKey}.title`, { defaultValue: rawItem.title })
      : rawItem.title,
    desc: baseKey
      ? t(`${baseKey}.desc`, { defaultValue: rawItem.desc })
      : rawItem.desc,
    longDesc: baseKey
      ? t(`${baseKey}.longDesc`, {
          defaultValue: rawItem.longDesc || rawItem.desc,
        })
      : rawItem.longDesc || rawItem.desc,
    details: baseKey
      ? t(`${baseKey}.details`, {
          defaultValue: rawItem.details,
          returnObjects: true, // IMPORTANT: ensures arrays are returned intact
        })
      : rawItem.details,
  };

  const [available, setAvailable] = useState(Number(pointsAvailable) || 0);
  const price = Number(item?.points) || 0;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState(null); // "success" | "insufficient" | "error"

  // Attempt to redeem the current reward.
  // - If user balance is insufficient, show an "insufficient" modal.
  // - Otherwise, call `redeemItem`; on success, deduct local balance and show "success".
  // - On failure, show a generic "error" modal.
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

  // Close the feedback modal.
  // Navigates back if the last status was a successful redemption.
  const closeModal = () => {
    setModalOpen(false);
    if (modalStatus === "success") nav.goBack();
  };

  return (
    <View style={[s.safe, { backgroundColor: theme.colors.appBg }]}>
      <View style={s.heroBox}>
        <Image source={item.image} style={s.heroImage} />
        <Pressable onPress={() => nav.goBack()} hitSlop={10} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={[s.title, { color: theme.colors.text }]}>
          {item.title}
        </Text>

        <Text style={[s.desc, { color: theme.colors.subtext }]}>
          {item.longDesc || item.desc}
        </Text>

        {Array.isArray(item.details) && item.details.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: theme.colors.text }]}>
              {t("rewards.includes", "Includes:")}
            </Text>
            {item.details.map((d, i) => (
              <View key={i} style={s.bulletRow}>
                <Text style={[s.bulletDot, { color: theme.colors.text }]}>
                  •
                </Text>
                <Text style={[s.bulletText, { color: theme.colors.subtext }]}>
                  {d}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 70 }} />
      </ScrollView>

      <View style={[s.bottomBar, { backgroundColor: theme.colors.card }]}>
        <View style={s.pointsCol}>
          <Text style={[s.pointsBig, { color: theme.colors.primary }]}>
            {price}
          </Text>
          <Text style={[s.pointsLabel, { color: theme.colors.subtext }]}>
            {t("rewards.points_required", "Points Required")}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[s.redeemBtn, { backgroundColor: theme.colors.primary }]}
          onPress={onRedeem}
        >
          <Text style={s.redeemText}>
            {t("rewards.redeem_now", "Redeem Now")}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color="#fff"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={s.modalBackdrop}>
          <View style={[s.modalCard, { backgroundColor: theme.colors.card }]}>
            {modalStatus === "success" && (
              <>
                <Ionicons name="checkmark-circle" size={40} color="#16A34A" />
                <Text style={[s.modalTitle, { color: theme.colors.text }]}>
                  {t("rewards.modal.success.title", "Redeemed Successfully!")}
                </Text>
                <Text style={[s.modalMsg, { color: theme.colors.subtext }]}>
                  {t(
                    "rewards.modal.success.msg",
                    "{{price}} points have been deducted from your balance.",
                    { price }
                  )}
                </Text>
              </>
            )}

            {modalStatus === "insufficient" && (
              <>
                <Ionicons name="alert-circle" size={40} color="#DC2626" />
                <Text style={[s.modalTitle, { color: theme.colors.text }]}>
                  {t("rewards.modal.insufficient.title", "Not enough points")}
                </Text>
                <Text style={[s.modalMsg, { color: theme.colors.subtext }]}>
                  {t(
                    "rewards.modal.insufficient.msg",
                    "You need {{need}} points, but you only have {{have}}.",
                    { need: price, have: available }
                  )}
                </Text>
              </>
            )}

            {modalStatus === "error" && (
              <>
                <Ionicons name="alert-circle" size={40} color="#DC2626" />
                <Text style={[s.modalTitle, { color: theme.colors.text }]}>
                  {t("rewards.modal.error.title", "Something went wrong")}
                </Text>
                <Text style={[s.modalMsg, { color: theme.colors.subtext }]}>
                  {t(
                    "rewards.modal.error.msg",
                    "Please try again in a moment."
                  )}
                </Text>
              </>
            )}

            <TouchableOpacity
              onPress={closeModal}
              activeOpacity={0.9}
              style={[s.modalBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={s.modalBtnText}>
                {modalStatus === "success"
                  ? t("rewards.modal.done", "Done")
                  : t("rewards.modal.close", "Close")}
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
    heroBox: { position: "relative" },
    heroImage: { width: "100%", height: 210, resizeMode: "cover" },
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
    content: { padding: 16 },
    title: { fontSize: 20, fontWeight: "900", marginBottom: 8 },
    desc: { fontSize: 14, fontWeight: "600", lineHeight: 18, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 6 },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 4,
    },
    bulletDot: { marginRight: 6, fontSize: 14, lineHeight: 18 },
    bulletText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
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
    modalMsg: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 4,
    },
    modalBtn: {
      marginTop: 12,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
    },
    modalBtnText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 15,
      textAlign: "center",
    },
  });
