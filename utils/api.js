// utils/api.js
// Open Government Products, data.gov.sg — Real-time weather
// Base: https://api-open.data.gov.sg/v2/real-time/api
// Dengue dataset (GEOJSON) via public datasets API v1
import AsyncStorage from "@react-native-async-storage/async-storage";

async function setCache(key, data) {
  try { await AsyncStorage.setItem(key, JSON.stringify({ _ts: Date.now(), data })); }
  catch {}
}
async function getCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/**
 * Wrap a fetcher with cache + stale-if-error.
 * - fetcher: () => Promise<any>
 * - opts: { cacheKey, softTtlMs, hardTtlMs }
 *   softTtlMs: if cached && age <= softTtlMs → use cache to render fast (optional)
 *   hardTtlMs: max age allowed when using cache on error; beyond this, throw
 */
async function withCache(fetcher, { cacheKey, softTtlMs = 0, hardTtlMs }) {
  const cached = await getCache(cacheKey);
  const ageMs = cached ? (Date.now() - cached._ts) : Infinity;

  // Optional: serve quickly if cache is fresh (SWR pattern)
  if (softTtlMs && cached && ageMs <= softTtlMs) {
    // kick off a background refresh (fire-and-forget)
    fetcher().then((fresh) => setCache(cacheKey, fresh)).catch(() => {});
    return { data: cached.data, _stale: false, _ageMs: ageMs };
  }

  try {
    const fresh = await fetcher();
    setCache(cacheKey, fresh);
    return { data: fresh, _stale: false, _ageMs: 0 };
  } catch (err) {
    // stale-if-error: only use cache if it’s not older than hardTtlMs
    if (cached && ageMs <= hardTtlMs) {
      return { data: cached.data, _stale: true, _ageMs: ageMs, _error: err };
    }
    throw err;
  }
}

