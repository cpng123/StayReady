// utils/hazard.js
// Unified hazard inference for SG conditions.
// Inputs are the exact structures your utils/api.js returns.

export const HAZARD_NONE = "none";
export const HAZARD_FLOOD = "flood";
export const HAZARD_HAZE = "haze";
export const HAZARD_DENGUE = "dengue";
export const HAZARD_WIND = "wind";
export const HAZARD_HEAT = "heat";

export function mockedHazardsFromFlags(flags = {}, center) {
  const list = [];

  const LOC = {
    flood: "Bukit Timah Canal",
    haze: "East Region",
    dengue: "Ang Mo Kio Cluster",
    wind: "South Region",
    heat: "Central Region",
  };

  if (flags.flood) {
    list.push({
      kind: HAZARD_FLOOD,
      severity: "danger",
      title: "Flash Flood (Danger)",
      locationName: LOC.flood,
      reason: "Mock: very heavy rain ~25 mm/5min",
      metrics: { mm: 25, rh: 92 },
    });
  }

  if (flags.haze) {
    list.push({
      kind: HAZARD_HAZE,
      severity: "warning",
      title: "Haze (Warning)",
      locationName: LOC.haze,
      reason: "Mock: PM2.5 ~45 µg/m³",
      metrics: { pm25: 45, region: LOC.haze },
    });
  }

  if (flags.dengue) {
    list.push({
      kind: HAZARD_DENGUE,
      severity: "warning",
      title: "Dengue Caution Nearby",
      locationName: LOC.dengue,
      reason: "Mock: 12 cases, ~2.1 km",
      metrics: { cases: 12, km: 2.1, locality: LOC.dengue },
    });
  }

  if (flags.wind) {
    list.push({
      kind: HAZARD_WIND,
      severity: "warning",
      title: "Strong Winds (Warning)",
      locationName: LOC.wind,
      reason: "Mock: 18 kt sustained",
      metrics: { kt: 18, region: LOC.wind },
    });
  }

  if (flags.heat) {
    list.push({
      kind: HAZARD_HEAT,
      severity: "danger",
      title: "Heat (Danger)",
      locationName: LOC.heat,
      reason: "Mock: Heat Index ~42.0 °C",
      metrics: { hi: 42.0, region: LOC.heat },
    });
  }

  return list;
}

// Find nearest PM region centroid to a {lat, lon}; returns {name, km} or null
function nearestRegionName(point, pmPoints = []) {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lon))
    return null;
  let best = null,
    bestKm = Infinity;
  for (const r of pmPoints || []) {
    if (!Number.isFinite(r.lat) || !Number.isFinite(r.lon)) continue;
    const km = kmBetween(point, { lat: r.lat, lon: r.lon });
    if (km < bestKm) {
      bestKm = km;
      best = r;
    }
  }
  return best ? { name: `${best.name} Region`, km: bestKm } : null;
}

// ---------- helpers ----------
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toNum = (v) => (v == null || isNaN(+v) ? null : +v);

// Haversine distance in km
export function kmBetween(a, b) {
  const R = 6371; // km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + Math.cos(la1) * Math.cos(la2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestPointTo({ lat, lon }, points = []) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  let best = null,
    bestD2 = Infinity;
  for (const p of points || []) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
    const dLat = p.lat - lat;
    const dLon = p.lon - lon;
    const d2 = dLat * dLat + dLon * dLon;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = p;
    }
  }
  return best;
}

// Very light polygon centroid (works for Polygon/MultiPolygon). Fallback to first coord.
function centroidOfGeometry(geom) {
  try {
    if (!geom) return null;
    if (geom.type === "Point")
      return { lat: geom.coordinates[1], lon: geom.coordinates[0] };
    const polys =
      geom.type === "Polygon"
        ? [geom.coordinates]
        : geom.type === "MultiPolygon"
        ? geom.coordinates
        : null;
    if (!polys || !polys.length) return null;

    let sumLat = 0,
      sumLon = 0,
      count = 0;
    for (const poly of polys) {
      // use outer ring
      const ring = poly[0] || [];
      for (const c of ring) {
        if (Array.isArray(c) && c.length >= 2) {
          sumLon += +c[0];
          sumLat += +c[1];
          count++;
        }
      }
    }
    if (!count) return null;
    return { lat: sumLat / count, lon: sumLon / count };
  } catch {
    return null;
  }
}

