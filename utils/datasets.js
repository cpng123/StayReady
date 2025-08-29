/**
 * File: utils/datasets.js
 * Purpose: Fetch and parse public datasets (CSV/GeoJSON links via signed URLs)
 *          from data.gov.sg v1 Public API for use in guide statistics/visuals.
 *
 * Responsibilities:
 *  - Retrieve signed download URLs via `/datasets/{id}/poll-download`.
 *  - Fetch CSV payloads (size-guarded), parse to rows, and map to (x,y) series.
 *  - Provide tolerant header matching so column names can vary slightly.
 *  - Cache parsed results in AsyncStorage with TTL; fall back to cache on error.
 *
 * External API:
 *  - Base: https://api-open.data.gov.sg/v1/public/api
 *  - Flow: poll-download → { data: { url } } → fetch CSV from signed URL
 *
 * Notes:
 *  - CSV parser is intentionally simple (quotes + commas) and adequate
 *    for typical data.gov.sg files; for complex CSV consider a library.
 *  - `rowsToSeries` uses best-effort header matching (aliases/spacing).
 *  - `getGuideStatsData` returns cache on failures if still fresh.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const DATASET_API_BASE = "https://api-open.data.gov.sg/v1/public/api";

// Small delay helper (used between retries)
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ============================================================================
 * Request helpers (JSON/HEAD/CSV)
 * ==========================================================================*/

// Fetch JSON with timeout + minimal retry on transient errors
async function requestJSON(url, { headers = {}, timeoutMs = 8000, retries = 1 } = {}) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`HTTP ${res.status} ${res.statusText} at ${url}\n${text}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } catch (e) {
    // Retry once on Abort/429/5xx
    const transient = e.name === "AbortError" || e.status === 429 || (e.status >= 500 && e.status <= 599);
    if (retries > 0 && transient) {
      await sleep(500);
      return requestJSON(url, { headers, timeoutMs, retries: retries - 1 });
    }
    throw e;
  } finally {
    clearTimeout(to);
  }
}

// HEAD request to read content-length without downloading the body
async function headContentLength(url, { timeoutMs = 6000 } = {}) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal });
    if (!res.ok) return null;
    const len = res.headers.get("content-length");
    return len ? Number(len) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

// Exchange a datasetId for a signed download URL (poll-download)
export async function getSignedDatasetUrl(datasetId) {
  const url = `${DATASET_API_BASE}/datasets/${datasetId}/poll-download`;
  const json = await requestJSON(url, { timeoutMs: 10000, retries: 1 });
  if (json?.code !== 0 || !json?.data?.url) {
    const err = new Error("poll-download returned no url");
    err.status = 502;
    throw err;
  }
  return json.data.url;
}

// Fetch CSV as text (with timeout)
async function fetchCsvText(url, { timeoutMs = 12000 } = {}) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: "text/csv" }, signal: ctrl.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`CSV fetch failed (${res.status}) ${text}`);
      err.status = res.status;
      throw err;
    }
    return await res.text();
  } finally {
    clearTimeout(to);
  }
}

/* ============================================================================
 * CSV parsing (basic) → { headers, rows }
 * ==========================================================================*/

// Parse a CSV string to headers + rows (handles quotes and escaped quotes)
export function parseCsvToRows(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Split a line into fields, honoring quotes and escaped quotes
  const split = (line) => {
    const out = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };

  const headers = split(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map(l => split(l));
  return { headers, rows };
}

/* ============================================================================
 * Tolerant header matching helpers
 * ==========================================================================*/

// Normalize a header string (lowercase, alphanumeric only)
function norm(h) {
  return String(h || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Find column index by candidates (aliases); tries exact, then fuzzy contains
function findIndexByCandidates(headers, candidates) {
  const H = headers.map(norm);
  const C = (Array.isArray(candidates) ? candidates : [candidates]).map(norm);

  // Exact match first
  for (const c of C) {
    const i = H.indexOf(c);
    if (i >= 0) return i;
  }
  // Then substring either way (header contains candidate OR vice versa)
  for (const c of C) {
    const i = H.findIndex((h) => h.includes(c) || c.includes(h));
    if (i >= 0) return i;
  }
  return -1;
}

/* ============================================================================
 * Rows → (x,y) series
 * ==========================================================================*/

// Map parsed CSV rows to an (x,y) numeric series using tolerant header matching
export function rowsToSeries({ headers, rows }, { x: xKey, y: yKey }) {
  const xi = findIndexByCandidates(headers, xKey);
  const yi = findIndexByCandidates(headers, yKey);

  if (xi < 0 || yi < 0) {
    return { series: [], headers, chosen: { xHeader: null, yHeader: null } };
  }

  const series = rows
    .map((r) => ({ x: r[xi], y: Number(r[yi]) }))
    .filter((p) => p.x != null && Number.isFinite(p.y));

  return { series, headers, chosen: { xHeader: headers[xi], yHeader: headers[yi] } };
}

/* ============================================================================
 * Public API: fetch → guard size → parse → series (with cache + fallback)
 * ==========================================================================*/

// Main entry for guide stats: returns numeric series + metadata, with caching
export async function getGuideStatsData(
  guideId,
  { datasetId, columns, ttlHours = 12, maxBytes = 3 * 1024 * 1024 } = {}
) {
  const cacheKey = `stats:${guideId}`;
  const now = Date.now();
  const ttlMs = ttlHours * 3600 * 1000;

  try {
    // Get signed CSV URL
    const signedUrl = await getSignedDatasetUrl(datasetId);

    // Optional size guard (HEAD) to avoid downloading very large files
    const contentLen = await headContentLength(signedUrl);
    if (contentLen != null && contentLen > maxBytes) {
      const err = new Error(`CSV too large (${contentLen} bytes)`);
      err.code = "TOO_LARGE";
      throw err;
    }

    // Fetch + parse CSV → pick columns → build series
    const csv = await fetchCsvText(signedUrl);
    const parsed = parseCsvToRows(csv);
    const { series, headers, chosen } = rowsToSeries(parsed, columns);

    // Cache parsed payload for fast subsequent loads and error fallback
    const payload = { series, fetchedAt: now, headers, chosen };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(payload));

    return { series, asOf: new Date(now), cached: false, headers, chosen };
  } catch (err) {
    // Fallback: return cached data if still within TTL
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const { series, fetchedAt, headers, chosen } = JSON.parse(raw);
        if (Array.isArray(series) && series.length && (now - fetchedAt) <= ttlMs) {
          return { series, asOf: new Date(fetchedAt), cached: true, headers, chosen };
        }
      }
    } catch {}
    throw err;
  }
}