const API_BASE = "https://api-open.data.gov.sg/v2/real-time/api";
const DATASET_API_BASE = "https://api-open.data.gov.sg/v1/public/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function requestJSON(
  url,
  { headers = {}, timeoutMs = 8000, retries = 1 } = {}
) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(
        `HTTP ${res.status} ${res.statusText} at ${url}\n${text}`
      );
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } catch (err) {
    // Retry on transient errors
    const transient =
      err.name === "AbortError" ||
      err.status === 429 ||
      (err.status >= 500 && err.status <= 599);
    if (retries > 0 && transient) {
      await sleep(500);
      return requestJSON(url, { headers, timeoutMs, retries: retries - 1 });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function buildUrl(base, path, params = {}) {
  const url = new URL(`${base}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) {
      url.searchParams.set(k, v);
    }
  });
  return url.toString();
}

function buildRealTimeUrl(path, params) {
  return buildUrl(API_BASE, path, params);
}

/* ---------------------------
 * RAINFALL (mm, 5-min)
 * GET /rainfall
 * --------------------------*/
export async function fetchRainfall({ date, paginationToken, apiKey } = {}) {
  const url = buildRealTimeUrl("/rainfall", { date, paginationToken });
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return requestJSON(url, { headers, timeoutMs: 8000, retries: 1 });
}

export function mapRainfallToPoints(json) {
  const data = json?.data || {};
  const stations = data.stations || [];
  const readings = data.readings || [];
  const unit = data.readingUnit || "mm";

  const ts = readings[0]?.timestamp || null;
  const list = readings[0]?.data || [];

  const stationById = new Map(stations.map((s) => [s.id || s.deviceId, s]));
  const points = list
    .map((r) => {
      const s = stationById.get(r.stationId) || {};
      const lat =
        s.labelLocation?.latitude ??
        s.location?.latitude ??
        s.Location?.Latitude ??
        null;
      const lon =
        s.labelLocation?.longitude ??
        s.location?.longitude ??
        s.Location?.Longitude ??
        null;
      return {
        id: r.stationId,
        name: s.name || r.stationId,
        lat,
        lon,
        value:
          typeof r.value === "number"
            ? r.value
            : r.value == null
            ? null
            : Number(r.value),
      };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  return { timestamp: ts, unit, points };
}

export async function getRainfallLatest({ apiKey } = {}) {
  const fetcher = () => fetchRainfall({ apiKey });
  const { data, _stale, _ageMs } = await withCache(fetcher, {
    cacheKey: "cache:rainfall:latest",
    hardTtlMs: 15 * 60 * 1000,  // 15 min
    softTtlMs: 0                // or 90*1000 if you want SWR
  });
  const mapped = mapRainfallToPoints(data);
  return { ...mapped, _stale, _ageMs };
}
export async function getRainfallAt(dateStr, { apiKey } = {}) {
  const json = await fetchRainfall({ date: dateStr, apiKey });
  return mapRainfallToPoints(json);
}

/* ---------------------------
 * WIND SPEED (knots)
 * GET /wind-speed
 * --------------------------*/
export async function fetchWindSpeed({ date, paginationToken, apiKey } = {}) {
  const url = buildRealTimeUrl("/wind-speed", { date, paginationToken });
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return requestJSON(url, { headers, timeoutMs: 8000, retries: 1 });
}

export function mapWindToPoints(json) {
  const data = json?.data || {};
  const stations = data.stations || [];
  const readings = data.readings || [];
  const unit = data.readingUnit || "knots";

  const ts = readings[0]?.timestamp || null;
  const list = readings[0]?.data || [];

  const stationById = new Map(stations.map((s) => [s.id || s.deviceId, s]));
  const points = list
    .map((r) => {
      const s = stationById.get(r.stationId) || {};
      const lat = s.labelLocation?.latitude ?? s.location?.latitude ?? null;
      const lon = s.labelLocation?.longitude ?? s.location?.longitude ?? null;
      return {
        id: r.stationId,
        name: s.name || r.stationId,
        lat,
        lon,
        value:
          typeof r.value === "number"
            ? r.value
            : r.value == null
            ? null
            : Number(r.value), // knots
      };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  return { timestamp: ts, unit, points };
}

export async function getWindLatest({ apiKey } = {}) {
  const json = await fetchWindSpeed({ apiKey });
  return mapWindToPoints(json);
}
export async function getWindAt(dateStr, { apiKey } = {}) {
  const json = await fetchWindSpeed({ date: dateStr, apiKey });
  return mapWindToPoints(json);
}

/* ---------------------------
 * AIR TEMPERATURE (°C)
 * GET /air-temperature
 * --------------------------*/
export async function fetchAirTemperature({
  date,
  paginationToken,
  apiKey,
} = {}) {
  const url = buildRealTimeUrl("/air-temperature", { date, paginationToken });
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return requestJSON(url, { headers, timeoutMs: 8000, retries: 1 });
}

export function mapTempToPoints(json) {
  const data = json?.data || {};
  const stations = data.stations || [];
  const readings = data.readings || [];

  const ts = readings[0]?.timestamp || null;
  const list = readings[0]?.data || [];

  const stationById = new Map(stations.map((s) => [s.id || s.deviceId, s]));
  const points = list
    .map((r) => {
      const s = stationById.get(r.stationId) || {};
      const lat = s.labelLocation?.latitude ?? s.location?.latitude ?? null;
      const lon = s.labelLocation?.longitude ?? s.location?.longitude ?? null;
      return {
        id: r.stationId,
        name: s.name || r.stationId,
        lat,
        lon,
        value: r.value == null ? null : Number(r.value), // °C
      };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  return { timestamp: ts, unit: "°C", points };
}

export async function getAirTemperatureLatest({ apiKey } = {}) {
  const fetcher = () => fetchAirTemperature({ apiKey });
  const { data, _stale, _ageMs } = await withCache(fetcher, {
    cacheKey: "cache:temp:latest",
    hardTtlMs: 60 * 60 * 1000
  });
  return { ...mapTempToPoints(data), _stale, _ageMs };
}
export async function getAirTemperatureAt(dateStr, { apiKey } = {}) {
  const json = await fetchAirTemperature({ date: dateStr, apiKey });
  return mapTempToPoints(json);
}

/* ---------------------------
 * RELATIVE HUMIDITY (%)
 * GET /relative-humidity
 * --------------------------*/
export async function fetchRelativeHumidity({ date, paginationToken, apiKey } = {}) {
  const url = buildRealTimeUrl("/relative-humidity", { date, paginationToken });
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return requestJSON(url, { headers, timeoutMs: 8000, retries: 1 });
}

export function mapHumidityToPoints(json) {
  const data = json?.data || {};
  const stations = data.stations || [];
  const readings = data.readings || [];

  const ts = readings[0]?.timestamp || null;
  const list = readings[0]?.data || [];

  const stationById = new Map(stations.map((s) => [s.id || s.deviceId, s]));
  const points = list
    .map((r) => {
      const s = stationById.get(r.stationId) || {};
      const lat = s.labelLocation?.latitude ?? s.location?.latitude ?? null;
      const lon = s.labelLocation?.longitude ?? s.location?.longitude ?? null;
      return {
        id: r.stationId,
        name: s.name || r.stationId,
        lat,
        lon,
        value: r.value == null ? null : Number(r.value), // %
      };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  return { timestamp: ts, unit: "%", points };
}

export async function getRelativeHumidityLatest({ apiKey } = {}) {
  const fetcher = () => fetchRelativeHumidity({ apiKey });
  const { data, _stale, _ageMs } = await withCache(fetcher, {
    cacheKey: "cache:rh:latest",
    hardTtlMs: 60 * 60 * 1000
  });
  return { ...mapHumidityToPoints(data), _stale, _ageMs };
}
export async function getRelativeHumidityAt(dateStr, { apiKey } = {}) {
  const json = await fetchRelativeHumidity({ date: dateStr, apiKey });
  return mapHumidityToPoints(json);
}

/* ---------------------------
 * PM2.5 (µg/m³) — regional
 * GET /pm25
 * --------------------------*/
export async function fetchPM25({ date, paginationToken, apiKey } = {}) {
  const url = buildRealTimeUrl("/pm25", { date, paginationToken });
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return requestJSON(url, { headers, timeoutMs: 8000, retries: 1 });
}

export function mapPM25ToPoints(json) {
  const data = json?.data || {};
  const meta = data.regionMetadata || data.region_metadata || [];
  const items = data.items || [];
  const ts = items[0]?.timestamp || null;
  const readings = items[0]?.readings?.pm25_one_hourly || {};

  const locByRegion = new Map(
    meta.map((m) => [
      String(m.name || "").toLowerCase(),
      m.labelLocation || m.location || {},
    ])
  );

  const regions = Object.keys(readings);
  const points = regions
    .filter((r) => r.toLowerCase() !== "national")
    .map((r) => {
      const loc = locByRegion.get(r.toLowerCase()) || {};
      const lat = loc.latitude ?? null;
      const lon = loc.longitude ?? null;
      return {
        id: r,
        name: r[0].toUpperCase() + r.slice(1),
        lat,
        lon,
        value: readings[r] == null ? null : Number(readings[r]),
      };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  return { timestamp: ts, unit: "µg/m³", points };
}

export async function getPM25Latest({ apiKey } = {}) {
  const fetcher = () => fetchPM25({ apiKey });
  const { data, _stale, _ageMs } = await withCache(fetcher, {
    cacheKey: "cache:pm25:latest",
    hardTtlMs: 60 * 60 * 1000
  });
  return { ...mapPM25ToPoints(data), _stale, _ageMs };
}
export async function getPM25At(dateStr, { apiKey } = {}) {
  const json = await fetchPM25({ date: dateStr, apiKey });
  return mapPM25ToPoints(json);
}

/* ---------------------------
 * DENGUE CLUSTERS (GEOJSON)
 * Dataset ID: d_dbfabf16158d1b0e1c420627c0819168
 * Flow:
 *   1) GET /v1/public/api/datasets/{id}/poll-download  -> returns { data: { url } }
 *   2) GET returned URL -> raw GeoJSON
 * --------------------------*/
const DENGUE_DATASET_ID = "d_dbfabf16158d1b0e1c420627c0819168";

export async function fetchDengueClustersGeoJSON(
  datasetId = DENGUE_DATASET_ID
) {
  const metaUrl = buildUrl(
    DATASET_API_BASE,
    `/datasets/${datasetId}/poll-download`
  );
  const metaJson = await requestJSON(metaUrl, { timeoutMs: 10000, retries: 1 });

  if (metaJson?.code !== 0 || !metaJson?.data?.url) {
    const err = new Error(`Dengue meta fetch returned bad payload`);
    err.status = 502;
    throw err;
  }

  return requestJSON(metaJson.data.url, { timeoutMs: 10000, retries: 1 });
}

export async function getDengueClustersGeoJSON() {
  // Return raw GeoJSON, suitable for L.geoJSON
  const geojson = await fetchDengueClustersGeoJSON();
  return geojson;
}

export async function getClinicsGeoJSON() {
  const datasetId = "d_548c33ea2d99e29ec63a7cc9edcccedc"; // CHAS Clinics (MOH)
  const pollUrl = `${DATASET_API_BASE}/datasets/${datasetId}/poll-download`;

  const pollJson = await requestJSON(pollUrl, {
    headers: { "Cache-Control": "no-cache" },
    timeoutMs: 10000,
    retries: 1,
  });
  if (pollJson.code !== 0 || !pollJson?.data?.url) {
    const err = new Error("clinics poll returned no url");
    err.status = 502;
    throw err;
  }

  const geojson = await requestJSON(pollJson.data.url, {
    headers: { "Cache-Control": "no-cache" },
    timeoutMs: 10000,
    retries: 1,
  });
  if (!geojson || geojson.type !== "FeatureCollection") return null;

  // NORMALIZE friendly fields from HTML "Description"
  const normFeatures = (geojson.features || []).map((f) => {
    const props = f.properties || {};
    const html = props.Description || "";

    const rx = (label) =>
      new RegExp(`<th>${label}<\\/th>\\s*<td>(.*?)<\\/td>`, "i").exec(html)?.[1] ||
      props[label];

    const name = rx("HCI_NAME") || props.Name || "Clinic";
    const tel = rx("HCI_TEL") || "";
    const blk = rx("BLK_HSE_NO") || "";
    const street = rx("STREET_NAME") || "";
    const bldg = rx("BUILDING_NAME") || "";
    const postal = rx("POSTAL_CD") || "";
    const address = [blk, street, bldg, postal && `S(${postal})`]
      .filter(Boolean)
      .join(", ");

    return { ...f, properties: { name, address, phone: tel } };
  });

  return { ...geojson, features: normFeatures };
}
