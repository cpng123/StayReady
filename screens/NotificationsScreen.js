/**
 * NotificationsScreen
 * -----------------------------------------------------------------------------
 *   Show the log of hazard notifications. Opening this screen marks all as read
 *   (persisted), and each row opens the Hazard Detail view for the snapshot
 *   attached to the notification.
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useThemeContext } from "../theme/ThemeProvider";
import {
  getNotificationLog,
  markAllNotificationsRead,
  markNotificationRead,
} from "../utils/notify";
import { useTranslation } from "react-i18next";

// Map hazard kind -> thumbnail image (fallback applied below)
const ICON_FOR = {
  flood: require("../assets/General/flash-flood2.jpg"),
  haze: require("../assets/General/pm-haze2.jpg"),
  dengue: require("../assets/General/dengue-cluster2.jpg"),
  wind: require("../assets/General/strong-wind2.jpg"),
  heat: require("../assets/General/heat.jpg"),
};
// Choose an icon; default to 'wind' if kind unknown/missing
const getIconForKind = (kind) => ICON_FOR[kind] || ICON_FOR["wind"];

export default function NotificationsScreen({ navigation }) {
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load log; mark all as read first so UI reflects the read state immediately
  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await getNotificationLog();
      // Persist read state, then set UI as read
      await markAllNotificationsRead();
      setItems((list || []).map((n) => ({ ...n, read: true })));
    } catch {
      setItems([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  // Navigate to detail & set this item as read in UI + storage
  const openItem = async (item) => {
    try {
      await markNotificationRead(item.id);
    } finally {
      // Mark as read locally to remove the dot without waiting for a reload
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      const hazard = item.hazard || {
        kind: item.kind,
        severity: item.severity,
        title: item.title,
      };
      navigation.navigate("HazardDetail", { hazard });
    }
  };

  const renderItem = ({ item }) => {
    const title = item.title || t("notifications.untitled", "Hazard Alert");
    const body = item.body || t("notifications.no_body", "Tap to view details");
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.row, { backgroundColor: theme.colors.card }]}
        onPress={() => openItem(item)}
        accessibilityRole="button"
        accessibilityLabel={title}
        testID={`notif-${item.id}`}
      >
        <Image source={getIconForKind(item.kind)} style={styles.thumb} />
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[styles.body, { color: theme.colors.subtext }]}
            numberOfLines={2}
          >
            {body}
          </Text>
          <Text style={[styles.time, { color: theme.colors.subtext }]}>
            {timeAgo(item.time)}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.subtext}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.appBg }]}
    >
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", "Back")}
          testID="notif-back"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.colors.text }]}>
          {t("notifications.title", "Notifications")}
        </Text>
        {/* spacer to balance flex */}
        <View style={{ width: 40 }} />
      </View>

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 14, paddingBottom: 24, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={load}
            tintColor={theme.colors.text}
          />
        }
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Ionicons
              name="notifications-off-outline"
              size={36}
              color={theme.colors.subtext}
            />
            <Text style={{ color: theme.colors.subtext, marginTop: 8 }}>
              {t("notifications.empty", "No notifications yet")}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// Human-friendly "time ago" (compact). Accepts a JS timestamp (ms).
// Falls back to "0s" if invalid or in the future.
function timeAgo(ts) {
  const now = Date.now();
  const diff = Math.max(0, now - (Number(ts) || 0));
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    topbar: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
    },
    backBtn: {
      height: 40,
      width: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    topTitle: { fontSize: 18, fontWeight: "800" },

    row: {
      flexDirection: "row",
      borderRadius: 14,
      padding: 10,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    thumb: { width: 50, height: 50, borderRadius: 10, marginRight: 12 },
    title: { fontSize: 15, fontWeight: "700" },
    body: { fontSize: 13, marginTop: 2 },
    time: { fontSize: 11, marginTop: 6 },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#F25555",
      marginHorizontal: 6,
    },
  });
