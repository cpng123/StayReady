/**
 * File: hooks/useHazards.js
 * Purpose: Aggregate live datasets and mock flags to infer current hazards,
 *          pick the top hazard for the home banner, and build Early Warning cards.
 *
 * Responsibilities:
 *  - Fetch latest rainfall, humidity, PM2.5, wind, temperature, and dengue GeoJSON.
 *  - Respect local mock flags to simulate hazards (for demos/tests).
 *  - Run classifiers to decide the single top hazard + per-kind hazard list.
 *  - Map hazards into lightweight card items (title/level/color/image/desc).
 *  - Expose a `refresh()` function to re-run the pipeline on demand.
 *
 * Notes:
 *  - i18n: All labels use `react-i18next` keys with English fallbacks.
 *  - Network errors: each fetch is wrapped with `.catch` → safe empty default.
 *  - `center`: user/location coordinate influences dengue proximity checks.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  getRainfallLatest,
  getRelativeHumidityLatest,
  getPM25Latest,
  getWindLatest,
  getAirTemperatureLatest,
  getDengueClustersGeoJSON,
} from "../utils/api";
import { decideGlobalHazard, evaluateAllHazards } from "../utils/hazard";
import { getMockFlags } from "../utils/mockFlags";

// Local asset registry for hazard card thumbnails
const images = {
  flood: require("../assets/General/flash-flood2.jpg"),
  haze: require("../assets/General/pm-haze2.jpg"),
  dengue: require("../assets/General/dengue-cluster2.jpg"),
  wind: require("../assets/General/strong-wind2.jpg"),
  heat: require("../assets/General/heat.jpg"),
};

// Main hook: returns { loading, topHazard, cards, refresh }
export default function useHazards(center, limit = 5) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  // Default “no hazard” banner until data resolves
  const [topHazard, setTopHazard] = useState({
    kind: "none",
    title: t("home.hazard.none", "No Hazard Detected"),
    severity: "safe",
  });

  const [cards, setCards] = useState([]);

  // Build a single Early Warning card from a hazard object
  const toCardItem = useCallback(
    (h) => {
      const sev = h.severity || "safe";
      const severityBadge = {
        safe: t("early.severity.safe", "Safe"),
        warning: t("early.severity.med", "Med"),
        danger: t("early.severity.high", "High"),
      };
      const severityColor = {
        safe: "#03A55A",
        warning: "#F29F3D",
        danger: "#F25555",
      };
      const titleFor =
        {
          flood: t("early.cards.flood.title", "Flash Flood"),
          haze: t("early.cards.haze.title", "Haze (PM2.5)"),
          dengue: t("early.cards.dengue.title", "Dengue Clusters"),
          wind: t("early.cards.wind.title", "Strong Winds"),
          heat: t("early.cards.heat.title", "Heat Advisory"),
        }[h.kind] || t("home.hazard.alert", "Hazard Alert");

      // Optional: keep short desc empty if the UI composes a richer one elsewhere
      const desc = h.desc || "";

      return {
        id: h.kind,
        title: titleFor,
        level: severityBadge[sev],
        color: severityColor[sev],
        img: images[h.kind],
        desc,
        hazard: h,
      };
    },
    [t]
  );

  // One-shot loader: fetch feeds → classify → produce banner + cards
  const load = useCallback(async () => {
    setLoading(true);
    let alive = true;
    try {
      const [rain, hum, pm, wind, temp, dengueJSON, mockFlags] =
        await Promise.all([
          getRainfallLatest().catch(() => ({ points: [] })),
          getRelativeHumidityLatest().catch(() => ({ points: [] })),
          getPM25Latest().catch(() => ({ points: [] })),
          getWindLatest().catch(() => ({ points: [] })),
          getAirTemperatureLatest().catch(() => ({ points: [] })),
          getDengueClustersGeoJSON().catch(() => null),
          getMockFlags().catch(() => ({})),
        ]);

      if (!alive) return;

      // Decide single top hazard for banner
      const hazard = decideGlobalHazard({
        center,
        rainfallPoints: rain.points || [],
        humPoints: hum.points || [],
        pmPoints: pm.points || [],
        windPoints: wind.points || [],
        tempPoints: temp.points || [],
        dengueGeoJSON: dengueJSON,
        mockFlags,
      });
      setTopHazard(hazard);

      // Build per-kind list for grid/cards and cap by `limit`
      const all = evaluateAllHazards({
        center,
        rainfallPoints: rain.points || [],
        humPoints: hum.points || [],
        pmPoints: pm.points || [],
        windPoints: wind.points || [],
        tempPoints: temp.points || [],
        dengueGeoJSON: dengueJSON,
        mockFlags,
      });

      setCards(all.slice(0, limit).map(toCardItem));
    } finally {
      if (alive) setLoading(false);
    }
    return () => {
      alive = false;
    };
  }, [center, limit, toCardItem]);

  // Kick off on mount and whenever `center` changes
  useEffect(() => {
    load();
  }, [load]);

  // Public manual refetch; consumers can call on pull-to-refresh
  const refresh = useCallback(() => load(), [load]);

  return { loading, topHazard, cards, refresh };
}
