// utils/notify.js
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEY_NOTIFY_ENABLED = "notify:enabled";
let _notifyEnabledCache = null;

Notifications.setNotificationHandler({
  handleNotification: async () => {
    // respect the toggle even for foreground delivery
    const enabled = _notifyEnabledCache ?? (await getNotificationsEnabled());
    return {
      shouldShowAlert: !!enabled,
      shouldPlaySound: !!enabled,
      shouldSetBadge: false,
    };
  },
});

export async function initNotifications() {
  // default ON unless user turned it off before
  const enabled = await getNotificationsEnabled();

  // Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  // Only ask for permission if user actually wants notifications
  if (enabled) {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) await Notifications.requestPermissionsAsync();
  }
  else {
        // If disabled at startup, clear any scheduled notifications.  
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

// fire an alert only if notifications are enabled
export async function maybeNotifyFlood(hazard) {
  if (!hazard || hazard.kind !== "flood") return;

  const enabled = _notifyEnabledCache ?? (await getNotificationsEnabled());
  if (!enabled) return; // <-- respect user toggle

  // simple session debounce to avoid spamming
  const now = Date.now();
  if (maybeNotifyFlood._last && now - maybeNotifyFlood._last < 60_000) return;
  maybeNotifyFlood._last = now;

  const loc = hazard.locationName || "Clementi Park";
  const title = hazard.title || "Flash Flood Warning";
  const body =
    hazard.severity === "high"
      ? `Severe flooding risk detected near ${loc}. Avoid low-lying areas.`
      : `Flooding possible near ${loc}. Stay alert.`;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}