// Heat Index (Rothfusz regression) in °C from temp °C and RH %
function heatIndexC(tempC, rh) {
  if (tempC == null || rh == null) return null;
  const T = (tempC * 9) / 5 + 32; // to °F
  const R = rh;
  // Base HI in °F
  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;

  // Adjustments (low humidity & high humidity corrections)
  if (R < 13 && T >= 80 && T <= 112) {
    HI -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  } else if (R > 85 && T >= 80 && T <= 87) {
    HI += ((R - 85) / 10) * ((87 - T) / 5);
  }
  return ((HI - 32) * 5) / 9; // back to °C
}

// Severity ordering
const SEV_ORDER = { danger: 3, warning: 2, safe: 1 };
const HAZARD_PRIORITY = [
  HAZARD_FLOOD,
  HAZARD_HEAT,
  HAZARD_HAZE,
  HAZARD_DENGUE,
  HAZARD_WIND,
];

// Pick the “worst” hazard (by severity, then by priority list)
function pickTop(hazards) {
  const withScore = hazards.filter(Boolean).map((h) => ({
    h,
    sev: SEV_ORDER[h.severity || "safe"] || 1,
    pri: HAZARD_PRIORITY.indexOf(h.kind),
  }));

  if (!withScore.length)
    return { kind: HAZARD_NONE, title: "No Hazard Detected", severity: "safe" };

  withScore.sort((a, b) => {
    if (b.sev !== a.sev) return b.sev - a.sev;
    return a.pri - b.pri;
  });
  return withScore[0].h;
}

// ---------- per-hazard classifiers ----------

// A) Rainfall/Flash flood potential (5-min mm, optional RH for extra caution)
export function classifyFlood({ center, rainfallPoints = [], humPoints = [] }) {
  const nearRain = nearestPointTo(center || {}, rainfallPoints);
  const nearHum = nearestPointTo(center || {}, humPoints);
  const mm = toNum(nearRain?.value);
  const rh = toNum(nearHum?.value);

  if (mm == null)
    return { kind: HAZARD_FLOOD, severity: "safe", title: "No Flood Risk" };

  // Heuristic starters (tune with real events)
  // - Danger: ≥ 20 mm in 5 min
  // - Warning: ≥ 10 mm in 5 min AND RH ≥ 85%
  if (mm >= 20) {
    return {
      kind: HAZARD_FLOOD,
      severity: "danger",
      title: "Flash Flood (Danger)",
      locationName: nearRain?.name || nearRain?.id || null,
      reason: `Very heavy rain ${mm.toFixed(1)} mm/5min`,
      metrics: { mm, rh },
    };
  }
  if (mm >= 10 && rh != null && rh >= 85) {
    return {
      kind: HAZARD_FLOOD,
      severity: "warning",
      title: "Flash Flood Watch (Warning)",
      locationName: nearRain?.name || nearRain?.id || null,
      reason: `Heavy rain ${mm.toFixed(1)} mm/5min with high RH ${Math.round(
        rh
      )}%`,
      metrics: { mm, rh },
    };
  }
  return { kind: HAZARD_FLOOD, severity: "safe", title: "No Flood Risk" };
}

// B) Haze from PM2.5 (1-hr). Take worst region value.
export function classifyHaze({ pmPoints = [] }) {
  if (!pmPoints.length)
    return { kind: HAZARD_HAZE, severity: "safe", title: "Air Quality Normal" };
  const worst = pmPoints.reduce((a, b) =>
    toNum(b.value) > toNum(a.value) ? b : a
  );
  const v = toNum(worst.value);
  // Rough alignment with NEA one-hour PM2.5 guidance bands (tune if you prefer exact labels)
  // Safe < 36, Warning 36–55, Danger > 55 µg/m³
  if (v == null || v < 36)
    return { kind: HAZARD_HAZE, severity: "safe", title: "Air Quality Normal" };
  if (v <= 55)
    return {
      kind: HAZARD_HAZE,
      severity: "warning",
      title: "Haze (Warning)",
      reason: `${worst.name}: ${v.toFixed(0)} µg/m³`,
      locationName: `${worst.name} Region`,
      metrics: { pm25: v, region: worst.name },
    };
  return {
    kind: HAZARD_HAZE,
    severity: "danger",
    title: "Haze (Danger)",
    reason: `${worst.name}: ${v.toFixed(0)} µg/m³`,
    locationName: `${worst.name} Region`,
    metrics: { pm25: v, region: worst.name },
  };
}

