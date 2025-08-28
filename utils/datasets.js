// utils/datasets.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const DATASET_API_BASE = "https://api-open.data.gov.sg/v1/public/api";

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

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

// --- CSV parsing (simple) ---
export function parseCsvToRows(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
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

// --- tolerant header matching (aliases, punctuation/spacing agnostic) ---
function norm(h) {
  return String(h || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function findIndexByCandidates(headers, candidates) {
  const H = headers.map(norm);
  const C = (Array.isArray(candidates) ? candidates : [candidates]).map(norm);

  // exact first
  for (const c of C) {
    const i = H.indexOf(c);
    if (i >= 0) return i;
  }
  // then contains either way
  for (const c of C) {
    const i = H.findIndex((h) => h.includes(c) || c.includes(h));
    if (i >= 0) return i;
  }
  return -1;
}

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

// Public: fetch → size-guard → parse → series (with cache + debug)
export async function getGuideStatsData(
  guideId,
  { datasetId, columns, ttlHours = 12, maxBytes = 3 * 1024 * 1024 } = {}
) {
  const cacheKey = `stats:${guideId}`;
  const now = Date.now();
  const ttlMs = ttlHours * 3600 * 1000;

  try {
    const signedUrl = await getSignedDatasetUrl(datasetId);

    const contentLen = await headContentLength(signedUrl);
    if (contentLen != null && contentLen > maxBytes) {
      const err = new Error(`CSV too large (${contentLen} bytes)`);
      err.code = "TOO_LARGE";
      throw err;
    }

    const csv = await fetchCsvText(signedUrl);
    const parsed = parseCsvToRows(csv);
    const { series, headers, chosen } = rowsToSeries(parsed, columns);

    const payload = { series, fetchedAt: now, headers, chosen };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(payload));

    return { series, asOf: new Date(now), cached: false, headers, chosen };
  } catch (err) {
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
