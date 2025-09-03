import {
  getContacts,
  saveContacts,
  setTestMode,
  getTestMode,
  buildEmergencyMessage,
  dispatchToContact,
  dispatchEmergency,
} from "../../utils/emergencyContacts";

// ----------------- Mocks -----------------
const memoryStore = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k) => Promise.resolve(memoryStore[k] ?? null)),
  setItem: jest.fn((k, v) => {
    memoryStore[k] = v;
    return Promise.resolve();
  }),
}));

// Location
const mockRequestPerms = jest.fn();
const mockGetCurrentPos = jest.fn();
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: () => mockRequestPerms(),
  getCurrentPositionAsync: (...args) => mockGetCurrentPos(...args),
  Accuracy: { Balanced: 3 },
}));

// Network
const mockGetNetworkStateAsync = jest.fn();
jest.mock("expo-network", () => ({
  getNetworkStateAsync: () => mockGetNetworkStateAsync(),
}));

// SMS
const mockIsSMSAvailable = jest.fn();
const mockSendSMSAsync = jest.fn();
jest.mock("expo-sms", () => ({
  isAvailableAsync: () => mockIsSMSAvailable(),
  sendSMSAsync: (...args) => mockSendSMSAsync(...args),
}));

// Linking
const mockOpenURL = jest.fn();
const mockCanOpenURL = jest.fn();
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: (...args) => mockOpenURL(...args),
  canOpenURL: (...args) => mockCanOpenURL(...args),
  default: {
    openURL: (...args) => mockOpenURL(...args),
    canOpenURL: (...args) => mockCanOpenURL(...args),
  },
}));

// Platform
import { Platform } from "react-native";
const setPlatform = (os) => {
  Object.defineProperty(Platform, "OS", {
    value: os,
    configurable: true,
  });
};

// Stabilize Date
const FIXED_DATE_ISO = "2025-09-03T12:34:56.000Z";
const RealDate = Date;
beforeAll(() => {
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) return new RealDate(FIXED_DATE_ISO);
      return new RealDate(...args);
    }
    static now() {
      return new RealDate(FIXED_DATE_ISO).getTime();
    }
  };
});
afterAll(() => {
  global.Date = RealDate;
});

// --------------- Helpers ---------------
const resetMocks = () => {
  Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  jest.clearAllMocks();

  // Reasonable defaults
  mockIsSMSAvailable.mockResolvedValue(true);
  mockSendSMSAsync.mockResolvedValue({ result: "sent" });
  mockOpenURL.mockResolvedValue(undefined);
  mockCanOpenURL.mockResolvedValue(true);
  mockGetNetworkStateAsync.mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  });

  mockRequestPerms.mockResolvedValue({ status: "granted" });
  mockGetCurrentPos.mockResolvedValue({
    coords: { latitude: 1.3521, longitude: 103.8198, accuracy: 12 },
  });
};

beforeEach(() => {
  resetMocks();
  setPlatform("android"); // default for tests
});

// ----------------- Tests -----------------

describe("CRUD + test mode flags", () => {
  it("getContacts returns [] by default", async () => {
    const list = await getContacts();
    expect(list).toEqual([]);
  });

  it("saveContacts writes and getContacts reads back", async () => {
    const sample = [
      { id: "1", label: "Mum", channel: "sms", value: "+65 8123 4567" },
      { id: "2", label: "Bro", channel: "whatsapp", value: "6588889999" },
    ];
    await saveContacts(sample);
    const read = await getContacts();
    expect(read).toEqual(sample);
  });

  it("test mode set/get works", async () => {
    expect(await getTestMode()).toBe(false);
    await setTestMode(true);
    expect(await getTestMode()).toBe(true);
    await setTestMode(false);
    expect(await getTestMode()).toBe(false);
  });
});

describe("buildEmergencyMessage()", () => {
  it("includes GPS lines and map links when permission granted", async () => {
    const msg = await buildEmergencyMessage();
    expect(msg).toContain("🚨 EMERGENCY: I need help. Please contact me ASAP.");
    expect(msg).toContain("GPS: 1.352100, 103.819800 (±12m)");
    expect(msg).toContain("https://maps.google.com/?q=1.3521,103.8198");
    expect(msg).toContain("https://maps.apple.com/?ll=1.3521,103.8198");
    expect(msg).toContain("geo:1.3521,103.8198?q=1.3521,103.8198(SOS)");
    expect(msg).toContain("Time:");
  });

  it("notes permission not granted", async () => {
    mockRequestPerms.mockResolvedValueOnce({ status: "denied" });
    const msg = await buildEmergencyMessage();
    expect(msg).toContain("Location permission not granted.");
    expect(msg).not.toContain("GPS:");
  });

  it("notes location unavailable on error", async () => {
    mockRequestPerms.mockResolvedValueOnce({ status: "granted" });
    mockGetCurrentPos.mockRejectedValueOnce(new Error("GPS error"));
    const msg = await buildEmergencyMessage();
    expect(msg).toContain("Location unavailable.");
  });
});

