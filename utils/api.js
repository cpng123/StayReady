/**
 * File: utils/api.js
 * Purpose: Fetch Singapore real-time environmental data (rainfall, wind, temperature,
 * humidity, PM2.5) and public GeoJSON datasets (e.g., dengue clusters) from
 * data.gov.sg / Open Government Products APIs, with caching and graceful
 * stale-if-error fallbacks.
 *
 * Responsibilities:
 *  - Provide small, focused fetchers for each dataset endpoint.
 *  - Map raw API payloads into normalized point lists (lat, lon, value, unit).
 *  - Wrap requests with retry, timeout, and on-disk caching via AsyncStorage.
 *  - Expose “latest” helpers that return data plus cache metadata (stale/age).
 *
 * External APIs:
 *  - Real-time Weather (OGP): https://api-open.data.gov.sg/v2/real-time/api
 *    Endpoints used: /rainfall, /wind-speed, /air-temperature, /relative-humidity, /pm25
 *  - Public Datasets (v1): https://api-open.data.gov.sg/v1/public/api
 *    Flow: /datasets/{id}/poll-download → signed URL → GeoJSON
 *
 * Data shapes & units (subject to change by provider):
 *  - Rainfall: mm per 5 minutes (point stations)
 *  - Wind speed: knots (point stations)
 *  - Air temperature: °C (point stations)
 *  - Relative humidity: % (point stations)
 *  - PM2.5: µg/m³ (regional centroids, not stations)
 *  - Dengue clusters: GeoJSON FeatureCollection
 *
 */

/* ============================================================================
 * Cache helpers
 * ==========================================================================*/
import AsyncStorage from "@react-native-async-storage/async-storage";

// Persist data with a timestamp (ms since epoch) under a cache key.
async function setCache(key, data) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ _ts: Date.now(), data }));
  } catch {}
}

// Persist data with a timestamp (ms since epoch) under a cache key.
async function getCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Wrap a fetcher with cache + stale-if-error logic.
 * - If `softTtlMs` is set and cache is fresh, returns cached immediately and
 *   refreshes in the background.
 * - On error, returns cached copy if age ≤ `hardTtlMs` and marks `_stale:true`.
 */
