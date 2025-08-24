// utils/emergencyContacts.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Network from "expo-network";
import * as SMS from "expo-sms";
import { Linking, Platform } from "react-native";

/* -------------------- storage keys -------------------- */
const CONTACTS_KEY = "emergency:contacts";
const TEST_MODE_KEY = "emergency:testMode";

/* -------------------- CRUD -------------------- */
export async function getContacts() {
  try {
    const raw = await AsyncStorage.getItem(CONTACTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export async function saveContacts(list) {
  try {
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(list || []));
  } catch {}
}

export async function setTestMode(on) {
  try {
    await AsyncStorage.setItem(TEST_MODE_KEY, on ? "1" : "0");
  } catch {}
}
export async function getTestMode() {
  try {
    return (await AsyncStorage.getItem(TEST_MODE_KEY)) === "1";
  } catch {
    return false;
  }
}

/* -------------------- connectivity helpers -------------------- */
async function hasInternet() {
  try {
    const s = await Network.getNetworkStateAsync();
    return !!(s?.isConnected && (s.isInternetReachable ?? true));
  } catch {
    return false;
  }
}
async function hasWhatsApp() {
  try {
    return await Linking.canOpenURL("whatsapp://send?text=hi");
  } catch {
    return false;
  }
}
const enc = (s) => encodeURIComponent(s || "");

/* -------------------- message builder (with GPS) -------------------- */
export async function buildEmergencyMessage() {
  let body = "🚨 EMERGENCY: I need help. Please contact me ASAP.";
  let mapsLines = [];
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lon, accuracy } = pos?.coords || {};
      if (lat && lon) {
        mapsLines.push(
          `GPS: ${lat.toFixed(6)}, ${lon.toFixed(6)} (±${Math.round(
            accuracy || 0
          )}m)`
        );
        mapsLines.push(
          `Google Maps: https://maps.google.com/?q=${lat},${lon}`
        );
        mapsLines.push(`Apple Maps: https://maps.apple.com/?ll=${lat},${lon}`);
        mapsLines.push(`geo:${lat},${lon}?q=${lat},${lon}(SOS)`);
      }
    } else {
      mapsLines.push("Location permission not granted.");
    }
  } catch {
    mapsLines.push("Location unavailable.");
  }
  const ts = new Date().toLocaleString();
  return `${body}\n\n${mapsLines.join("\n")}\n\nTime: ${ts}`;
}

/* -------------------- channel openers (SMS + WhatsApp only) -------------------- */
async function openWhatsApp(phone, text) {
  // WhatsApp expects country code WITHOUT '+' in wa.me / app scheme
  const digits = (phone || "").replace(/[^\d]/g, ""); // e.g. "+65XXXXXXXX" -> "65XXXXXXXX"
  const app = `whatsapp://send?phone=${digits}&text=${enc(text)}`;
  const web = `https://wa.me/${digits}?text=${enc(text)}`;
  try {
    await Linking.openURL(app);
  } catch {
    await Linking.openURL(web);
  }
}

async function openSMS(phone, text) {
  const avail = await SMS.isAvailableAsync();
  if (avail) {
    // Opens system Messages UI; resolves when user comes back
    await SMS.sendSMSAsync([phone], text);
  } else {
    // Fallback deep link
    const scheme = `sms:${phone}${
      Platform.OS === "ios" ? "&" : "?"
    }body=${enc(text)}`;
    await Linking.openURL(scheme);
  }
}

/* -------------------- dispatch (auto: SMS then WA if online) -------------------- */
export async function dispatchToContact(
  contact,
  message,
  { testMode = false } = {}
) {
  if (!contact) return { ok: false, reason: "bad-contact" };
  if (testMode) return { ok: true, simulated: true };

  const ch = contact.channel || "auto";
  const val = contact.value || "";

  try {
    if (ch === "auto") {
      const online = await hasInternet();
      await openSMS(val, message);
      if (online && (await hasWhatsApp())) {
        await openWhatsApp(val, message); // after SMS returns
      }
      return { ok: true };
    }

    if (ch === "sms") {
      await openSMS(val, message);
      return { ok: true };
    }

    if (ch === "whatsapp") {
      await openWhatsApp(val, message);
      return { ok: true };
    }

    return { ok: false, reason: "unknown-channel" }; // unreachable with our editor (auto only)
  } catch (e) {
    return { ok: false, reason: e?.message || "failed" };
  }
}

/**
 * Dispatch to all contacts sequentially (avoids stacking multiple system SMS UIs).
 * Returns { message, results, testMode } where results is an array of {ok,reason?}.
 */
export async function dispatchEmergency(contacts) {
  const message = await buildEmergencyMessage();
  const testMode = await getTestMode();

  const results = [];
  for (const c of contacts || []) {
    const r = await dispatchToContact(c, message, { testMode });
    results.push(r);
  }
  return { message, results, testMode };
}
