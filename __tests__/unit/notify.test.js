// -------------------- AsyncStorage mock (in-memory) --------------------
const memory = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k) => Promise.resolve(memory[k] ?? null)),
  setItem: jest.fn((k, v) => {
    memory[k] = v;
    return Promise.resolve();
  }),
}));

// -------------------- Expo Notifications mock --------------------
const mockSetHandler = jest.fn();
const mockSetChannel = jest.fn();
const mockGetPerms = jest.fn();
const mockReqPerms = jest.fn();
const mockSchedule = jest.fn();

jest.mock("expo-notifications", () => ({
  setNotificationHandler: (...a) => mockSetHandler(...a),
  setNotificationChannelAsync: (...a) => mockSetChannel(...a),
  getPermissionsAsync: (...a) => mockGetPerms(...a),
  requestPermissionsAsync: (...a) => mockReqPerms(...a),
  scheduleNotificationAsync: (...a) => mockSchedule(...a),
  AndroidImportance: { HIGH: 5 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
}));

// -------------------- Helpers --------------------
const KEY_ENABLED = "notify:enabled";
const KEY_ALL = "notify:all";

function freshImportWithOS(os = "android") {
  jest.resetModules(); // clear module cache
  // Mock react-native BEFORE requiring the module under test
  jest.doMock("react-native", () => ({ Platform: { OS: os } }), {
    virtual: true,
  });
  // Now require the module under test inside an isolateModules block
  let mod;
  jest.isolateModules(() => {
    mod = require("../../utils/notify");
  });
  return mod;
}

const FIXED_NOW = 1_725_000_000_000; // stable wall clock
const RealNow = Date.now;

beforeAll(() => {
  Date.now = () => FIXED_NOW;
});

afterAll(() => {
  Date.now = RealNow;
});

beforeEach(() => {
  Object.keys(memory).forEach((k) => delete memory[k]);
  jest.clearAllMocks();
});

// -------------------- Tests --------------------

describe("initNotifications()", () => {
  it("on Android: creates channel and requests permission when not granted", async () => {
    const { initNotifications } = freshImportWithOS("android");

    mockGetPerms.mockResolvedValueOnce({ granted: false });
    mockReqPerms.mockResolvedValueOnce({ granted: true });

    await initNotifications();

    expect(mockSetHandler).toHaveBeenCalled(); // configured at import

    // Android channel creation
    expect(mockSetChannel).toHaveBeenCalledTimes(1);
    expect(mockSetChannel).toHaveBeenCalledWith(
      "default",
      expect.objectContaining({
        name: "Default",
        importance: expect.any(Number),
        vibrationPattern: expect.any(Array),
        sound: "default",
      })
    );

    expect(mockGetPerms).toHaveBeenCalled();
    expect(mockReqPerms).toHaveBeenCalled();
  });

  it("on iOS: no channel creation; still asks for permission if not granted", async () => {
    const { initNotifications } = freshImportWithOS("ios");

    mockGetPerms.mockResolvedValueOnce({ granted: false });
    mockReqPerms.mockResolvedValueOnce({ granted: true });

    await initNotifications();

    expect(mockSetChannel).not.toHaveBeenCalled();
    expect(mockGetPerms).toHaveBeenCalled();
    expect(mockReqPerms).toHaveBeenCalled();
  });
});

describe("legacy migration + getNotificationsEnabled()", () => {
  it("coerces legacy KEY_NOTIFY_ENABLED 'false' to 'true' and returns true", async () => {
    const { getNotificationsEnabled } = freshImportWithOS("android");

    // Simulate legacy value
    memory[KEY_ENABLED] = "false";

    const ok = await getNotificationsEnabled();
    expect(ok).toBe(true);

    // More robust than inspecting mock call order/capture: check stored value
    expect(memory[KEY_ENABLED]).toBe("true");
  });
});

describe("getNotifyAll() / setNotifyAll()", () => {
  it("defaults to true when unset, then caches and persists setNotifyAll(false)", async () => {
    const { getNotifyAll, setNotifyAll } = freshImportWithOS("android");

    // default
    expect(await getNotifyAll()).toBe(true);

    // set false
    await setNotifyAll(false);
    expect(await getNotifyAll()).toBe(false);

    expect(memory[KEY_ALL]).toBe(JSON.stringify(false));
  });
});

describe("maybeNotifyHazard()", () => {
  it("respects Danger-only preference: warning is filtered out, danger is notified", async () => {
    const {
      getNotificationsEnabled,
      setNotifyAll,
      maybeNotifyHazard,
      getNotificationLog,
    } = freshImportWithOS("android");

    await getNotificationsEnabled();
    await setNotifyAll(false); // Danger-only

    // Warning hazard (should NOT notify)
    await maybeNotifyHazard({
      kind: "haze",
      severity: "warning",
      title: "Haze (Warning)",
      locationName: "East Region",
      metrics: { pm25: 45 },
    });

    // Danger hazard (should notify)
    await maybeNotifyHazard({
      kind: "haze",
      severity: "danger",
      title: "Haze (Danger)",
      locationName: "East Region",
      metrics: { pm25: 60 },
    });

    expect(mockSchedule).toHaveBeenCalledTimes(1);
    const inbox = await getNotificationLog();
    expect(inbox).toHaveLength(1);
    expect(inbox[0].kind).toBe("haze");
    expect(inbox[0].severity).toBe("danger");
  });

  it("throttles per kind within 60s", async () => {
    const {
      getNotificationsEnabled,
      setNotifyAll,
      maybeNotifyHazard,
      getNotificationLog,
    } = freshImportWithOS("android");

    await getNotificationsEnabled();
    await setNotifyAll(true); // allow warnings

    const baseHaz = {
      kind: "wind",
      severity: "warning",
      title: "Strong Winds",
      metrics: {},
    };

    await maybeNotifyHazard(baseHaz); // first -> should send
    await maybeNotifyHazard(baseHaz); // second, same tick -> throttled

    expect(mockSchedule).toHaveBeenCalledTimes(1);
    const inbox = await getNotificationLog();
    expect(inbox).toHaveLength(1);
    expect(inbox[0].kind).toBe("wind");
  });

  it("ignored when kind not in allowlist", async () => {
    const {
      getNotificationsEnabled,
      setNotifyAll,
      maybeNotifyHazard,
      getNotificationLog,
    } = freshImportWithOS("android");

    await getNotificationsEnabled();
    await setNotifyAll(true);

    await maybeNotifyHazard({
      kind: "volcano",
      severity: "danger",
      title: "Lava!",
    });

    expect(mockSchedule).not.toHaveBeenCalled();
    expect(await getNotificationLog()).toEqual([]);
  });

  it("includes formatted HI for heat messages and uses Android channelId", async () => {
    const { getNotificationsEnabled, setNotifyAll, maybeNotifyHazard } =
      freshImportWithOS("android");
    await getNotificationsEnabled();
    await setNotifyAll(true);

    await maybeNotifyHazard({
      kind: "heat",
      severity: "warning",
      title: "Heat (Warning)",
      locationName: "Central Region",
      metrics: { hi: 35.234 },
    });

    expect(mockSchedule).toHaveBeenCalledTimes(1);
    const arg = mockSchedule.mock.calls[0][0];
    expect(arg.content.title).toBe("Heat (Warning)");
    expect(arg.content.body).toMatch(/HI ≈ 35\.2°C/);
    expect(arg.content.channelId).toBe("default"); // Android adds channel
  });

  it("uses fallback title map when hazard.title missing", async () => {
    const { getNotificationsEnabled, setNotifyAll, maybeNotifyHazard } =
      freshImportWithOS("android");
    await getNotificationsEnabled();
    await setNotifyAll(true);

    await maybeNotifyHazard({
      kind: "flood",
      severity: "danger",
      locationName: "Bukit Timah",
    });

    expect(mockSchedule).toHaveBeenCalledTimes(1);
    const { content } = mockSchedule.mock.calls[0][0];
    expect(content.title).toMatch(/Flash Flood/i); // from TITLE_FOR.flood
    expect(content.body).toMatch(/Severe flooding risk/i);
  });
});

describe("notification inbox helpers", () => {
  it("unread count, mark all read, mark single read", async () => {
    const {
      getNotificationsEnabled,
      setNotifyAll,
      maybeNotifyHazard,
      getUnreadCount,
      markAllNotificationsRead,
      markNotificationRead,
      getNotificationLog,
    } = freshImportWithOS("android");

    await getNotificationsEnabled();
    await setNotifyAll(true);

    // Push two notifications (different kinds to bypass throttle)
    await maybeNotifyHazard({
      kind: "haze",
      severity: "danger",
      title: "Haze D",
      metrics: {},
    });
    const RealNowLocal = Date.now;
    Date.now = () => FIXED_NOW + 1000; // different ID
    await maybeNotifyHazard({
      kind: "heat",
      severity: "danger",
      title: "Heat D",
      metrics: { hi: 42 },
    });
    Date.now = RealNowLocal;

    const log1 = await getNotificationLog();
    expect(log1).toHaveLength(2);
    const [n1] = log1;

    // Initially unread
    expect(await getUnreadCount()).toBe(2);

    // Mark one read
    await markNotificationRead(n1.id);
    expect(await getUnreadCount()).toBe(1);

    // Mark all read
    await markAllNotificationsRead();
    expect(await getUnreadCount()).toBe(0);
  });
});
