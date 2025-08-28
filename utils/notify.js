// utils/notify.js
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEY_NOTIFY_ENABLED = "notify:enabled";
const KEY_NOTIFY_LOG = "notify:log";

let _notifyEnabledCache = null;

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const enabled = _notifyEnabledCache ?? (await getNotificationsEnabled());
    return {
      shouldShowAlert: !!enabled,
      shouldPlaySound: !!enabled,
      shouldSetBadge: false,
    };
  },
});

export async function initNotifications() {
  const enabled = await getNotificationsEnabled();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  if (enabled) {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) await Notifications.requestPermissionsAsync();
  } else {
    try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
  }
}

export async function setNotificationsEnabled(enabled) {
  _notifyEnabledCache = !!enabled;
  await AsyncStorage.setItem(KEY_NOTIFY_ENABLED, JSON.stringify(_notifyEnabledCache));
  if (!enabled) {
    try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
  }
}

export async function getNotificationsEnabled() {
  if (_notifyEnabledCache !== null) return _notifyEnabledCache;
  const raw = await AsyncStorage.getItem(KEY_NOTIFY_ENABLED);
  _notifyEnabledCache = raw == null ? true : JSON.parse(raw);
  return _notifyEnabledCache;
}

export async function getNotificationLog() {
  const raw = await AsyncStorage.getItem(KEY_NOTIFY_LOG);
  const list = raw ? JSON.parse(raw) : [];
  return list.sort((a, b) => b.time - a.time);
}

export async function getUnreadCount() {
  const list = await getNotificationLog();
  return list.filter((n) => !n.read).length;
}

export async function markAllNotificationsRead() {
  const list = await getNotificationLog();
  const updated = list.map((n) => ({ ...n, read: true }));
  await AsyncStorage.setItem(KEY_NOTIFY_LOG, JSON.stringify(updated));
}

export async function markNotificationRead(id) {
  const list = await getNotificationLog();
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  await AsyncStorage.setItem(KEY_NOTIFY_LOG, JSON.stringify(updated));
}

async function appendToLog(entry) {
  const raw = await AsyncStorage.getItem(KEY_NOTIFY_LOG);
  const list = raw ? JSON.parse(raw) : [];
  list.push(entry);
  await AsyncStorage.setItem(KEY_NOTIFY_LOG, JSON.stringify(list));
}

/* --------- Titles + body builder (unchanged logic) ---------- */
const TITLE_FOR = {
  flood: "Flash Flood Warning",
  haze: "Haze (PM2.5) Advisory",
  dengue: "Dengue Cluster Alert",
  wind: "Strong Wind Advisory",
  heat: "Heat Advisory",
};

function buildBody(hazard) {
  const { kind, severity, locationName, metrics = {} } = hazard || {};
  const loc = locationName || "your area";
  const hi = metrics.hi != null ? Number(metrics.hi).toFixed(1) : undefined;

  switch (kind) {
    case "flood":
      return severity === "danger"
        ? `Severe flooding risk near ${loc}. Avoid low-lying areas.`
        : `Flooding possible near ${loc}. Stay alert.`;
    case "haze":
      return severity === "danger"
        ? `Unhealthy PM2.5 in ${loc}. Stay indoors; consider N95 if going out.`
        : `Elevated PM2.5 in ${loc}. Limit outdoor activity.`;
    case "dengue":
      return severity === "danger"
        ? `High-risk dengue cluster near ${loc}. Use repellent; avoid bites.`
        : `Active dengue cluster near ${loc}. Remove stagnant water; protect yourself.`;
    case "wind":
      return severity === "danger"
        ? `Damaging winds in ${loc}. Stay indoors; avoid coastal/open areas.`
        : `Strong winds in ${loc}. Secure loose items; ride/drive with care.`;
    case "heat":
      return severity === "danger"
        ? `Extreme heat in ${loc}${hi ? ` (HI ≈ ${hi}°C)` : ""}. Stay in shade/AC; check on the vulnerable.`
        : `High heat in ${loc}${hi ? ` (HI ≈ ${hi}°C)` : ""}. Reduce strenuous activity; hydrate.`;
    default:
      return "Stay alert and stay safe.";
  }
}

/* --------- NEW: compact hazard snapshot for inbox ----------- */
function snapshotHazard(h) {
  if (!h) return null;
  const { kind, severity, title, locationName, metrics, locationCoords } = h;
  return {
    kind,
    severity,
    title,
    locationName,
    metrics: metrics ?? null,
    locationCoords: locationCoords ?? null,
  };
}

/* ----------------- Main: send + record once ------------------ */
const _lastByKind = {};

export async function maybeNotifyHazard(hazard) {
  if (!hazard) return;

  const enabled = _notifyEnabledCache ?? (await getNotificationsEnabled());
  if (!enabled) return;

  const kind = hazard.kind;
  const ALLOWED = new Set(["flood", "haze", "dengue", "wind", "heat"]);
  if (!ALLOWED.has(kind)) return;

  const now = Date.now();
  if (_lastByKind[kind] && now - _lastByKind[kind] < 60_000) return;
  _lastByKind[kind] = now;

  const title = hazard.title || TITLE_FOR[kind] || "Hazard Alert";
  const body = buildBody(hazard);

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });

  const entry = {
    id: `${now}-${kind}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    severity: hazard.severity || "safe",
    title,
    body,
    time: now,
    read: false,
    hazard: snapshotHazard(hazard),
  };
  await appendToLog(entry);
}
