// utils/hazard.js
// Simple heuristic hazard engine for SG conditions.
// Uses nearest 5-min rainfall + relative humidity to infer flash-flood risk.
// Also supports a "mock flood" override for demos.

export const HAZARD_NONE = "none";
export const HAZARD_FLOOD = "flood";

export function nearestPointTo({ lat, lon }, points = []) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Array.isArray(points)) return null;
  let best = null, bestD2 = Infinity;
  for (const p of points) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
    const dLat = p.lat - lat;
    const dLon = p.lon - lon;
    const d2 = dLat * dLat + dLon * dLon; // good enough for small SG distances
    if (d2 < bestD2) { bestD2 = d2; best = p; }
  }
  return best;
}

// Decide hazard from nearest rainfall (mm in last 5 min) + humidity (%)
export function decideHazard({ center, rainfallPoints, humPoints, mockFlood = false }) {
  if (mockFlood) {
    return {
      kind: HAZARD_FLOOD,
      title: "Flash Flood Warning",
      // display fake "location" from center lat/lon (caller can provide label)
      locationName: null,
      severity: "high",
      reason: "Mock flood (demo)",
      locationName: "Clementi Park",
    };
  }

  const nearRain = nearestPointTo(center, rainfallPoints);
  const nearHum  = nearestPointTo(center, humPoints);

  const mm  = nearRain?.value ?? null;           // 5-min rainfall (mm)
  const rh  = nearHum?.value ?? null;            // %
  const name = nearRain?.name || nearRain?.id || null;

  // Heuristic thresholds (tweak as needed)
  // - Heavy downpour (≥20 mm in 5 min) -> flood warn (high)
  // - Moderate rain (≥10 mm) + high humidity (≥85%) -> flood warn (med)
  // Else -> none
  if (mm != null && mm >= 20) {
    return { kind: HAZARD_FLOOD, title: "Flash Flood Warning", locationName: name, severity: "high",
      reason: `Heavy downpour near ${name} (${mm.toFixed(1)} mm)` };
  }
  if (mm != null && mm >= 10 && rh != null && rh >= 85) {
    return { kind: HAZARD_FLOOD, title: "Flash Flood Watch", locationName: name, severity: "medium",
      reason: `Moderate rain (${mm.toFixed(1)} mm) & high RH (${Math.round(rh)}%)` };
  }

  return { kind: HAZARD_NONE, title: "No Hazard Detected", locationName: null, severity: "low" };
}