// C) Dengue proximity (only user-location based). 5 km to cluster centroid.
export function classifyDengue({ center, dengueGeoJSON, kmRadius = 5 }) {
  if (!center || !dengueGeoJSON || dengueGeoJSON.type !== "FeatureCollection")
    return {
      kind: HAZARD_DENGUE,
      severity: "safe",
      title: "No Nearby Dengue Cluster",
    };

  let nearest = null;
  let nearestKm = Infinity;
  let nearestCases = null;
  let nearestName = null;

  for (const f of dengueGeoJSON.features || []) {
    const geom = f.geometry;
    const cen = centroidOfGeometry(geom);
    if (!cen) continue;

    const dist = kmBetween(center, cen);
    if (dist < nearestKm) {
      nearestKm = dist;
      const props = f.properties || {};
      const cases =
        toNum(props.CASE_SIZE) ??
        toNum(props.case_size) ??
        toNum(props["CASE COUNT"]) ??
        toNum(props.CASECOUNT) ??
        toNum(props.caseCount);
      const name =
        props.LOCALITY ||
        props.locality ||
        props.NAME ||
        props.name ||
        "Dengue Cluster";
      nearestCases = cases;
      nearestName = name;
      nearest = cen;
    }
  }

  if (nearestKm === Infinity || nearestKm > kmRadius)
    return {
      kind: HAZARD_DENGUE,
      severity: "safe",
      title: "No Nearby Dengue Cluster",
    };

  // NEA style: Red ≥10 cases, Yellow <10
  const sev = nearestCases != null && nearestCases >= 10 ? "danger" : "warning";
  return {
    kind: HAZARD_DENGUE,
    severity: sev,
    title: sev === "danger" ? "Dengue Cluster Nearby" : "Dengue Caution Nearby",
    locationName: nearestName,
    reason: `${
      nearestCases != null ? nearestCases : "—"
    } cases, ~${nearestKm.toFixed(1)} km`,
    metrics: {
      cases: nearestCases ?? null,
      km: nearestKm,
      locality: nearestName,
    },
  };
}

// D) Wind (knots). Use worst (max) sustained; if you have gusts, escalate based on gusts too.
export function classifyWind({ windPoints = [], pmPoints = [] }) {
  if (!windPoints.length)
    return { kind: HAZARD_WIND, severity: "safe", title: "Winds Normal" };
  const worst = windPoints.reduce((a, b) =>
    toNum(b.value) > toNum(a.value) ? b : a
  );
  const kt = toNum(worst.value);
  const region = nearestRegionName(
    { lat: worst.lat, lon: worst.lon },
    pmPoints
  );
  const locationName = region?.name || worst.name || worst.id || null;

  if (kt == null || kt < 15)
    return {
      kind: HAZARD_WIND,
      severity: "safe",
      title: "Winds Normal (Safe)",
    };
  if (kt < 25)
    return {
      kind: HAZARD_WIND,
      severity: "warning",
      title: "Strong Winds (Warning)",
      reason: `${worst.name}: ${kt.toFixed(1)} kt`,
      locationName,
      metrics: { kt, region: locationName },
    };
  return {
    kind: HAZARD_WIND,
    severity: "danger",
    title: "Damaging Winds (Danger)",
    reason: `${worst.name}: ${kt.toFixed(1)} kt`,
    locationName,
    metrics: { kt, region: locationName },
  };
}