describe("dispatchToContact()", () => {
  const message = "TEST-MSG";

  it("returns ok:false for bad contact", async () => {
    const r = await dispatchToContact(null, message);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("bad-contact");
  });

  it("simulates when testMode=true", async () => {
    const contact = { id: "1", channel: "auto", value: "6581234567" };
    const r = await dispatchToContact(contact, message, { testMode: true });
    expect(r).toEqual({ ok: true, simulated: true });
    expect(mockSendSMSAsync).not.toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it("auto channel: sends SMS then WhatsApp when online and WA available", async () => {
    const contact = { id: "1", channel: "auto", value: "+65 8123 4567" };
    mockCanOpenURL.mockResolvedValueOnce(true);

    const r = await dispatchToContact(contact, message);
    expect(r.ok).toBe(true);
    expect(mockSendSMSAsync).toHaveBeenCalledWith(["+65 8123 4567"], message);
    expect(mockOpenURL).toHaveBeenCalledWith(
      expect.stringMatching(/^whatsapp:\/\/send\?phone=6581234567&text=/)
    );
  });

  it("auto channel: only SMS when offline", async () => {
    mockGetNetworkStateAsync.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    });
    const contact = { id: "1", channel: "auto", value: "6580000000" };
    const r = await dispatchToContact(contact, message);
    expect(r.ok).toBe(true);
    expect(mockSendSMSAsync).toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalledWith(
      expect.stringMatching(/^whatsapp:\/\//)
    );
  });

  it("sms channel: uses expo-sms when available", async () => {
    mockIsSMSAvailable.mockResolvedValueOnce(true);
    const contact = { id: "1", channel: "sms", value: "6581112222" };
    const r = await dispatchToContact(contact, message);
    expect(r.ok).toBe(true);
    expect(mockSendSMSAsync).toHaveBeenCalledWith(["6581112222"], message);
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it("sms channel: falls back to sms: URL scheme when unavailable (iOS)", async () => {
    mockIsSMSAvailable.mockResolvedValueOnce(false);
    setPlatform("ios");
    const contact = { id: "1", channel: "sms", value: "6581112222" };
    const r = await dispatchToContact(contact, message);
    expect(r.ok).toBe(true);
    expect(mockOpenURL).toHaveBeenCalledWith(
      expect.stringMatching(/^sms:6581112222&body=/)
    );
  });

  it("whatsapp channel: opens WA app link (fallback to web if app fails)", async () => {
    mockOpenURL
      .mockRejectedValueOnce(new Error("No WA app"))
      .mockResolvedValueOnce(undefined);
    const contact = { id: "1", channel: "whatsapp", value: "+65 8123 4567" };
    const r = await dispatchToContact(contact, message);
    expect(r.ok).toBe(true);
    expect(mockOpenURL).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/^whatsapp:\/\/send\?phone=6581234567&text=/)
    );
    expect(mockOpenURL).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^https:\/\/wa\.me\/6581234567\?text=/)
    );
  });

  it("unknown channel returns ok:false", async () => {
    const contact = { id: "1", channel: "pager", value: "42" };
    const r = await dispatchToContact(contact, message);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("unknown-channel");
  });

  it("returns ok:false on opener error", async () => {
    mockSendSMSAsync.mockRejectedValueOnce(new Error("SMS failed"));
    const contact = { id: "1", channel: "sms", value: "6581112222" };
    const r = await dispatchToContact(contact, message);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("SMS failed");
  });
});

describe("dispatchEmergency()", () => {
  it("builds message once and dispatches sequentially", async () => {
    const contacts = [
      { id: "1", channel: "sms", value: "111" },
      { id: "2", channel: "whatsapp", value: "222" },
    ];
    const result = await dispatchEmergency(contacts);
    expect(result.testMode).toBe(false);
    expect(typeof result.message).toBe("string");
    expect(result.results).toHaveLength(2);
    expect(result.results.every((r) => r.ok)).toBe(true);
  });

  it("honors global test mode (no sends)", async () => {
    await setTestMode(true);
    const contacts = [{ id: "1", channel: "auto", value: "333" }];
    const result = await dispatchEmergency(contacts);
    expect(result.testMode).toBe(true);
    expect(mockSendSMSAsync).not.toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalled();
    expect(result.results[0]).toEqual({ ok: true, simulated: true });
  });
});
