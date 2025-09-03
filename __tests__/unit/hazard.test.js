import {
  HAZARD_NONE,
  HAZARD_FLOOD,
  HAZARD_HAZE,
  HAZARD_DENGUE,
  HAZARD_WIND,
  HAZARD_HEAT,
  kmBetween,
  nearestPointTo,
  mockedHazardsFromFlags,
  classifyFlood,
  classifyHaze,
  classifyDengue,
  classifyWind,
  classifyHeat,
  decideGlobalHazard,
  evaluateAllHazards,
} from "../../utils/hazard";

// ----------------- Helpers -----------------

describe("numeric/geo helpers", () => {
  test("kmBetween computes great-circle distance (close to known value)", () => {
    // Two points in Singapore ~ 12.4 km apart
    const a = { lat: 1.29027, lon: 103.851959 }; // near CBD
    const b = { lat: 1.352083, lon: 103.819836 }; // near central/north
    const d = kmBetween(a, b);
    expect(d).toBeGreaterThan(5);
    expect(d).toBeLessThan(20);
    expect(d).toBeCloseTo(7.75, 2);
  });

  test("nearestPointTo returns the closest point by squared distance", () => {
    const center = { lat: 1.3, lon: 103.85 };
    const pts = [
      { id: "A", lat: 1.0, lon: 103.0 },
      { id: "B", lat: 1.31, lon: 103.84 }, // closest
      { id: "C", lat: 1.5, lon: 104.0 },
    ];
    const n = nearestPointTo(center, pts);
    expect(n.id).toBe("B");
  });

  test("nearestPointTo returns null for invalid input", () => {
    expect(
      nearestPointTo({ lat: NaN, lon: 0 }, [{ lat: 1, lon: 1 }])
    ).toBeNull();
  });
});

// ----------------- Classifiers -----------------

describe("classifyFlood()", () => {
  const center = { lat: 1.3, lon: 103.85 };

  test("safe when no rainfall point nearby", () => {
    const out = classifyFlood({ center, rainfallPoints: [] });
    expect(out.kind).toBe(HAZARD_FLOOD);
    expect(out.severity).toBe("safe");
  });

  test("danger when >= 20 mm/5min", () => {
    const out = classifyFlood({
      center,
      rainfallPoints: [
        { id: "R1", name: "Station", lat: 1.31, lon: 103.84, value: 20.1 },
      ],
      humPoints: [{ id: "H", lat: 1.31, lon: 103.84, value: 90 }],
    });
    expect(out.severity).toBe("danger");
    expect(out.title).toMatch(/Flash Flood/i);
    expect(out.metrics.mm).toBeCloseTo(20.1, 1);
  });

  test("warning when >= 10 mm/5min AND RH >= 85%", () => {
    const out = classifyFlood({
      center,
      rainfallPoints: [
        { id: "R2", name: "Stn", lat: 1.31, lon: 103.84, value: 12 },
      ],
      humPoints: [{ id: "H", lat: 1.3, lon: 103.85, value: 88 }],
    });
    expect(out.severity).toBe("warning");
    expect(out.reason).toMatch(/12\.0 mm\/5min/);
    expect(out.reason).toMatch(/88%/);
  });

  test("safe when >= 10 mm but humidity missing/low", () => {
    const outNoHum = classifyFlood({
      center,
      rainfallPoints: [{ id: "R3", lat: 1.31, lon: 103.84, value: 15 }],
      humPoints: [],
    });
    expect(outNoHum.severity).toBe("safe");

    const outLowHum = classifyFlood({
      center,
      rainfallPoints: [{ id: "R4", lat: 1.31, lon: 103.84, value: 15 }],
      humPoints: [{ id: "H", lat: 1.3, lon: 103.85, value: 70 }],
    });
    expect(outLowHum.severity).toBe("safe");
  });
});

describe("classifyHaze()", () => {
  test("safe when no pm points", () => {
    const out = classifyHaze({ pmPoints: [] });
    expect(out.severity).toBe("safe");
  });

  test("warning band 36–55 µg/m³", () => {
    const out = classifyHaze({
      pmPoints: [
        { name: "North", lat: 1.45, lon: 103.82, value: 20 },
        { name: "East", lat: 1.35, lon: 103.94, value: 45 }, // worst
      ],
    });
    expect(out.severity).toBe("warning");
    expect(out.locationName).toMatch(/East Region/i);
    expect(out.metrics.pm25).toBe(45);
  });

  test("danger > 55 µg/m³", () => {
    const out = classifyHaze({
      pmPoints: [
        { name: "South", lat: 1.25, lon: 103.83, value: 60 },
        { name: "West", lat: 1.36, lon: 103.7, value: 50 },
      ],
    });
    expect(out.severity).toBe("danger");
    expect(out.title).toMatch(/Haze \(Danger\)/);
    expect(out.reason).toMatch(/South: 60/);
  });
});

