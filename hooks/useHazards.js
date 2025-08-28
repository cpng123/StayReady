// hooks/useHazards.js
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

const images = {
  flood: require("../assets/General/flash-flood2.jpg"),
  haze: require("../assets/General/pm-haze2.jpg"),
  dengue: require("../assets/General/dengue-cluster2.jpg"),
  wind: require("../assets/General/strong-wind2.jpg"),
  heat: require("../assets/General/heat.jpg"),
};

export default function useHazards(center, limit = 5) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [topHazard, setTopHazard] = useState({
    kind: "none",
    title: t("home.hazard.none", "No Hazard Detected"),
    severity: "safe",
  });
  const [cards, setCards] = useState([]);

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

      // short description reused from your previous logic if needed:
      const desc = h.desc || ""; // (optional) keep empty if you already render desc elsewhere

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

  // initial + whenever center changes
  useEffect(() => {
    load();
  }, [load]);

  // expose explicit refresh (returns a Promise)
  const refresh = useCallback(() => load(), [load]);

  return { loading, topHazard, cards, refresh };
}
