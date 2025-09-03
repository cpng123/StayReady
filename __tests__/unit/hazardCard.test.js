import {
  sevLabel,
  sevColor,
  cardTitle,
  cardDesc,
  toCardItem,
  buildCardItems,
} from "../../utils/hazardCards";

/** Minimal translator:
 * - returns provided defaultValue (second arg) when present
 * - otherwise returns the key for easy visibility in failures
 */
const t = (key, defOrStr, vars) => {
  if (typeof defOrStr === "string") return defOrStr; // our calls pass defaultValue string
  if (defOrStr && typeof defOrStr === "object" && defOrStr.defaultValue) {
    // in case something calls t(key, { defaultValue: "..." })
    return defOrStr.defaultValue.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      String(vars?.[k] ?? "")
    );
  }
  return key;
};

describe("sevLabel()", () => {
  it("maps severities using t()", () => {
    expect(sevLabel("danger", t)).toBe("High");
    expect(sevLabel("warning", t)).toBe("Med");
    expect(sevLabel("safe", t)).toBe("Safe");
    expect(sevLabel(undefined, t)).toBe("Safe"); // default
  });
});

describe("sevColor()", () => {
  it("maps severities to hex colors", () => {
    expect(sevColor("danger")).toBe("#F25555");
    expect(sevColor("warning")).toBe("#F29F3D");
    expect(sevColor("safe")).toBe("#03A55A");
    expect(sevColor(undefined)).toBe("#03A55A");
  });
});

describe("cardTitle()", () => {
  it("returns localized per-kind titles, defaulting to 'Hazard Alert'", () => {
    expect(cardTitle("flood", t)).toBe("Flash Flood");
    expect(cardTitle("haze", t)).toBe("Haze (PM2.5)");
    expect(cardTitle("dengue", t)).toBe("Dengue Clusters");
    expect(cardTitle("wind", t)).toBe("Strong Winds");
    expect(cardTitle("heat", t)).toBe("Heat Advisory");
    expect(cardTitle("unknown", t)).toBe("Hazard Alert");
  });
});

describe("cardDesc()", () => {
  it("flood: uses severity-specific messaging and location fallback", () => {
    const safe = cardDesc({ kind: "flood", severity: "safe" }, t);
    expect(safe).toMatch(/No significant rain/i);

    const warn = cardDesc(
      { kind: "flood", severity: "warning", locationName: "Bishan" },
      t
    );
    expect(warn).toMatch(/Heavy showers near Bishan/i);

    const danger = cardDesc(
      { kind: "flood", severity: "danger", locationName: "Bukit Timah" },
      t
    );
    expect(danger).toMatch(/Flash flooding around Bukit Timah/i);
  });

  it("haze: uses region label and bands", () => {
    const safe = cardDesc({ kind: "haze", severity: "safe" }, t);
    expect(safe).toMatch(/Air quality is within normal range/i);

    const warn = cardDesc(
      { kind: "haze", severity: "warning", metrics: { region: "East" } },
      t
    );
    expect(warn).toMatch(/Elevated PM2\.5 in the East/i);

    const danger = cardDesc(
      { kind: "haze", severity: "danger", metrics: { region: "Central" } },
      t
    );
    expect(danger).toMatch(/Unhealthy PM2\.5 in the Central/i);
  });

  it("dengue: interpolates km and cases when provided", () => {
    const safe = cardDesc({ kind: "dengue", severity: "safe" }, t);
    expect(safe).toMatch(/No active cluster within 5 km/i);

    const warn = cardDesc(
      {
        kind: "dengue",
        severity: "warning",
        locationName: "Alpha",
        metrics: { km: 2.123 },
      },
      t
    );
    // rounded to one decimal per implementation
    expect(warn).toMatch(/Alpha/i);
    expect(warn).toMatch(/~2\.1 km/i);

    const danger = cardDesc(
      {
        kind: "dengue",
        severity: "danger",
        locationName: "Beta",
        metrics: { cases: 12 },
      },
      t
    );
    expect(danger).toMatch(/High-risk cluster near Beta \(12\+ cases\)/i);
  });

  it("wind: uses region label", () => {
    const warn = cardDesc(
      {
        kind: "wind",
        severity: "warning",
        metrics: { region: "South Region" },
      },
      t
    );
    expect(warn).toMatch(/Strong winds in the South Region/i);

    const danger = cardDesc(
      { kind: "wind", severity: "danger", metrics: { region: "West Region" } },
      t
    );
    expect(danger).toMatch(/Damaging winds in the West Region/i);
  });

  it("heat: inserts HI value (one decimal) and region", () => {
    const warn = cardDesc(
      {
        kind: "heat",
        severity: "warning",
        metrics: { hi: 35.234, region: "Central Region" },
      },
      t
    );
    expect(warn).toMatch(/High heat in the Central Region \(HI ≈ 35\.2°C\)/i);

    const danger = cardDesc(
      {
        kind: "heat",
        severity: "danger",
        metrics: { hi: 42.01, region: "North" },
      },
      t
    );
    expect(danger).toMatch(/Extreme heat in the North \(HI ≈ 42\.0°C\)/i);

    const safe = cardDesc({ kind: "heat", severity: "safe" }, t);
    expect(safe).toMatch(/Heat risk is low/i);
  });

  it("defaults: unknown kind falls back to slogan", () => {
    const d = cardDesc({ kind: "unknown", severity: "warning" }, t);
    expect(d).toMatch(/Stay Alert, Stay Safe/i);
  });
});

describe("toCardItem()", () => {
  it("maps hazard to display card fields", () => {
    const hazard = {
      kind: "haze",
      severity: "warning",
      locationName: "East Region",
      metrics: { pm25: 48, region: "East Region" },
    };
    const item = toCardItem(hazard, t);
    expect(item).toEqual(
      expect.objectContaining({
        id: "haze",
        title: "Haze (PM2.5)",
        level: "Med",
        color: "#F29F3D",
        desc: expect.stringMatching(/Elevated PM2\.5/i),
        hazard,
      })
    );
    // Image presence (jest-expo typically mocks asset requires to a number)
    expect(item.img).toBeDefined();
  });
});

describe("buildCardItems()", () => {
  it("builds list and respects limit", () => {
    const hazards = [
      { kind: "flood", severity: "safe" },
      { kind: "haze", severity: "warning", metrics: { region: "West" } },
      { kind: "wind", severity: "danger", metrics: { region: "South" } },
    ];
    const all = buildCardItems(hazards, t);
    expect(all).toHaveLength(3);
    expect(all[0].id).toBe("flood");

    const limited = buildCardItems(hazards, t, 2);
    expect(limited).toHaveLength(2);
    expect(limited.map((x) => x.id)).toEqual(["flood", "haze"]);
  });
});
