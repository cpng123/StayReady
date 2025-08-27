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
import { getMockFlags } from "../utils/mockFlags";
import { decideGlobalHazard, evaluateAllHazards } from "../utils/hazard";
import { buildCardItems } from "../utils/hazardCards";

export default function useHazards(center, cardLimit = 5) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [topHazard, setTopHazard] = useState({
    kind: "none",
    title: t("home.hazard.none", "No Hazard Detected"),
  });
  const [hazards, setHazards] = useState([]);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
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

        const args = {
          center: center || { lat: 1.3521, lon: 103.8198 },
          rainfallPoints: rain.points || [],
          humPoints: hum.points || [],
          pmPoints: pm.points || [],
          windPoints: wind.points || [],
          tempPoints: temp.points || [],
          dengueGeoJSON: dengueJSON,
          mockFlags,
        };

        const top = decideGlobalHazard(args);
        const all = evaluateAllHazards(args);
        const uiCards = buildCardItems(all, t, cardLimit);

        setTopHazard(top);
        setHazards(all);
        setCards(uiCards);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [center?.lat, center?.lon, cardLimit, t, nonce]);

  return useMemo(
    () => ({ loading, error, topHazard, hazards, cards, refresh }),
    [loading, error, topHazard, hazards, cards, refresh]
  );
}
