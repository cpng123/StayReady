// utils/api.js
// Open Government Products, data.gov.sg — Real-time weather
// Base: https://api-open.data.gov.sg/v2/real-time/api
// Dengue dataset (GEOJSON) via public datasets API v1

const API_BASE = "https://api-open.data.gov.sg/v2/real-time/api";
const DATASET_API_BASE = "https://api-open.data.gov.sg/v1/public/api"; // 👈 NEW

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

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Rainfall fetch failed (${res.status}) ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
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
  const json = await fetchRainfall({ apiKey });
  return mapRainfallToPoints(json);
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

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Wind fetch failed (${res.status}) ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
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
export async function fetchAirTemperature({ date, paginationToken, apiKey } = {}) {
  const url = buildRealTimeUrl("/air-temperature", { date, paginationToken });
  const headers = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Air temperature fetch failed (${res.status}) ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
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
  const json = await fetchAirTemperature({ apiKey });
  return mapTempToPoints(json);
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

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Humidity fetch failed (${res.status}) ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
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
  const json = await fetchRelativeHumidity({ apiKey });
  return mapHumidityToPoints(json);
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

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`PM2.5 fetch failed (${res.status}) ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
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
  const json = await fetchPM25({ apiKey });
  return mapPM25ToPoints(json);
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

export async function fetchDengueClustersGeoJSON(datasetId = DENGUE_DATASET_ID) {
  const metaUrl = buildUrl(
    DATASET_API_BASE,
    `/datasets/${datasetId}/poll-download`
  );
  const metaRes = await fetch(metaUrl);
  const metaJson = await metaRes.json();
  if (!metaRes.ok || metaJson?.code !== 0) {
    const err = new Error(
      `Dengue meta fetch failed (${metaRes.status}) ${metaJson?.errMsg || ""}`
    );
    err.status = metaRes.status;
    throw err;
  }
  const fileUrl = metaJson?.data?.url;
  if (!fileUrl) throw new Error("Dengue download URL missing");
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) {
    const text = await fileRes.text().catch(() => "");
    const err = new Error(`Dengue GEOJSON fetch failed (${fileRes.status}) ${text}`);
    err.status = fileRes.status;
    throw err;
  }
  return fileRes.json();
}

export async function getDengueClustersGeoJSON() {
  // Return raw GeoJSON, suitable for L.geoJSON
  const geojson = await fetchDengueClustersGeoJSON();
  return geojson;
}
