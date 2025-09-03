const DATASET_API_BASE = "https://api-open.data.gov.sg/v1/public/api";
const cacheKeyFor = (guideId) => `stats:${guideId}`;

// ---------------- AsyncStorage mock ----------------
const memoryStore = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k) => Promise.resolve(memoryStore[k] ?? null)),
  setItem: jest.fn((k, v) => {
    memoryStore[k] = v;
    return Promise.resolve();
  }),
}));

import {
  getSignedDatasetUrl,
  parseCsvToRows,
  rowsToSeries,
  getGuideStatsData,
} from "../../utils/datasets";

// ---------------- fetch mock helpers ----------------
const realFetch = global.fetch;

function mockFetchOnceJSON(
  json,
  { status = 200, statusText = "OK", headers = {} } = {}
) {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => json,
    text: async () => JSON.stringify(json),
    headers: {
      get: (k) => headers[k.toLowerCase()],
    },
  });
}

function mockFetchOnceHEAD({ ok = true, contentLength = null } = {}) {
  global.fetch.mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 404,
    statusText: ok ? "OK" : "Not Found",
    headers: {
      get: (k) =>
        k.toLowerCase() === "content-length" ? String(contentLength) : null,
    },
  });
}

function mockFetchOnceCSV(text, { status = 200, statusText = "OK" } = {}) {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: async () => text,
    json: async () => {
      // just in case code calls json() by mistake
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text };
      }
    },
    headers: { get: () => null },
  });
}

beforeEach(() => {
  Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  global.fetch = jest.fn();
  jest.useRealTimers();
});

afterAll(() => {
  global.fetch = realFetch;
});

// ---------------- Tests ----------------

describe("getSignedDatasetUrl()", () => {
  it("returns signed url on code===0", async () => {
    const datasetId = "d_test";
    mockFetchOnceJSON({
      code: 0,
      data: { url: "https://signed.example/file.csv" },
    });

    const url = await getSignedDatasetUrl(datasetId);
    expect(url).toBe("https://signed.example/file.csv");
    expect(global.fetch).toHaveBeenCalledWith(
      `${DATASET_API_BASE}/datasets/${datasetId}/poll-download`,
      expect.any(Object)
    );
  });

  it("throws when payload is missing url/code", async () => {
    const datasetId = "d_bad";
    mockFetchOnceJSON({ code: 1, data: {} });

    await expect(getSignedDatasetUrl(datasetId)).rejects.toThrow(/no url/i);
  });
});

