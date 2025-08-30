/**
 * File: utils/locationService.js
 * Purpose: Provide location utilities for StayReady, including:
 *  - OneMap token management (fetch, cache, and early refresh)
 *  - Reverse geocoding via OneMap (address/postal lookup)
 *  - Demo location toggle for predictable testing
 *  - GPS coordinate retrieval with Expo Location
 *  - Coarse region inference (N/E/W/C/S) as a network-free fallback
 *
 * External API:
 *  - OneMap Singapore: https://www.onemap.gov.sg/docs/ (token lasts ~3 days)
 *
 * Storage keys:
 *  - K_TOKEN / K_TOKEN_EXP: cached OneMap token + expiry (ms epoch)
 *  - K_DEMO_LOC: boolean flag to return a fixed “demo” location
 *
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

/* ---------------- OneMap token config (replace with env in production) --------------- */
const ONEMAP_EMAIL = "fypstayready@gmail.com"; // TODO: move to env
const ONEMAP_PASSWORD = "StayReady-Grade-Only-2025!"; // TODO: move to env
const TOKEN_URL = "https://www.onemap.gov.sg/api/auth/post/getToken";
const REVGEOCODE_URL = "https://www.onemap.gov.sg/api/public/revgeocode";

/* ----------------------------------- Storage keys ----------------------------------- */
const K_TOKEN = "onemap:token";
const K_TOKEN_EXP = "onemap:tokenExp"; // ms since epoch
const K_DEMO_LOC = "location:demoEnabled";

/* -------------------------- Early refresh window (~2.5 days) ------------------------ */
const REFRESH_EARLY_MS = 2.5 * 24 * 60 * 60 * 1000;

/* --------------------- Token: get cached or fetch a fresh one ----------------------- */
// Returns a valid OneMap token (reads cache first, refreshes if expired).
export async function getOneMapToken() {
  try {
    const [token, expRaw] = await Promise.all([
      AsyncStorage.getItem(K_TOKEN),
      AsyncStorage.getItem(K_TOKEN_EXP),
    ]);
    const exp = expRaw ? Number(expRaw) : 0;
    if (token && exp && Date.now() < exp) return token;
  } catch {}

  // Fetch new token from OneMap auth endpoint
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ONEMAP_EMAIL, password: ONEMAP_PASSWORD }),
  });
  const j = await res.json();

  // OneMap may return different field names across versions
  const token =
    j?.access_token || j?.token || j?.accessToken || j?.AccessToken || "";
  if (!token) throw new Error("OneMap token fetch failed");

  // Use server expiry when available; else refresh a bit early ourselves
  let expAt = Date.now() + REFRESH_EARLY_MS;
  const serverExp = j?.expiry_timestamp || j?.expires_at || j?.expires_in; // seconds if number
  if (serverExp) {
    if (typeof serverExp === "number") expAt = Date.now() + serverExp * 1000;
    else {
      const t = Date.parse(serverExp);
      if (!Number.isNaN(t)) expAt = t;
    }
  }

  try {
    await AsyncStorage.multiSet([
      [K_TOKEN, token],
      [K_TOKEN_EXP, String(expAt)],
    ]);
  } catch {}

  return token;
}

/* ----------------------------- Demo location toggles -------------------------------- */
// Persist an on/off flag that forces a fixed “Marina Bay” location.
export async function setDemoLocationEnabled(enabled) {
  try {
    await AsyncStorage.setItem(K_DEMO_LOC, enabled ? "1" : "0");
  } catch {}
}

// Read whether demo location is enabled.
export async function getDemoLocationEnabled() {
  try {
    return (await AsyncStorage.getItem(K_DEMO_LOC)) === "1";
  } catch {
    return false;
  }
}

/* ------------------------- Current coordinates (GPS or demo) ------------------------ */
// Returns { latitude, longitude, mocked } using demo coords if enabled, else GPS.
// Requests foreground permission when needed.
export async function getCurrentCoords() {
  if (await getDemoLocationEnabled()) {
    return { latitude: 1.283, longitude: 103.86, mocked: true }; // Marina Bay
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    console.warn("Location permission denied — using demo fallback");
    // Instead of throwing an error, fallback gracefully to Marina Bay
    return { latitude: 1.283, longitude: 103.86, mocked: true };
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    mocked: !!pos.mocked,
  };
}

/* ------------------------- Region heuristic (no network needed) --------------------- */
// Quick quadrant classifier for SG: North/East/West/South/Central.
export function regionFromLatLon(lat, lon) {
  if (lat >= 1.3905) return "North";
  if (lat <= 1.285) return "South";
  if (lon >= 103.9) return "East";
  if (lon <= 103.72) return "West";
  return "Central";
}

/* -------------------------------- Reverse geocoding --------------------------------- */
// Call OneMap Reverse Geocode and normalize response into a compact shape.
// Returns { addressLine, postal, building, road, block } or null when not found.
export async function reverseGeocode(lat, lon) {
  const token = await getOneMapToken();

  // Some deployments accept token in query
  const url =
    `${REVGEOCODE_URL}?location=${lat},${lon}` +
    `&addressType=All&otherFeatures=Y&token=${encodeURIComponent(token)}`;

  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const j = await r.json();

  // Handle different response shapes across versions
  const first =
    j?.GeocodeInfo?.[0] ||
    j?.results?.[0] ||
    j?.ReverseGeocodeInfo?.[0] ||
    null;

  if (!first) return null;

  const block = first.BLOCK || first.BLK_NO || "";
  const road = first.ROAD || first.ROAD_NAME || "";
  const building = first.BUILDINGNAME || first.BUILDING || "";
  const postal = first.POSTAL || first.POSTAL_CODE || "";

  const bits = [building, block && road ? `${block} ${road}` : road]
    .filter(Boolean)
    .join(", ");

  return { addressLine: bits, postal, building, road, block };
}

/* ----------------------- Friendly label: coords + address + region ------------------ */
// Returns an object with coords, coarse region, and (when available) reverse-geocoded fields.
// Never throws on reverse geocode failure; falls back to region-only.
export async function resolveLocationLabel() {
  const { latitude, longitude, mocked } = await getCurrentCoords();

  let addr = null;
  try {
    addr = await reverseGeocode(latitude, longitude);
  } catch {
    // Ignore errors; we still return region + raw coords
  }

  const region = regionFromLatLon(latitude, longitude);

  return {
    coords: { latitude, longitude },
    region,
    mocked,
    address: addr?.addressLine || null,
    postal: addr?.postal || null,
    building: addr?.building || null,
    road: addr?.road || null,
    block: addr?.block || null,
  };
}