describe("classifyDengue()", () => {
  const center = { lat: 1.35, lon: 103.82 };

  const mkGeo = (features) => ({
    type: "FeatureCollection",
    features,
  });

  test("safe on missing/invalid geojson", () => {
    expect(classifyDengue({ center, dengueGeoJSON: null }).severity).toBe(
      "safe"
    );
  });

  test("finds nearest cluster within radius and assigns severity/yellow/red", () => {
    const fc = mkGeo([
      // small triangle near center, 8 cases -> warning
      {
        type: "Feature",
        properties: { CASE_SIZE: 8, LOCALITY: "Alpha Estate" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [103.82, 1.349],
              [103.821, 1.349],
              [103.821, 1.35],
              [103.82, 1.349],
            ],
          ],
        },
      },
      // slightly farther, 12 cases -> danger (but farther so still chosen only if nearer is out of radius)
      {
        type: "Feature",
        properties: { CASE_SIZE: 12, LOCALITY: "Beta Block" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [103.84, 1.36],
              [103.841, 1.36],
              [103.841, 1.361],
              [103.84, 1.36],
            ],
          ],
        },
      },
    ]);

    const out = classifyDengue({ center, dengueGeoJSON: fc, kmRadius: 5 });
    expect(["warning", "danger"]).toContain(out.severity);
    expect(out.title).toMatch(/Dengue/);
    expect(out.metrics.km).toBeGreaterThan(0);
    expect(out.metrics.locality).toMatch(/(Alpha Estate|Beta Block)/);
  });

  test("safe if nearest cluster outside radius", () => {
    const far = mkGeo([
      {
        type: "Feature",
        properties: { CASE_SIZE: 20, LOCALITY: "Very Far" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [103.0, 1.0],
              [103.1, 1.0],
              [103.1, 1.1],
              [103.0, 1.0],
            ],
          ],
        },
      },
    ]);
    const out = classifyDengue({ center, dengueGeoJSON: far, kmRadius: 3 });
    expect(out.severity).toBe("safe");
  });
});

describe("classifyWind()", () => {
  test("safe when no wind points", () => {
    expect(classifyWind({ windPoints: [] }).severity).toBe("safe");
  });

  test("warning 15–24 kt & uses nearest PM region for label", () => {
    const windPoints = [
      { id: "W1", name: "Stn1", lat: 1.3, lon: 103.85, value: 18 },
      { id: "W2", name: "Stn2", lat: 1.36, lon: 103.7, value: 10 },
    ];
    const pmPoints = [
      { name: "Central", lat: 1.35, lon: 103.82 },
      { name: "West", lat: 1.35, lon: 103.7 },
    ];
    const out = classifyWind({ windPoints, pmPoints });
    expect(out.severity).toBe("warning");
    expect(out.locationName).toMatch(/Region|Stn1/);
    expect(out.metrics.kt).toBeCloseTo(18, 1);
  });

  test("danger ≥ 25 kt", () => {
    const out = classifyWind({
      windPoints: [{ id: "W", name: "Max", lat: 1.3, lon: 103.8, value: 26.3 }],
      pmPoints: [],
    });
    expect(out.severity).toBe("danger");
    expect(out.title).toMatch(/Damaging Winds/);
  });
});

describe("classifyHeat()", () => {
  const tempPoints = [
    { id: "T1", name: "Temp1", lat: 1.3, lon: 103.85, value: 33 }, // with RH 70 -> HI ~ (warning)
    { id: "T2", name: "Temp2", lat: 1.31, lon: 103.86, value: 36 }, // with RH 70 -> higher HI
  ];
  const humPoints = [
    { id: "H1", lat: 1.3, lon: 103.85, value: 40 },
    { id: "H2", lat: 1.5, lon: 103.86, value: 40 },
  ];
  const pmPoints = [{ name: "Central", lat: 1.35, lon: 103.82 }];

  test("safe when missing inputs", () => {
    expect(classifyHeat({ tempPoints: [], humPoints })).toMatchObject({
      severity: "safe",
    });
    expect(classifyHeat({ tempPoints, humPoints: [] })).toMatchObject({
      severity: "safe",
    });
  });

  test("warning when HI between 32 and 41 °C", () => {
    const out = classifyHeat({ tempPoints, humPoints, pmPoints });
    expect(out.severity).toBe("warning");
    expect(out.title).toMatch(/Heat \(Warning\)/);
    expect(out.metrics.hi).toBeGreaterThanOrEqual(32);
    expect(out.metrics.hi).toBeLessThanOrEqual(41);
    expect(out.locationName).toMatch(/Central Region|Temp/);
  });

  test("danger when HI > 41 °C", () => {
    // Push HI high: higher temp + very high RH near same location
    const temps = [{ id: "T", name: "Hot", lat: 1.3, lon: 103.85, value: 38 }];
    const hums = [{ id: "H", lat: 1.3001, lon: 103.8501, value: 85 }];
    const out = classifyHeat({ tempPoints: temps, humPoints: hums, pmPoints });
    expect(out.severity).toBe("danger");
    expect(out.reason).toMatch(/HI .* °C/);
  });
});