// E) Heat (Heat Index from temp+RH). Use worst computed value across stations.
export function classifyHeat({
  tempPoints = [],
  humPoints = [],
  pmPoints = [],
}) {
  if (!tempPoints.length || !humPoints.length)
    return { kind: HAZARD_HEAT, severity: "safe", title: "Heat Risk Low" };

  // join by nearest station (coarse but ok)
  const his = [];
  for (const t of tempPoints) {
    const h = nearestPointTo({ lat: t.lat, lon: t.lon }, humPoints);
    const hi = heatIndexC(toNum(t.value), toNum(h?.value));
    if (hi != null)
      his.push({ hi, name: t.name || t.id, lat: t.lat, lon: t.lon });
  }
  if (!his.length)
    return { kind: HAZARD_HEAT, severity: "safe", title: "Heat Risk Low" };

  const worst = his.reduce((a, b) => (b.hi > a.hi ? b : a));
  const v = worst.hi;
  const region = nearestRegionName(
    { lat: worst.lat, lon: worst.lon },
    pmPoints
  );
  const locationName = region?.name || worst.name || null;
  // Conservative bands (public-friendly):
  // Safe < 32°C, Warning 32–41°C, Danger > 41°C (heat exhaustion/stroke possible)
  if (v < 32)
    return { kind: HAZARD_HEAT, severity: "safe", title: "Heat Risk Low" };
  if (v <= 41)
    return {
      kind: HAZARD_HEAT,
      severity: "warning",
      title: "Heat (Warning)",
      reason: `HI ${v.toFixed(1)} °C`,
      locationName,
      metrics: { hi: v, region: locationName },
    };
  return {
    kind: HAZARD_HEAT,
    severity: "danger",
    title: "Heat (Danger)",
    reason: `HI ${v.toFixed(1)} °C`,
    locationName,
    metrics: { hi: v, region: locationName },
  };
}

// ---------- global resolver ----------

/**
 * Decide a single top hazard to display in the banner.
 * Only dengue is location-scoped (5 km). Others are Singapore-wide via worst values.
 *
 * @param {object} args
 * @param {object} args.center {lat, lon}
 * @param {array}  args.rainfallPoints
 * @param {array}  args.humPoints
 * @param {array}  args.pmPoints
 * @param {array}  args.windPoints
 * @param {array}  args.tempPoints
 * @param {object} args.dengueGeoJSON
 */
export function decideGlobalHazard(args = {}) {
  const mockFlags = args.mockFlags || {};
  const mocked = mockedHazardsFromFlags(mockFlags, args.center);
  const anyMocksOn = Object.values(mockFlags).some(Boolean);

  // === MOCK MODE ===
  // If any mock is enabled, ignore real feeds and return the worst mocked hazard.
  if (anyMocksOn && mocked.length) {
    return pickTop(mocked);
  }

  // === REAL DETECTION ===
  const flood = classifyFlood(args);
  const haze = classifyHaze(args);
  const dengue = classifyDengue(args);
  const wind = classifyWind(args);
  const heat = classifyHeat(args);
  const all = [flood, haze, dengue, wind, heat];

  const anyNonSafe = all.some((h) => (h.severity || "safe") !== "safe");
  if (!anyNonSafe)
    return { kind: HAZARD_NONE, severity: "safe", title: "No Hazard Detected" };

  // Otherwise pick worst → then by priority
  return pickTop(all);
}

// Return one hazard per type (for Early Warning screen).
export function evaluateAllHazards(args = {}) {
  const flags = args.mockFlags || {};
  const anyMock = !!(
    flags.flood ||
    flags.haze ||
    flags.dengue ||
    flags.wind ||
    flags.heat
  );

  // Real evaluations
  const real = {
    flood: classifyFlood(args),
    haze: classifyHaze(args),
    dengue: classifyDengue(args),
    wind: classifyWind(args),
    heat: classifyHeat(args),
  };

  if (!anyMock)
    return [real.flood, real.haze, real.dengue, real.wind, real.heat];

  // When mocking, only mocked hazards show; others appear as safe
  const mockList = mockedHazardsFromFlags(flags, args.center);
  const byKind = Object.fromEntries(mockList.map((h) => [h.kind, h]));
  const safe = (kind) => ({ kind, severity: "safe", title: "Safe" });
  return [
    byKind.flood || safe(HAZARD_FLOOD),
    byKind.haze || safe(HAZARD_HAZE),
    byKind.dengue || safe(HAZARD_DENGUE),
    byKind.wind || safe(HAZARD_WIND),
    byKind.heat || safe(HAZARD_HEAT),
  ];
}
