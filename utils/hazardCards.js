// utils/hazardCards.js
// Build localized Early Warning cards from hazard objects.

export const sevLabel = (sev, t) =>
  sev === "danger"
    ? t("early.severity.high", "High")
    : sev === "warning"
    ? t("early.severity.med", "Med")
    : t("early.severity.safe", "Safe");

export const sevColor = (sev) =>
  sev === "danger" ? "#F25555" : sev === "warning" ? "#F29F3D" : "#03A55A";

// Card images (swap heat if you have a dedicated asset)
export const CARD_IMG = {
  flood: require("../assets/General/flash-flood2.jpg"),
  haze: require("../assets/General/pm-haze2.jpg"),
  dengue: require("../assets/General/dengue-cluster2.jpg"),
  wind: require("../assets/General/strong-wind2.jpg"),
  heat: require("../assets/General/pm-haze2.jpg"),
};

export const cardTitle = (kind, t) =>
  ({
    flood: t("early.cards.flood.title", "Flash Flood"),
    haze: t("early.cards.haze.title", "Haze (PM2.5)"),
    dengue: t("early.cards.dengue.title", "Dengue Clusters"),
    wind: t("early.cards.wind.title", "Strong Winds"),
    heat: t("early.cards.heat.title", "Heat Advisory"),
  }[kind] || t("home.hazard.alert", "Hazard Alert"));

export const cardDesc = (h, t) => {
  const sev = h.severity || "safe";
  const m = h.metrics || {};
  const place = h.locationName || m.locality || t("settings.country_sg", "Singapore");
  const region = m.region || h.locationName || t("settings.country_sg", "Singapore");
  const hi = m.hi != null ? m.hi.toFixed(1) : undefined;
  const km = m.km != null ? m.km.toFixed(1) : undefined;
  const cases = m.cases != null ? m.cases : undefined;

  const key = (k) => `early.cards.${k}.desc.${sev}`;

  switch (h.kind) {
    case "flood":
      return t(key("flood"), {
        defaultValue:
          sev === "danger"
            ? `Flash flooding around ${place}. Do not drive through floodwater; avoid underpasses and basements.`
            : sev === "warning"
            ? `Heavy showers near ${place}. Ponding possible. Avoid low-lying roads and kerbside lanes.`
            : "No significant rain detected. Drains and canals at normal levels.",
        place,
      });
    case "haze":
      return t(key("haze"), {
        defaultValue:
          sev === "danger"
            ? `Unhealthy PM2.5 in the ${region}. Stay indoors; use purifier; wear N95 if going out.`
            : sev === "warning"
            ? `Elevated PM2.5 in the ${region}. Limit prolonged outdoor activity; consider a mask.`
            : "Air quality is within normal range across Singapore.",
        region,
      });
    case "dengue":
      return t(key("dengue"), {
        defaultValue:
          sev === "danger"
            ? `High-risk cluster near ${place} (${cases}+ cases). Avoid dawn/dusk bites; check home daily; see a doctor if fever persists.`
            : sev === "warning"
            ? `Active cluster near ${place} (~${km} km). Remove stagnant water; use repellent.`
            : "No active cluster within 5 km of your location.",
        place,
        km,
        cases,
      });
    case "wind":
      return t(key("wind"), {
        defaultValue:
          sev === "danger"
            ? `Damaging winds in the ${region}. Stay indoors; avoid coastal and open areas.`
            : sev === "warning"
            ? `Strong winds in the ${region}. Secure loose items; caution for riders and high vehicles.`
            : "Winds are light to moderate.",
        region,
      });
    case "heat":
      return t(key("heat"), {
        defaultValue:
          sev === "danger"
            ? `Extreme heat in the ${region} (HI ≈ ${hi}°C). Stay in shade/AC; check on the vulnerable.`
            : sev === "warning"
            ? `High heat in the ${region} (HI ≈ ${hi}°C). Reduce strenuous activity; drink water often.`
            : "Heat risk is low.",
        region,
        hi,
      });
    default:
      return t("home.hazard.slogan", "Stay Alert, Stay Safe");
  }
};

export const toCardItem = (h, t) => ({
  id: h.kind,
  title: cardTitle(h.kind, t),
  level: sevLabel(h.severity, t),
  color: sevColor(h.severity),
  img: CARD_IMG[h.kind],
  desc: cardDesc(h, t),
  hazard: h, // pass-through for deep pages
});

export const buildCardItems = (hazards = [], t, limit) => {
  const list = hazards.map((h) => toCardItem(h, t));
  return typeof limit === "number" ? list.slice(0, limit) : list;
};