// ----------------- Mock flags and global resolvers -----------------

describe("mockedHazardsFromFlags()", () => {
  test("generates hazards for enabled flags", () => {
    const list = mockedHazardsFromFlags(
      { flood: true, haze: true, dengue: true, wind: true, heat: true },
      { lat: 1.3, lon: 103.8 }
    );
    expect(list).toHaveLength(5);
    const kinds = list.map((h) => h.kind).sort();
    expect(kinds).toEqual(
      [
        HAZARD_DENGUE,
        HAZARD_FLOOD,
        HAZARD_HAZE,
        HAZARD_HEAT,
        HAZARD_WIND,
      ].sort()
    );
  });

  test("empty when all flags false", () => {
    expect(mockedHazardsFromFlags({})).toEqual([]);
  });
});

describe("decideGlobalHazard()", () => {
  const center = { lat: 1.3, lon: 103.8 };

  test("returns NONE when everything safe", () => {
    const top = decideGlobalHazard({
      center,
      rainfallPoints: [],
      humPoints: [],
      pmPoints: [],
      windPoints: [],
      tempPoints: [],
    });
    expect(top.kind).toBe(HAZARD_NONE);
    expect(top.severity).toBe("safe");
  });

  test("prefers mock hazards when any flag is on", () => {
    const top = decideGlobalHazard({
      center,
      mockFlags: { heat: true }, // mock on -> ignore real feeds
      pmPoints: [{ name: "Central", lat: 1.35, lon: 103.82, value: 10 }],
    });
    expect([HAZARD_HEAT]).toContain(top.kind);
    expect(top.title).toMatch(/Heat/);
  });

  test("severity wins over priority; if same severity, priority order applies (flood > heat > haze > dengue > wind)", () => {
    // Create both flood and heat at 'danger' -> flood should win by priority
    const top = decideGlobalHazard({
      center,
      rainfallPoints: [{ id: "R", lat: 1.3001, lon: 103.8001, value: 25 }], // flood danger
      humPoints: [{ id: "H", lat: 1.3001, lon: 103.8001, value: 90 }],
      // Make heat danger too
      tempPoints: [
        { id: "T", name: "Hot", lat: 1.3002, lon: 103.8002, value: 38 },
      ],
      pmPoints: [{ name: "Central", lat: 1.35, lon: 103.82 }],
      windPoints: [],
      // humidity for heat
      // Note: classifyHeat finds nearest humidity station
      // Provide one near temp
      // (reuse same RH point)
    });
    expect(top.kind).toBe(HAZARD_FLOOD);
    expect(top.severity).toBe("danger");
  });
});

describe("evaluateAllHazards()", () => {
  const center = { lat: 1.3, lon: 103.8 };

  test("returns one hazard per type (real evaluations) when no mocks", () => {
    const list = evaluateAllHazards({
      center,
      rainfallPoints: [{ id: "R", lat: 1.31, lon: 103.84, value: 0 }],
      humPoints: [{ id: "H", lat: 1.31, lon: 103.84, value: 60 }],
      pmPoints: [{ name: "Central", lat: 1.35, lon: 103.82, value: 20 }],
      windPoints: [{ id: "W", lat: 1.33, lon: 103.8, value: 10 }],
      tempPoints: [{ id: "T", lat: 1.34, lon: 103.81, value: 31 }],
    });
    expect(list).toHaveLength(5);
    const kinds = list.map((h) => h.kind);
    expect(kinds.sort()).toEqual(
      [
        HAZARD_DENGUE,
        HAZARD_FLOOD,
        HAZARD_HAZE,
        HAZARD_HEAT,
        HAZARD_WIND,
      ].sort()
    );
  });

  test("with mock flags, only mocked hazards show; others are safe", () => {
    const list = evaluateAllHazards({
      center,
      mockFlags: { haze: true, wind: true },
    });
    const byKind = Object.fromEntries(list.map((h) => [h.kind, h]));
    expect(byKind[HAZARD_HAZE].severity).toMatch(/warning|danger/);
    expect(byKind[HAZARD_WIND].severity).toMatch(/warning|danger/);
    expect(byKind[HAZARD_FLOOD].severity).toBe("safe");
    expect(byKind[HAZARD_HEAT].severity).toBe("safe");
    expect(byKind[HAZARD_DENGUE].severity).toBe("safe");
  });
});
