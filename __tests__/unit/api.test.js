import {
  fetchRainfall,
  mapRainfallToPoints,
  getRainfallLatest,
  mapWindToPoints,
  mapTempToPoints,
  getAirTemperatureLatest,
  mapHumidityToPoints,
  mapPM25ToPoints,
  getPM25Latest,
  fetchDengueClustersGeoJSON,
  getDengueClustersGeoJSON,
  getClinicsGeoJSON,
} from "../../utils/api";

// ----------------- Mocks -----------------
const memoryStore = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k) => Promise.resolve(memoryStore[k] ?? null)),
  setItem: jest.fn((k, v) => {
    memoryStore[k] = v;
    return Promise.resolve();
  }),
}));

// `URL` exists in JSDOM/Jest env; no mock needed.
// global.fetch -> set/reset per test:
const realFetch = global.fetch;

beforeEach(() => {
  Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  global.fetch = jest.fn();
  jest.useRealTimers();
});

afterAll(() => {
  global.fetch = realFetch;
});

// Helpers for fetch mocks
const mockFetchJSONOnce = (json, { status = 200, statusText = "OK" } = {}) => {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => json,
    text: async () => JSON.stringify(json),
  });
};

const mockFetchTextOnce = (text, { status = 200, statusText = "OK" } = {}) => {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => JSON.parse(text),
    text: async () => text,
  });
};

// ===================== Request + Maps ======================

