import { act, fireEvent, render } from "@testing-library/react-native";

jest.mock('../../assets/Sound/alert.mp3', () => 1);
jest.useFakeTimers();

/* -------------------- STUBS -------------------- */
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }) => <>{children}</>,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k, v) =>
      ({
        "sos.title": "SOS",
        "sos.button_sos": "SOS",
        "sos.button_stop": "STOP",
        "sos.manage_contacts": "Manage Contacts",
        "sos.subtitle_idle_line1": "Tap to activate alarm",
        "sos.subtitle_idle_line2": `Auto message in ${v?.delay ?? ""}s`,
        "sos.subtitle_active_line1": "Alarm active",
        "sos.subtitle_active_line2": `Dispatching in ${v?.delay ?? ""}s`,
        "sos.guard_title": "No contacts",
        "sos.guard_message": "You have no emergency contacts saved.",
        "sos.guard_add_contact": "Add Contact",
        "sos.guard_not_now": "Not now",
      }[k] ?? k),
    i18n: { changeLanguage: jest.fn() },
  }),
}));

jest.mock("../../theme/ThemeProvider", () => {
  const ctx = { theme: { key: "light", colors: { text: "#111" } } };
  return {
    ThemeProvider: ({ children }) => <>{children}</>,
    useThemeContext: () => ctx,
  };
});

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: jest.fn((cb) => {
    const cleanup = cb?.();
    return () => (typeof cleanup === "function" ? cleanup() : undefined);
  }),
}));

jest.mock("react-native/Libraries/Vibration/Vibration", () => ({
  vibrate: jest.fn(),
  cancel: jest.fn(),
}));
import { Vibration } from "react-native";

/** ✅ FIXED: all functions defined inside the factory, and exported via __mocked */
jest.mock("expo-av", () => {
  const mockStopAsync = jest.fn(async () => {});
  const mockUnloadAsync = jest.fn(async () => {});
  const mockSetAudioModeAsync = jest.fn(async () => {});
  const mockCreateAsync = jest.fn(async () => ({
    sound: { stopAsync: mockStopAsync, unloadAsync: mockUnloadAsync },
  }));
  return {
    Audio: {
      setAudioModeAsync: mockSetAudioModeAsync,
      Sound: { createAsync: mockCreateAsync },
    },
    InterruptionModeAndroid: { DoNotMix: "DoNotMix" },
    InterruptionModeIOS: { DoNotMix: "DoNotMix" },
    __mocked: {
      mockStopAsync,
      mockUnloadAsync,
      mockSetAudioModeAsync,
      mockCreateAsync,
    },
  };
});
import { Audio } from "expo-av";

/** capture Camera props, mark ready immediately */
let latestCameraProps = {};
jest.mock("expo-camera", () => {
  const React = require("react");
  const { View } = require("react-native");
  const useCameraPermissions = () => [
    { granted: true },
    jest.fn(async () => ({ granted: true })),
  ];
  const CameraView = (props) => {
    latestCameraProps = props;
    setTimeout(() => props.onCameraReady?.(), 0);
    return <View testID="camera" {...props} />;
  };
  return { useCameraPermissions, CameraView };
});

jest.mock("../../components/ConfirmModal", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");
  return ({
    visible,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  }) =>
    visible ? (
      <View testID="confirm-modal">
        <Text>{title}</Text>
        <Text>{message}</Text>
        <Pressable testID="confirm-btn" onPress={onConfirm}>
          <Text>{confirmLabel}</Text>
        </Pressable>
        <Pressable testID="cancel-btn" onPress={onCancel}>
          <Text>{cancelLabel}</Text>
        </Pressable>
      </View>
    ) : null;
});

jest.mock("@expo/vector-icons", () => ({
  Ionicons: (props) => {
    const React = require("react");
    return React.createElement("Icon", props);
  },
}));

const mockGetContacts = jest.fn();
const mockDispatchEmergency = jest.fn(async () => {});
jest.mock("../../utils/emergencyContacts", () => ({
  getContacts: (...a) => mockGetContacts(...a),
  dispatchEmergency: (...a) => mockDispatchEmergency(...a),
}));

/* -------------------- SUT -------------------- */
import SOSScreen from "../../screens/SOSScreen";

