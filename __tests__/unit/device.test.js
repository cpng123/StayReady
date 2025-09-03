import * as SecureStore from "expo-secure-store";
import { v4 as uuid } from "uuid";
import { getDeviceId } from "../../utils/device";

let warnSpy;
beforeAll(() => {
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  warnSpy.mockRestore();
});

// Mock SecureStore methods
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// Mock UUID so it returns a predictable value
jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

describe("getDeviceId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an existing device ID from SecureStore", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("existing-device-id");

    const id = await getDeviceId();

    expect(id).toBe("existing-device-id");
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("device_id_v1");
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("generates and stores a new device ID if none exists", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    uuid.mockReturnValue("new-uuid");

    const id = await getDeviceId();

    expect(id).toBe("new-uuid");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "device_id_v1",
      "new-uuid"
    );
  });

  it("returns a fallback UUID when SecureStore fails", async () => {
    SecureStore.getItemAsync.mockRejectedValueOnce(
      new Error("SecureStore unavailable")
    );
    uuid.mockReturnValue("fallback-uuid");

    const id = await getDeviceId();

    expect(id).toBe("fallback-uuid");
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