describe("real-time API fetchers + mappers", () => {
  it("fetchRainfall retries on 5xx and succeeds", async () => {
    // First call 500, second call 200
    mockFetchTextOnce("upstream down", {
      status: 500,
      statusText: "Server Err",
    });
    mockFetchJSONOnce({
      data: {
        stations: [],
        readings: [{ timestamp: "t", data: [] }],
        readingUnit: "mm",
      },
    });

    const json = await fetchRainfall();
    expect(json.data.readingUnit).toBe("mm");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("mapRainfallToPoints normalizes station points", () => {
    const sample = {
      data: {
        stations: [
          {
            id: "S1",
            name: "Alpha",
            labelLocation: { latitude: 1.1, longitude: 2.2 },
          },
          {
            id: "S2",
            name: "Beta",
            location: { latitude: 3.3, longitude: 4.4 },
          },
        ],
        readings: [
          {
            timestamp: "2025-09-01T00:00:00+08:00",
            data: [
              { stationId: "S1", value: 1.23 },
              { stationId: "S2", value: "2.5" },
              { stationId: "S3", value: 9 }, // no station match -> dropped
            ],
          },
        ],
        readingUnit: "mm",
      },
    };
    const mapped = mapRainfallToPoints(sample);
    expect(mapped.unit).toBe("mm");
    expect(mapped.timestamp).toBe("2025-09-01T00:00:00+08:00");
    expect(mapped.points).toEqual([
      { id: "S1", name: "Alpha", lat: 1.1, lon: 2.2, value: 1.23 },
      { id: "S2", name: "Beta", lat: 3.3, lon: 4.4, value: 2.5 },
    ]);
  });

  it("mapWindToPoints normalizes wind stations", () => {
    const sample = {
      data: {
        stations: [
          { id: "W1", name: "Windy", location: { latitude: 1, longitude: 2 } },
        ],
        readings: [
          { timestamp: "t", data: [{ stationId: "W1", value: "8.5" }] },
        ],
        readingUnit: "knots",
      },
    };
    const m = mapWindToPoints(sample);
    expect(m.unit).toBe("knots");
    expect(m.points[0]).toMatchObject({ id: "W1", name: "Windy", value: 8.5 });
  });

  it("mapTempToPoints normalizes temperature (°C)", () => {
    const sample = {
      data: {
        stations: [
          { id: "T1", name: "Temp", location: { latitude: 1, longitude: 2 } },
        ],
        readings: [
          { timestamp: "t", data: [{ stationId: "T1", value: "30.2" }] },
        ],
      },
    };
    const m = mapTempToPoints(sample);
    expect(m.unit).toBe("°C");
    expect(m.points[0]).toMatchObject({ id: "T1", name: "Temp", value: 30.2 });
  });

  it("mapHumidityToPoints normalizes RH (%)", () => {
    const sample = {
      data: {
        stations: [
          { id: "H1", name: "Hum", location: { latitude: 1, longitude: 2 } },
        ],
        readings: [{ timestamp: "t", data: [{ stationId: "H1", value: 77 }] }],
      },
    };
    const m = mapHumidityToPoints(sample);
    expect(m.unit).toBe("%");
    expect(m.points[0]).toMatchObject({ id: "H1", name: "Hum", value: 77 });
  });

  it("mapPM25ToPoints normalizes PM2.5 and excludes 'national'", () => {
    const sample = {
      data: {
        regionMetadata: [
          { name: "north", labelLocation: { latitude: 1, longitude: 101 } },
          { name: "south", labelLocation: { latitude: 2, longitude: 102 } },
          { name: "east", labelLocation: { latitude: 3, longitude: 103 } },
          { name: "west", labelLocation: { latitude: 4, longitude: 104 } },
          { name: "central", labelLocation: { latitude: 5, longitude: 105 } },
        ],
        items: [
          {
            timestamp: "t",
            readings: {
              pm25_one_hourly: {
                north: 12,
                south: 23,
                east: 34,
                west: 45,
                central: 56,
                national: 40,
              },
            },
          },
        ],
      },
    };
    const m = mapPM25ToPoints(sample);
    expect(m.unit).toBe("µg/m³");
    const regions = m.points.map((p) => p.id).sort();
    expect(regions).toEqual(["central", "east", "north", "south", "west"]);
    expect(m.points.find((p) => p.id === "north").value).toBe(12);
  });
});

// ===================== Cache + stale-if-error ======================

describe("cache + stale-if-error", () => {
  const now = 1_700_000_000_000;
  const RealDateNow = Date.now;

  beforeAll(() => {
    Date.now = () => now;
  });
  afterAll(() => {
    Date.now = RealDateNow;
  });

  it("getRainfallLatest returns stale cache when fetch fails and cache is fresh enough", async () => {
    // Seed cache (5 minutes old)
    const fiveMin = 5 * 60 * 1000;
    const cachedRaw = {
      _ts: now - fiveMin,
      data: {
        data: {
          stations: [
            {
              id: "S1",
              name: "Alpha",
              labelLocation: { latitude: 1, longitude: 2 },
            },
          ],
          readings: [{ timestamp: "t", data: [{ stationId: "S1", value: 7 }] }],
          readingUnit: "mm",
        },
      },
    };
    memoryStore["cache:rainfall:latest"] = JSON.stringify(cachedRaw);

    // Make live fetch fail (network / 500)
    global.fetch.mockRejectedValueOnce(new Error("network down"));

    const res = await getRainfallLatest();
    expect(res._stale).toBe(true);
    expect(res._ageMs).toBeGreaterThan(0);
    expect(res.unit).toBe("mm");
    expect(res.points[0]).toMatchObject({ id: "S1", value: 7 });
  });

  it("getAirTemperatureLatest stores fresh result on success", async () => {
    mockFetchJSONOnce({
      data: {
        stations: [
          { id: "T1", name: "Temp", location: { latitude: 1, longitude: 2 } },
        ],
        readings: [{ timestamp: "t2", data: [{ stationId: "T1", value: 31 }] }],
      },
    });

    const res = await getAirTemperatureLatest();
    expect(res._stale).toBe(false);
    expect(res.timestamp).toBe("t2");
    expect(res.points[0]).toMatchObject({ id: "T1", value: 31 });
    // Cache should be written
    expect(memoryStore["cache:temp:latest"]).toBeTruthy();
  });
});

// ===================== Public dataset flows ======================

describe("dengue & clinics datasets (poll-download flow)", () => {
  it("fetchDengueClustersGeoJSON: resolves poll -> signed url -> geojson", async () => {
    mockFetchJSONOnce({
      code: 0,
      data: { url: "https://signed.example/dengue.json" },
    });
    mockFetchJSONOnce({
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: { foo: "bar" } }],
    });

    const gj = await fetchDengueClustersGeoJSON();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(gj.type).toBe("FeatureCollection");
  });

  it("getDengueClustersGeoJSON returns FeatureCollection", async () => {
    mockFetchJSONOnce({
      code: 0,
      data: { url: "https://signed.example/dengue.json" },
    });
    mockFetchJSONOnce({ type: "FeatureCollection", features: [] });

    const gj = await getDengueClustersGeoJSON();
    expect(gj.type).toBe("FeatureCollection");
  });

  it("getClinicsGeoJSON normalizes name/address/phone from HTML Description", async () => {
    // poll-download
    mockFetchJSONOnce({
      code: 0,
      data: { url: "https://signed.example/chas.json" },
    });
    // geojson with one feature containing HTML table in Description
    const html = `
      <table>
        <tr><th>HCI_NAME</th><td>Sunshine Family Clinic</td></tr>
        <tr><th>HCI_TEL</th><td>61234567</td></tr>
        <tr><th>BLK_HSE_NO</th><td>123</td></tr>
        <tr><th>STREET_NAME</th><td>HAPPY ROAD</td></tr>
        <tr><th>BUILDING_NAME</th><td>HAPPY CENTRE</td></tr>
        <tr><th>POSTAL_CD</th><td>123456</td></tr>
      </table>
    `;
    mockFetchJSONOnce({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [103.8, 1.3] },
          properties: { Description: html },
        },
      ],
    });

    const gj = await getClinicsGeoJSON();
    expect(gj.type).toBe("FeatureCollection");
    expect(gj.features).toHaveLength(1);
    const p = gj.features[0].properties;
    expect(p.name).toBe("Sunshine Family Clinic");
    expect(p.phone).toBe("61234567");
    expect(p.address).toBe("123, HAPPY ROAD, HAPPY CENTRE, S(123456)");
  });
});

// ===================== PM2.5 latest wrapper ======================

describe("getPM25Latest()", () => {
  it("returns mapped data and metadata", async () => {
    mockFetchJSONOnce({
      data: {
        regionMetadata: [
          { name: "north", labelLocation: { latitude: 1, longitude: 101 } },
          { name: "south", labelLocation: { latitude: 2, longitude: 102 } },
        ],
        items: [
          {
            timestamp: "2025-09-03T00:00:00+08:00",
            readings: {
              pm25_one_hourly: { north: 10, south: 20, national: 15 },
            },
          },
        ],
      },
    });
    const res = await getPM25Latest();
    expect(res.timestamp).toBe("2025-09-03T00:00:00+08:00");
    expect(res.unit).toBe("µg/m³");
    expect(res.points.map((p) => p.id).sort()).toEqual(["north", "south"]);
  });
});
