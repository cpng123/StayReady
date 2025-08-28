// screens/NotificationsScreen.js
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useThemeContext } from "../theme/ThemeProvider";
import {
  getNotificationLog, markAllNotificationsRead, markNotificationRead,
} from "../utils/notify";
import { useTranslation } from "react-i18next";

const ICON_FOR = {
  flood: require("../assets/General/flash-flood2.jpg"),
  haze: require("../assets/General/pm-haze2.jpg"),
  dengue: require("../assets/General/dengue-cluster2.jpg"),
  wind: require("../assets/General/strong-wind2.jpg"),
  heat: require("../assets/General/heat.jpg"),
};

export default function NotificationsScreen({ navigation }) {
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const styles = makeStyles(theme);

  const load = useCallback(async () => {
    setRefreshing(true);
    const list = await getNotificationLog();
    setItems(list);
    await markAllNotificationsRead();
    setRefreshing(false);
  }, []);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.row, { backgroundColor: theme.colors.card }]}
      onPress={async () => {
        await markNotificationRead(item.id);
        // Prefer the saved hazard snapshot; fallback to minimal object
        const hazard = item.hazard || {
          kind: item.kind,
          severity: item.severity,
          title: item.title,
        };
        navigation.navigate("HazardDetail", { hazard });
      }}
    >
      <Image source={ICON_FOR[item.kind]} style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.body, { color: theme.colors.subtext }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[styles.time, { color: theme.colors.subtext }]}>{timeAgo(item.time)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
      <Ionicons name="chevron-forward" size={18} color={theme.colors.subtext} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.appBg }]}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.colors.text }]}>
          {t("notifications.title", "Notifications")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.text} />
        }
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Ionicons name="notifications-off-outline" size={36} color={theme.colors.subtext} />
            <Text style={{ color: theme.colors.subtext, marginTop: 8 }}>
              {t("notifications.empty", "No notifications yet")}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function timeAgo(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`; const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`; const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`; const d = Math.floor(h / 24);
  return `${d}d`;
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    topbar: {
      height: 52, flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", paddingHorizontal: 8,
    },
    backBtn: { height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: 8 },
    topTitle: { fontSize: 18, fontWeight: "800" },
    row: {
      flexDirection: "row", borderRadius: 14, padding: 10, alignItems: "center",
      shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 }, elevation: 2,
    },
    thumb: { width: 50, height: 50, borderRadius: 10, marginRight: 12 },
    title: { fontSize: 15, fontWeight: "700" },
    body: { fontSize: 13, marginTop: 2 },
    time: { fontSize: 11, marginTop: 6 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F25555", marginHorizontal: 6 },
  });