/* -------------------- helpers -------------------- */
const flush = async () =>
  act(async () => {
    await Promise.resolve();
  });
const tick = async (ms = 0) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
  });
};

describe("SOSScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
    latestCameraProps = {};
  });

  const renderScreen = async () => {
    const r = render(<SOSScreen />);
    await flush();
    await tick(0); // let onCameraReady fire
    return r;
  };

  const pressTextWhoseAncestorHasOnPress = (screen, text) => {
    const nodes = screen.getAllByText(text);
    const target = nodes.find((n) => {
      let p = n.parent;
      while (p) {
        if (typeof p.props?.onPress === "function") return true;
        p = p.parent;
      }
      return false;
    });
    if (!target)
      throw new Error(`No pressable ancestor found for text: ${text}`);
    fireEvent.press(target);
  };

  test("renders idle subtitle (unique) on load", async () => {
    mockGetContacts.mockResolvedValue([
      { name: "Alice", phone: "+6512345678" },
    ]);
    const { getByText, getAllByText } = await renderScreen();
    // There are multiple "SOS" texts (title + button), so don't use getByText('SOS')
    expect(getAllByText("SOS").length).toBeGreaterThan(0);
    getByText(/Tap to activate alarm/i);
    getByText(/Auto message in 3s/i);
  });

  test("tap → start alarm: audio, vibration, torch strobe; auto-dispatch after 3s (once)", async () => {
    const contacts = [{ name: "Bob", phone: "+6598765432" }];
    mockGetContacts.mockResolvedValue(contacts);

    const screen = await renderScreen();
    const { getByText, getByTestId, queryByTestId } = await renderScreen();
    fireEvent.press(getByTestId("sos-button"));
    await flush();

    const expoAv = require("expo-av").__mocked;
    expect(expoAv.mockSetAudioModeAsync).toHaveBeenCalled();
    expect(expoAv.mockCreateAsync).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      })
    );

    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 1000, 500], true);

    expect(getByTestId("camera")).toBeTruthy();

    await tick(0);
    expect(latestCameraProps.enableTorch).toBe(true);

    await tick(800);
    expect(latestCameraProps.enableTorch).toBe(false);

    await tick(800);
    expect(latestCameraProps.enableTorch).toBe(true);

    expect(mockDispatchEmergency).not.toHaveBeenCalled();
    await tick(3000);
    expect(mockDispatchEmergency).toHaveBeenCalledTimes(1);
    expect(mockDispatchEmergency).toHaveBeenCalledWith(contacts);

    await tick(5000);
    expect(mockDispatchEmergency).toHaveBeenCalledTimes(1);

    getByText("STOP");

    fireEvent.press(getByText("STOP")); // stop
    await flush();

    expect(expoAv.mockStopAsync).toHaveBeenCalled();
    expect(expoAv.mockUnloadAsync).toHaveBeenCalled();
    expect(Vibration.cancel).toHaveBeenCalled();
    expect(queryByTestId("camera")).toBeNull();
  });

  test("no contacts → guard modal; Cancel = start alarm", async () => {
    mockGetContacts.mockResolvedValue([]);

    const { getByTestId, queryByTestId } = await renderScreen();
    fireEvent.press(getByTestId("sos-button"));
    await flush();

    expect(getByTestId("confirm-modal")).toBeTruthy();

    fireEvent.press(getByTestId("cancel-btn"));
    await flush();

    const expoAv = require("expo-av").__mocked;
    expect(queryByTestId("confirm-modal")).toBeNull();
    expect(expoAv.mockSetAudioModeAsync).toHaveBeenCalled();
    expect(expoAv.mockCreateAsync).toHaveBeenCalled();
    expect(Vibration.vibrate).toHaveBeenCalled();
  });

  test("no contacts → guard modal; Confirm = navigate", async () => {
    mockGetContacts.mockResolvedValue([]);
    const { getByTestId } = await renderScreen();
    fireEvent.press(getByTestId("sos-button"));
    await flush();
    expect(getByTestId("confirm-modal")).toBeTruthy();

    fireEvent.press(getByTestId("confirm-btn"));
    await flush();

    expect(mockNavigate).toHaveBeenCalledWith("EmergencyContacts");
  });
});
