/**
 * File: utils/emergencyContacts.js
 * Purpose: Manage user emergency contacts and provide “one-tap SOS” dispatch
 *          via SMS and/or WhatsApp, including current GPS location links.
 *
 * Responsibilities:
 *  - CRUD for saved contacts in AsyncStorage.
 *  - “Test mode” switch to simulate dispatch without sending.
 *  - Build a helpful emergency message (time + GPS + map links).
 *  - Detect basic connectivity / app availability (internet, WhatsApp).
 *  - Open platform-specific channels (SMS composer, WhatsApp deep link).
 *  - Dispatch to a single contact or a list (sequential to avoid UI clashes).
 *
 * Notes:
 *  - Location permission is requested at send time; if denied/unavailable,
 *    message still sends with a note (“Location unavailable.”).
 *  - WhatsApp linking uses digits-only phone numbers (strip “+” and symbols).
 *  - SMS sending uses expo-sms when available; otherwise falls back to URL scheme.
 *  - Keep messages short and actionable; avoid PII beyond what the user intends.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Network from "expo-network";
import * as SMS from "expo-sms";
import { Linking, Platform } from "react-native";

/* -------------------- storage keys -------------------- */
const CONTACTS_KEY = "emergency:contacts";
const TEST_MODE_KEY = "emergency:testMode";

/* -------------------- CRUD -------------------- */

// Return array of saved contacts [{ id, label, channel, value }, ...]
export async function getContacts() {
  try {
    const raw = await AsyncStorage.getItem(CONTACTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Persist full contact list (overwrites entire list)
export async function saveContacts(list) {
  try {
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(list || []));
  } catch {}
}

/* -------------------- test mode flag -------------------- */

// Enable/disable test mode (no actual send)
export async function setTestMode(on) {
  try {
    await AsyncStorage.setItem(TEST_MODE_KEY, on ? "1" : "0");
  } catch {}
}

// Read test mode (boolean)
export async function getTestMode() {
  try {
    return (await AsyncStorage.getItem(TEST_MODE_KEY)) === "1";
  } catch {
    return false;
  }
}

/* -------------------- connectivity helpers -------------------- */

// Best-effort internet reachability check
async function hasInternet() {
  try {
    const s = await Network.getNetworkStateAsync();
    return !!(s?.isConnected && (s.isInternetReachable ?? true));
  } catch {
    return false;
  }
}

// Check if WhatsApp can handle a send intent
async function hasWhatsApp() {
  try {
    return await Linking.canOpenURL("whatsapp://send?text=hi");
  } catch {
    return false;
  }
}

const enc = (s) => encodeURIComponent(s || "");

/* -------------------- message builder (with GPS) -------------------- */

// Build a concise SOS message including GPS (if permitted) and map links
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

// Open WhatsApp prefilled to a phone number with text (digits only for wa.me/app)
async function openWhatsApp(phone, text) {
  const digits = (phone || "").replace(/[^\d]/g, ""); // "+65 8123 4567" -> "6581234567"
  const app = `whatsapp://send?phone=${digits}&text=${enc(text)}`;
  const web = `https://wa.me/${digits}?text=${enc(text)}`;
  try {
    await Linking.openURL(app);
  } catch {
    await Linking.openURL(web);
  }
}

// Open system SMS composer (expo-sms) or fall back to sms: URL scheme
async function openSMS(phone, text) {
  const avail = await SMS.isAvailableAsync();
  if (avail) {
    // Opens Messages UI; promise resolves when user returns
    await SMS.sendSMSAsync([phone], text);
  } else {
    const scheme = `sms:${phone}${
      Platform.OS === "ios" ? "&" : "?"
    }body=${enc(text)}`;
    await Linking.openURL(scheme);
  }
}

/* -------------------- dispatch (auto: SMS then WA if online) -------------------- */

// Send to a single contact using chosen channel (auto → SMS then WA if online)
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
      await openSMS(val, message); // always try SMS first (works offline)
      if (online && (await hasWhatsApp())) {
        await openWhatsApp(val, message); // then WhatsApp if available
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

    return { ok: false, reason: "unknown-channel" };
  } catch (e) {
    return { ok: false, reason: e?.message || "failed" };
  }
}

// Dispatch to all contacts sequentially (avoids multiple SMS composers at once)
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
