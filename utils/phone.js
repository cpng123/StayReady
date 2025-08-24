// utils/phone.js
import { Platform } from "react-native";

// Return true if it's an SG mobile (8 digits, starts 8 or 9)
export function isValidSGMobileDigits(d) {
  return /^\d{8}$/.test(d) && /^[89]/.test(d[0]);
}

// Normalize to E.164 (+65XXXXXXXX). Returns string or null.
export function normalizeSGToE164(input) {
  const raw = String(input || "").replace(/\D/g, ""); // keep digits only
  // If user typed a full +65… E.164, trim to last 8 and revalidate
  if (/^\+65\d{8}$/.test(String(input || ""))) return String(input);
  if (isValidSGMobileDigits(raw)) return `+65${raw}`;
  return null;
}

// Deep-link helpers (same as before, SG-only)
export function makeSmsUrl(e164, body = "") {
  const enc = encodeURIComponent(body);
  return Platform.select({
    ios: `sms:${e164}&body=${enc}`,
    android: `sms:${e164}?body=${enc}`,
  });
}

export function makeWhatsAppUrl(e164, text = "") {
  const enc = encodeURIComponent(text);
  // WA prefers country code without the '+' in this param
  return `whatsapp://send?phone=${e164.replace("+", "")}&text=${enc}`;
}
