/**
 * File: utils/phone.js
 * Purpose: Lightweight helpers for Singapore phone numbers:
 *  - Validate local mobile numbers (8 digits starting with 8 or 9).
 *  - Normalize user input to E.164 format (+65XXXXXXXX).
 *  - Build deep-link URLs for SMS and WhatsApp (SG-only).
 *
 * Notes:
 *  - These functions do not send messages; they only return strings/URLs.
 *    Use `Linking.openURL(url)` to launch an app with the generated link.
 *  - E.164 normalization assumes Singapore numbers only.
 */

import { Platform } from "react-native";

// True if an SG mobile number in local format (8 digits, starts with 8 or 9)
export function isValidSGMobileDigits(d) {
  return /^\d{8}$/.test(d) && /^[89]/.test(d[0]);
}

// Normalize arbitrary input to E.164 (+65XXXXXXXX). Returns string or null if invalid.
export function normalizeSGToE164(input) {
  const raw = String(input || "").replace(/\D/g, ""); // strip non-digits
  // If already in +65XXXXXXXX, keep as-is
  if (/^\+65\d{8}$/.test(String(input || ""))) return String(input);
  // Local 8-digit → prefix +65
  if (isValidSGMobileDigits(raw)) return `+65${raw}`;
  return null;
}

// Build an sms: deep link with prefilled body (platform-specific query param)
export function makeSmsUrl(e164, body = "") {
  const enc = encodeURIComponent(body);
  return Platform.select({
    ios: `sms:${e164}&body=${enc}`,
    android: `sms:${e164}?body=${enc}`,
  });
}

// Build a WhatsApp deep link (phone without '+' in wa param; text URL-encoded)
export function makeWhatsAppUrl(e164, text = "") {
  const enc = encodeURIComponent(text);
  return `whatsapp://send?phone=${e164.replace("+", "")}&text=${enc}`;
}