async function withCache(fetcher, { cacheKey, softTtlMs = 0, hardTtlMs }) {
  const cached = await getCache(cacheKey);
  const ageMs = cached ? Date.now() - cached._ts : Infinity;

  // Serve from cache immediately if fresh (SWR pattern), and refresh in background.
  if (softTtlMs && cached && ageMs <= softTtlMs) {
    fetcher()
      .then((fresh) => setCache(cacheKey, fresh))
      .catch(() => {});
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

/* ============================================================================
 * Request helpers
 * ==========================================================================*/

const API_BASE = "https://api-open.data.gov.sg/v2/real-time/api";
const DATASET_API_BASE = "https://api-open.data.gov.sg/v1/public/api";

// Sleep helper (used between retries).
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Fetch JSON with timeout + minimal retry on transient errors.
// Retries on: AbortError, 429, and 5xx once by default.
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

// Build a URL with query params.
function buildUrl(base, path, params = {}) {
  const url = new URL(`${base}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) {
      url.searchParams.set(k, v);
    }
  });
  return url.toString();
}

// Build a full URL for real-time API.
function buildRealTimeUrl(path, params) {
  return buildUrl(API_BASE, path, params);
}

/* ============================================================================
 * Rainfall (mm, 5-min) — /rainfall
 * ==========================================================================*/
// Fetch rainfall JSON from real-time API.
export async function fetchRainfall({ date, paginationToken, apiKey } = {}) {
  const url = buildRealTimeUrl("/rainfall", { date, paginationToken });
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return requestJSON(url, { headers, timeoutMs: 8000, retries: 1 });
}

// Normalize rainfall payload to station points with units.
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

// Get latest rainfall with caching metadata.
export async function getRainfallLatest({ apiKey } = {}) {
  const fetcher = () => fetchRainfall({ apiKey });
  const { data, _stale, _ageMs } = await withCache(fetcher, {
    cacheKey: "cache:rainfall:latest",
    hardTtlMs: 15 * 60 * 1000, // 15 min
    softTtlMs: 0, // set e.g. 90*1000 for SWR
  });
  const mapped = mapRainfallToPoints(data);
  return { ...mapped, _stale, _ageMs };
}

// Get rainfall at a specific timestamp string.
export async function getRainfallAt(dateStr, { apiKey } = {}) {
  const json = await fetchRainfall({ date: dateStr, apiKey });
  return mapRainfallToPoints(json);
}

/* ============================================================================
 * Wind speed (knots) — /wind-speed
 * ==========================================================================*/

// Fetch wind speed JSON.
export async function fetchWindSpeed({ date, paginationToken, apiKey } = {}) {
  const url = buildRealTimeUrl("/wind-speed", { date, paginationToken });
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return requestJSON(url, { headers, timeoutMs: 8000, retries: 1 });
}

// Normalize wind payload to station points (knots).
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

// Get latest wind speed.
export async function getWindLatest({ apiKey } = {}) {
  const json = await fetchWindSpeed({ apiKey });
  return mapWindToPoints(json);
}

// Get wind speed at a specific timestamp string.
export async function getWindAt(dateStr, { apiKey } = {}) {
  const json = await fetchWindSpeed({ date: dateStr, apiKey });
  return mapWindToPoints(json);
}

/* ============================================================================
 * Air temperature (°C) — /air-temperature
 * ==========================================================================*/

// Fetch air temperature JSON.
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

// Normalize temperature payload to station points (°C).
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

// Get latest air temperature with caching metadata.
export async function getAirTemperatureLatest({ apiKey } = {}) {
  const fetcher = () => fetchAirTemperature({ apiKey });
  const { data, _stale, _ageMs } = await withCache(fetcher, {
    cacheKey: "cache:temp:latest",
    hardTtlMs: 60 * 60 * 1000,
  });
  return { ...mapTempToPoints(data), _stale, _ageMs };
}

// Get air temperature at a specific timestamp string.
export async function getAirTemperatureAt(dateStr, { apiKey } = {}) {
  const json = await fetchAirTemperature({ date: dateStr, apiKey });
  return mapTempToPoints(json);
}

/* ============================================================================
 * Relative humidity (%) — /relative-humidity
 * ==========================================================================*/

// Fetch relative humidity JSON.
export async function fetchRelativeHumidity({
  date,
  paginationToken,
  apiKey,
} = {}) {
  const url = buildRealTimeUrl("/relative-humidity", { date, paginationToken });
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return requestJSON(url, { headers, timeoutMs: 8000, retries: 1 });
}

// Normalize humidity payload to station points (%).
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

// Get latest relative humidity with cache metadata.
export async function getRelativeHumidityLatest({ apiKey } = {}) {
  const fetcher = () => fetchRelativeHumidity({ apiKey });
  const { data, _stale, _ageMs } = await withCache(fetcher, {
    cacheKey: "cache:rh:latest",
    hardTtlMs: 60 * 60 * 1000,
  });
  return { ...mapHumidityToPoints(data), _stale, _ageMs };
}

// Get relative humidity at a specific timestamp string.
export async function getRelativeHumidityAt(dateStr, { apiKey } = {}) {
  const json = await fetchRelativeHumidity({ date: dateStr, apiKey });
  return mapHumidityToPoints(json);
}

/* ============================================================================
 * PM2.5 (µg/m³, regional) — /pm25
 * ==========================================================================*/

// Fetch PM2.5 JSON.
export async function fetchPM25({ date, paginationToken, apiKey } = {}) {
  const url = buildRealTimeUrl("/pm25", { date, paginationToken });
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return requestJSON(url, { headers, timeoutMs: 8000, retries: 1 });
}

// Normalize PM2.5 payload to regional points (uses region centroids).
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

// Get latest PM2.5 with cache metadata.
export async function getPM25Latest({ apiKey } = {}) {
  const fetcher = () => fetchPM25({ apiKey });
  const { data, _stale, _ageMs } = await withCache(fetcher, {
    cacheKey: "cache:pm25:latest",
    hardTtlMs: 60 * 60 * 1000,
  });
  return { ...mapPM25ToPoints(data), _stale, _ageMs };
}

// Get PM2.5 at a specific timestamp string.
export async function getPM25At(dateStr, { apiKey } = {}) {
  const json = await fetchPM25({ date: dateStr, apiKey });
  return mapPM25ToPoints(json);
}

/* ============================================================================
 * Dengue clusters (GeoJSON) — Public dataset v1
 * ==========================================================================*/

const DENGUE_DATASET_ID = "d_dbfabf16158d1b0e1c420627c0819168";

// Resolve a signed download URL for the dengue dataset, then fetch GeoJSON.
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
    // @ts-ignore
    err.status = 502;
    throw err;
  }

  return requestJSON(metaJson.data.url, { timeoutMs: 10000, retries: 1 });
}

// Get raw dengue clusters GeoJSON (suitable for L.geoJSON).
export async function getDengueClustersGeoJSON() {
  const geojson = await fetchDengueClustersGeoJSON();
  return geojson;
}

/* ============================================================================
 * CHAS clinics (GeoJSON) — Public dataset v1
 * ==========================================================================*/

// Fetch CHAS clinics dataset and normalize a few friendly fields (name, address, phone).
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

  // Normalize friendly fields from HTML "Description".
  const normFeatures = (geojson.features || []).map((f) => {
    const props = f.properties || {};
    const html = props.Description || "";

    const rx = (label) =>
      new RegExp(`<th>${label}<\\/th>\\s*<td>(.*?)<\\/td>`, "i").exec(
        html
      )?.[1] || props[label];

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