describe("parseCsvToRows()", () => {
  it("parses headers/rows with quotes, commas, and escaped quotes", () => {
    const csv = [
      'Year,Value,"Notes, extra"',
      '2021,10,"hello"',
      '2022,12,"said ""hi"", then left"', // escaped quotes
    ].join("\n");

    const { headers, rows } = parseCsvToRows(csv);
    expect(headers).toEqual(["Year", "Value", "Notes, extra"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(["2021", "10", "hello"]);
    expect(rows[1]).toEqual(["2022", "12", 'said "hi", then left']);
  });

  it("handles empty input", () => {
    const { headers, rows } = parseCsvToRows("");
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });
});

describe("rowsToSeries()", () => {
  it("maps tolerant headers (aliases/spacing/substring)", () => {
    const parsed = {
      headers: ["  Y e a r ", "avg  VALUE (kg) "],
      rows: [
        ["2020", "1.5"],
        ["2021", "2.25"],
        ["2022", "bad"],
      ],
    };
    const { series, chosen } = rowsToSeries(parsed, {
      x: ["year"],
      y: ["value", "avg value"],
    });
    expect(chosen.xHeader.replace(/\s+/g, "").toLowerCase()).toContain("year");
    expect(chosen.yHeader.toLowerCase()).toContain("value");
    expect(series).toEqual([
      { x: "2020", y: 1.5 },
      { x: "2021", y: 2.25 },
    ]); // skips NaN
  });

  it("returns empty series when headers not found", () => {
    const parsed = { headers: ["A", "B"], rows: [["x", "1"]] };
    const { series, chosen } = rowsToSeries(parsed, { x: "date", y: "count" });
    expect(series).toEqual([]);
    expect(chosen).toEqual({ xHeader: null, yHeader: null });
  });
});

describe("getGuideStatsData()", () => {
  const now = 1_700_000_000_000;
  const RealDateNow = Date.now;

  beforeAll(() => {
    Date.now = () => now;
  });
  afterAll(() => {
    Date.now = RealDateNow;
  });

  const guideId = "guide-1";
  const datasetId = "d_abc123";
  const signed = "https://signed.example/data.csv";

  it("happy path: poll → HEAD (ok) → CSV → parse → cache", async () => {
    // poll-download
    mockFetchOnceJSON({ code: 0, data: { url: signed } });
    // HEAD (within size)
    mockFetchOnceHEAD({ ok: true, contentLength: 1024 });
    // CSV body
    mockFetchOnceCSV("year,value\n2020,1\n2021,2\n");

    const result = await getGuideStatsData(guideId, {
      datasetId,
      columns: { x: "year", y: "value" },
      ttlHours: 12,
      maxBytes: 3 * 1024 * 1024,
    });

    expect(result.cached).toBe(false);
    expect(result.series).toEqual([
      { x: "2020", y: 1 },
      { x: "2021", y: 2 },
    ]);
    expect(result.headers[0].toLowerCase()).toContain("year");
    // cache written
    expect(memoryStore[cacheKeyFor(guideId)]).toBeTruthy();
  });

  it("uses cache as fallback when fresh and live request fails", async () => {
    // Seed cache (fetchedAt = now - 1 hour)
    const cached = {
      series: [{ x: "A", y: 9 }],
      fetchedAt: now - 3600 * 1000,
      headers: ["Year", "Value"],
      chosen: { xHeader: "Year", yHeader: "Value" },
    };
    memoryStore[cacheKeyFor(guideId)] = JSON.stringify(cached);

    // Live poll fails
    global.fetch.mockRejectedValueOnce(new Error("network down"));

    const result = await getGuideStatsData(guideId, {
      datasetId,
      columns: { x: "year", y: "value" },
      ttlHours: 12,
    });

    expect(result.cached).toBe(true);
    expect(result.series).toEqual([{ x: "A", y: 9 }]);
    expect(result.asOf.getTime()).toBe(cached.fetchedAt);
  });

  it("throws when CSV too large (HEAD) and no valid cache", async () => {
    // poll-download
    mockFetchOnceJSON({ code: 0, data: { url: signed } });
    // HEAD reports huge size
    mockFetchOnceHEAD({ ok: true, contentLength: 10 * 1024 * 1024 });

    await expect(
      getGuideStatsData(guideId, {
        datasetId,
        columns: { x: "year", y: "value" },
        maxBytes: 1024, // 1 KB
      })
    ).rejects.toThrow(/too large/i);
  });

  it("ignores HEAD when server doesn't return content-length", async () => {
    // poll-download
    mockFetchOnceJSON({ code: 0, data: { url: signed } });
    // HEAD without content-length (null) — proceed anyway
    mockFetchOnceHEAD({ ok: true, contentLength: null });
    // CSV
    mockFetchOnceCSV("date,count\n2024-01,5\n2024-02,7\n");

    const result = await getGuideStatsData(guideId, {
      datasetId,
      columns: { x: "date", y: "count" },
      maxBytes: 1, // tiny limit, but no content-length => allowed to download
    });

    expect(result.series.length).toBe(2);
  });

  it("throws when cache exists but expired (stale) and live fails", async () => {
    // Seed very old cache
    const old = {
      series: [{ x: "old", y: 1 }],
      fetchedAt: now - 48 * 3600 * 1000, // 48h ago
      headers: ["x", "y"],
      chosen: { xHeader: "x", yHeader: "y" },
    };
    memoryStore[cacheKeyFor(guideId)] = JSON.stringify(old);

    // Live fails
    global.fetch.mockRejectedValueOnce(new Error("network down"));

    await expect(
      getGuideStatsData(guideId, {
        datasetId,
        columns: { x: "x", y: "y" },
        ttlHours: 12, // 12h TTL → cached data is stale
      })
    ).rejects.toThrow(/network down/i);
  });
});
