// utils/locationService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

/**
 * OneMap: token-based endpoints
 * Docs: https://www.onemap.gov.sg/docs/
 * Token lasts ~3 days. We refresh a little early.
 */
const ONEMAP_EMAIL = "fypstayready@gmail.com";
const ONEMAP_PASSWORD = "StayReady-Grade-Only-2025!";
const TOKEN_URL = "https://www.onemap.gov.sg/api/auth/post/getToken";
const REVGEOCODE_URL = "https://www.onemap.gov.sg/api/public/revgeocode";

const K_TOKEN = "onemap:token";
const K_TOKEN_EXP = "onemap:tokenExp"; // ms since epoch
const K_DEMO_LOC = "location:demoEnabled";

// ~2.5 days (in ms). We proactively refresh before the 3-day expiry window.
const REFRESH_EARLY_MS = 2.5 * 24 * 60 * 60 * 1000;

/** Get a cached token or fetch a new one with the embedded credentials. */
export async function getOneMapToken() {
  try {
    const [token, expRaw] = await Promise.all([
      AsyncStorage.getItem(K_TOKEN),
      AsyncStorage.getItem(K_TOKEN_EXP),
    ]);
    const exp = expRaw ? Number(expRaw) : 0;
    if (token && exp && Date.now() < exp) return token;
  } catch {}

  // Fetch new token
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ONEMAP_EMAIL, password: ONEMAP_PASSWORD }),
  });
  const j = await res.json();

  // OneMap returns "access_token" (and sometimes an expiry field).
  const token =
    j?.access_token || j?.token || j?.accessToken || j?.AccessToken || "";
  if (!token) throw new Error("OneMap token fetch failed");

  // If API returns an expiry, use it; otherwise set our own proactive window.
  let expAt = Date.now() + REFRESH_EARLY_MS;
  const serverExp =
    j?.expiry_timestamp || j?.expires_at || j?.expires_in /* seconds */;
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

/** Toggle demo location (Marina Bay). */
export async function setDemoLocationEnabled(enabled) {
  try {
    await AsyncStorage.setItem(K_DEMO_LOC, enabled ? "1" : "0");
  } catch {}
}
export async function getDemoLocationEnabled() {
  try {
    return (await AsyncStorage.getItem(K_DEMO_LOC)) === "1";
  } catch {
    return false;
  }
}

/** If demo is enabled, return Marina Bay coords; otherwise prompt & get GPS. */
export async function getCurrentCoords() {
  if (await getDemoLocationEnabled()) {
    return { latitude: 1.283, longitude: 103.860, mocked: true };
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Location permission denied");

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    mocked: !!pos.mocked,
  };
}

/** Heuristic region classifier as a graceful fallback (no network). */
export function regionFromLatLon(lat, lon) {
  if (lat >= 1.3905) return "North";
  if (lat <= 1.285) return "South";
  if (lon >= 103.90) return "East";
  if (lon <= 103.72) return "West";
  return "Central";
}

/**
 * Reverse geocode via OneMap.
 * Returns: { addressLine, postal, building, road, block }
 */
export async function reverseGeocode(lat, lon) {
  const token = await getOneMapToken();

  // OneMap reverse geocode (token-based). Some deployments accept token in query.
  const url =
    `${REVGEOCODE_URL}?location=${lat},${lon}` +
    `&addressType=All&otherFeatures=Y&token=${encodeURIComponent(token)}`;

  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const j = await r.json();

  // Handle different result shapes across versions
  const first =
    j?.GeocodeInfo?.[0] || j?.results?.[0] || j?.ReverseGeocodeInfo?.[0] || null;

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

/**
 * Resolve a user-friendly label:
 *  - tries OneMap reverse geocode (address + postal)
 *  - always includes a coarse Region (N/E/W/C/S)
 */
export async function resolveLocationLabel() {
  const { latitude, longitude, mocked } = await getCurrentCoords();

  let addr = null;
  try {
    addr = await reverseGeocode(latitude, longitude);
  } catch {
    // ignore -> fall back to heuristics only
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
