/**
 * __tests__/integration/QuizPlayScreen.test.js
 */

jest.useRealTimers();

const React = require("react");

/* -------------------------------------------------------------------------- */
/* Native shims (same spirit as QuizPlayKit tests)                            */
/* -------------------------------------------------------------------------- */
jest.mock("react-native/src/private/specs/modules/NativeDeviceInfo", () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      Dimensions: {
        window: { width: 360, height: 640, scale: 2, fontScale: 1 },
        screen: { width: 360, height: 640, scale: 2, fontScale: 1 },
      },
      isIPhoneX_deprecated: false,
      isIPhoneXr_deprecated: false,
    }),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

jest.mock(
  "react-native/src/private/specs/modules/NativePlatformConstantsIOS",
  () => ({
    __esModule: true,
    default: {
      getConstants: () => ({
        forceTouchAvailable: false,
        interfaceIdiom: "phone",
        osVersion: "17.0",
        systemName: "iOS",
        isTesting: true,
        isDisableAnimations: false,
        reactNativeVersion: { major: 0, minor: 0, patch: 0, prerelease: null },
      }),
    },
  })
);

jest.mock(
  "react-native/Libraries/Utilities/NativePlatformConstantsIOS",
  () => ({
    __esModule: true,
    default: {
      getConstants: () => ({
        forceTouchAvailable: false,
        interfaceIdiom: "phone",
        osVersion: "17.0",
        systemName: "iOS",
        isTesting: true,
        isDisableAnimations: false,
        reactNativeVersion: { major: 0, minor: 0, patch: 0, prerelease: null },
      }),
    },
  })
);

jest.mock("react-native/src/private/specs/modules/NativeI18nManager", () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      isRTL: false,
      doLeftAndRightSwapInRTL: false,
      allowRTL: false,
      forceRTL: false,
      localeIdentifier: "en_US",
    }),
    allowRTL: jest.fn(),
    forceRTL: jest.fn(),
    swapLeftAndRightInRTL: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));
jest.mock("react-native/Libraries/ReactNative/NativeI18nManager", () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      isRTL: false,
      doLeftAndRightSwapInRTL: false,
      allowRTL: false,
      forceRTL: false,
      localeIdentifier: "en_US",
    }),
    allowRTL: jest.fn(),
    forceRTL: jest.fn(),
    swapLeftAndRightInRTL: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter", () =>
  jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    removeAllListeners: jest.fn(),
    removeSubscription: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    listeners: jest.fn(),
  }))
);

jest.mock("react-native/Libraries/TurboModule/TurboModuleRegistry", () => ({
  getEnforcing: jest.fn(() => ({})),
  get: jest.fn(() => ({})),
}));

jest.mock("react-native/Libraries/Settings/Settings", () => ({
  get: jest.fn(() => undefined),
  set: jest.fn(),
  watchKeys: jest.fn(),
  clearWatch: jest.fn(),
}));

/* -------------------------------------------------------------------------- */
/* react-native mock: Pressable touchable, and a Modal that respects visible  */
/* -------------------------------------------------------------------------- */
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  const React = require("react");

  const Modal = ({ children, visible, ...props }) =>
    visible ? <RN.View {...props}>{children}</RN.View> : null;
  Modal.displayName = "Modal";

  const TouchableOpacity = ({ children, onPress, ...props }) => (
    <RN.Pressable onPress={onPress} {...props}>
      {children}
    </RN.Pressable>
  );
  TouchableOpacity.displayName = "TouchableOpacity";

  // ➜ Add this mock Switch
  const Switch = ({ value, onValueChange, ...props }) => (
    <RN.Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: !!value }}
      onPress={() => onValueChange?.(!value)}
      {...props}
    >
      {/* show state so we can query it within the row */}
      <RN.Text>{value ? "on" : "off"}</RN.Text>
    </RN.Pressable>
  );
  Switch.displayName = "Switch";

  return { ...RN, Modal, TouchableOpacity, Switch };
});

/* Disable NativeAnimated driver */
try {
  // RN 0.73+
  // eslint-disable-next-line jest/no-jest-do-mock
  jest.doMock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({
    shouldUseNativeDriver: () => false,
  }));
} catch {
  try {
    // Older RN
    // eslint-disable-next-line jest/no-jest-do-mock
    jest.doMock(
      "react-native/Libraries/Animated/src/NativeAnimatedHelper",
      () => ({
        shouldUseNativeDriver: () => false,
      })
    );
  } catch {}
}

/* -------------------------------------------------------------------------- */
/* Icons, Safe Area, Theme                                                     */
/* -------------------------------------------------------------------------- */
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    Ionicons: (props) => React.createElement("Icon", props),
    MaterialCommunityIcons: (props) => React.createElement("Icon", props),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../theme/ThemeProvider", () => {
  const ctx = {
    theme: {
      key: "light",
      colors: {
        appBg: "#fff",
        card: "#fff",
        text: "#111",
        subtext: "#6b7280",
        primary: "#2563eb",
      },
    },
  };
  return {
    ThemeProvider: ({ children }) => <>{children}</>,
    useThemeContext: () => ctx,
  };
});

/* -------------------------------------------------------------------------- */
/* i18n                                                                        */
/* -------------------------------------------------------------------------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, defOrOpts) =>
      typeof defOrOpts === "string"
        ? defOrOpts
        : defOrOpts?.defaultValue ?? _key,
    i18n: {
      language: "en",
      options: { fallbackLng: "en" },
      changeLanguage: jest.fn(),
      getResourceBundle: jest.fn(() => null),
    },
  }),
}));

/* -------------------------------------------------------------------------- */
/* Notify + AsyncStorage + Expo AV/Haptics                                     */
/* -------------------------------------------------------------------------- */
let mockGetNotificationsEnabled = jest.fn(async () => true);
let mockSetNotificationsEnabled = jest.fn(async () => {});
let mockInitNotifications = jest.fn(async () => {});
jest.mock("../../utils/notify", () => ({
  __esModule: true,
  getNotificationsEnabled: (...a) => mockGetNotificationsEnabled(...a),
  setNotificationsEnabled: (...a) => mockSetNotificationsEnabled(...a),
  initNotifications: (...a) => mockInitNotifications(...a),
}));

jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map();
  return {
    __esModule: true,
    default: {
      getItem: async (k) => (store.has(k) ? store.get(k) : null),
      setItem: async (k, v) => void store.set(k, String(v)),
      removeItem: async (k) => void store.delete(k),
      clear: async () => void store.clear(),
      // expose for tests
      __store: store,
    },
  };
});

jest.mock("expo-av", () => {
  const mockBg = {
    playAsync: jest.fn(),
    stopAsync: jest.fn(),
    unloadAsync: jest.fn(),
  };
  const mkSfx = () => ({
    replayAsync: jest.fn(),
    unloadAsync: jest.fn(),
  });
  const mockCorrect = mkSfx();
  const mockWrong = mkSfx();
  const mockTimes = mkSfx();

  return {
    Audio: {
      setAudioModeAsync: jest.fn(async () => {}),
      Sound: {
        createAsync: jest.fn(async (_asset, _opts) => {
          if (!global.__soundCount) global.__soundCount = 0;
          const idx = global.__soundCount++;
          if (idx === 0) return { sound: mockBg };
          if (idx === 1) return { sound: mockCorrect };
          if (idx === 2) return { sound: mockWrong };
          return { sound: mockTimes };
        }),
      },
      INTERRUPTION_MODE_IOS_DO_NOT_MIX: 1,
    },
  };
});

jest.mock("expo-haptics", () => ({
  NotificationFeedbackType: {
    Success: "success",
    Error: "error",
    Warning: "warning",
  },
  notificationAsync: jest.fn(async () => {}),
}));

/* -------------------------------------------------------------------------- */
/* quizLogic (timing + XP + normalize stub)                                    */
/* -------------------------------------------------------------------------- */
const normalizeSpy = jest.fn(() => []);
jest.mock("../../utils/quizLogic", () => {
  return {
    __esModule: true,
    QUESTION_SECONDS: 1,
    REVEAL_DELAY_MS: 5,
    computeXp: jest.fn(() => 10),
    pickEncouragement: jest.fn(() => "keep going"),
    deriveRevealFlags: (i, answerIdx, selected, locked, timesUp) => ({
      showGreen: locked && i === answerIdx,
      showRed: locked && selected === i && i !== answerIdx,
      showBlue: !locked && selected === i,
      timesUp: !!timesUp,
    }),
    getToastTheme: () => ({
      correct: { bg: "#16A34A", title: "Correct!", pillText: "#0" },
      incorrect: { bg: "#DC2626", title: "Incorrect", pillText: "#0" },
      timesup: { bg: "#F59E0B", title: "Time", pillText: "#0" },
    }),
    normalizeQuestions: jest.fn(() => []), // <-- spy lives inside factory
  };
});

/* -------------------------------------------------------------------------- */
/* Top UI pieces used on this screen                                           */
/* -------------------------------------------------------------------------- */
jest.mock("../../components/ThemeToggle", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return function ThemeToggle() {
    return (
      <View testID="theme-toggle">
        <Text>ThemeToggle</Text>
      </View>
    );
  };
});

jest.mock("../../components/TopBar", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");
  return function TopBar({ title, onBack, rightIcon, onRightPress }) {
    return (
      <View>
        <Text>{title}</Text>
        <Pressable testID="topbar-back" onPress={onBack}>
          <Text>Back</Text>
        </Pressable>
        {rightIcon ? (
          <Pressable testID="topbar-settings" onPress={onRightPress}>
            <Text>Settings</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };
});

jest.mock("../../components/ConfirmModal", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");
  return function ConfirmModal({
    visible,
    title,
    message,
    confirmLabel = "Leave",
    cancelLabel = "Stay",
    onConfirm,
    onCancel,
  }) {
    if (!visible) return null;
    return (
      <View accessibilityRole="dialog">
        <Text>{title}</Text>
        <Text>{message}</Text>
        <Pressable testID="cancel-stay" onPress={onCancel}>
          <Text>{cancelLabel}</Text>
        </Pressable>
        <Pressable testID="confirm-leave" onPress={onConfirm}>
          <Text>{confirmLabel}</Text>
        </Pressable>
      </View>
    );
  };
});

/* -------------------------------------------------------------------------- */
/* Progress / Daily utils                                                      */
/* -------------------------------------------------------------------------- */
const mockAddAttempt = jest.fn(async () => {});
jest.mock("../../utils/progressStats", () => ({
  addQuizAttempt: (...a) => mockAddAttempt(...a),
}));

const mockMarkDaily = jest.fn(async () => {});
jest.mock("../../utils/dailyChallenge", () => ({
  markDailyCompleted: (...a) => mockMarkDaily(...a),
}));

/* -------------------------------------------------------------------------- */
/* RNTL setup                                                                  */
/* -------------------------------------------------------------------------- */
const {
  render,
  fireEvent,
  act,
  cleanup,
  waitFor,
  within,
} = require("@testing-library/react-native");
afterEach(() => cleanup());
const flush = async () => act(async () => void (await Promise.resolve()));

// ⬇️ Put this before you import/render the SUT
jest.mock("../../screens/QuizPlayKit", () => {
  const actual = jest.requireActual("../../screens/QuizPlayKit");
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");

  // Minimal SettingsModal that exposes two testID-ed "switches"
  const SettingsModal = ({
    open,
    onClose,
    soundEnabled,
    setSoundEnabled,
    hapticEnabled,
    setHapticEnabled,
  }) => {
    if (!open) return null;

    const [sfx, setSfx] = React.useState(!!soundEnabled);
    const [hap, setHap] = React.useState(!!hapticEnabled);

    const toggleSfx = () => {
      setSfx((v) => {
        const nv = !v;
        setSoundEnabled(nv);
        return nv;
      });
    };
    const toggleHap = () => {
      setHap((v) => {
        const nv = !v;
        setHapticEnabled(nv);
        return nv;
      });
    };

    return (
      <View>
        <Text>Quiz Settings</Text>

        <View>
          <Text>Sound effects</Text>
          <Pressable
            testID="settings-sfx-switch"
            accessibilityRole="switch"
            onPress={toggleSfx}
          >
            <Text>{sfx ? "on" : "off"}</Text>
          </Pressable>
        </View>

        <View>
          <Text>Haptics</Text>
          <Pressable
            testID="settings-hap-switch"
            accessibilityRole="switch"
            onPress={toggleHap}
          >
            <Text>{hap ? "on" : "off"}</Text>
          </Pressable>
        </View>

        <Pressable onPress={onClose}>
          <Text>Done</Text>
        </Pressable>
      </View>
    );
  };

  return { ...actual, SettingsModal };
});

/* -------------------------------------------------------------------------- */
/* SUT                                                                         */
/* -------------------------------------------------------------------------- */
const QuizPlayScreen = require("../../screens/QuizPlayScreen").default;

/* Helpers */
const makeNav = () => ({
  replace: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()), // returns unsubscribe
});

describe("QuizPlayScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.__soundCount = 0;
  });

  test("plays a custom quiz to completion and navigates to results", async () => {
    jest.useFakeTimers();

    const navigation = makeNav();
    const route = {
      params: {
        title: "Unit Quiz",
        customQuestions: [
          {
            id: "q1",
            text: "1+1=?",
            options: ["1", "2"],
            answerIndex: 1,
            hint: "basic add",
          },
          {
            id: "q2",
            text: "2+2=?",
            options: ["4", "3"],
            answerIndex: 0,
            hint: "more add",
          },
        ],
      },
    };

    const screen = render(
      <QuizPlayScreen navigation={navigation} route={route} />
    );

    await flush();

    // Q1: choose "2"
    fireEvent.press(screen.getByText("2"));
    await waitFor(() => screen.getByText("+ 10 XP"));
    await act(async () => jest.advanceTimersByTime(5));

    // Q2: choose "4"
    fireEvent.press(screen.getByText("4"));
    await waitFor(() => screen.getByText("+ 10 XP"));
    await act(async () => jest.advanceTimersByTime(5));

    // Navigated to results with aggregated payload
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    const [routeName, payload] = navigation.replace.mock.calls[0];
    expect(routeName).toBe("QuizResult");
    expect(payload.title).toBe("Unit Quiz");
    expect(payload.total).toBe(2);
    expect(payload.correct).toBe(2);
    expect(payload.score).toBe(20);
    expect(Array.isArray(payload.review)).toBe(true);

    // progressStats gets recorded
    expect(mockAddAttempt).toHaveBeenCalledTimes(1);
    const attempt = mockAddAttempt.mock.calls[0][0];
    expect(attempt.xpEarned).toBe(20);
    expect(attempt.correct).toBe(2);
    expect(attempt.total).toBe(2);

    jest.useRealTimers();
  });

  test("times out on every question and still navigates to results", async () => {
    jest.useFakeTimers();

    const navigation = makeNav();
    const route = {
      params: {
        title: "Timeout Quiz",
        customQuestions: [
          {
            id: "q1",
            text: "A?",
            options: ["a", "b"],
            answerIndex: 0,
            hint: "",
          },
          {
            id: "q2",
            text: "B?",
            options: ["c", "d"],
            answerIndex: 1,
            hint: "",
          },
        ],
      },
    };

    render(<QuizPlayScreen navigation={navigation} route={route} />);

    // Let Q1 time out (QUESTION_SECONDS = 1s)
    await act(async () => jest.advanceTimersByTime(1000));
    // wait through reveal delay
    await act(async () => jest.advanceTimersByTime(5));
    // Let Q2 time out + reveal
    await act(async () => jest.advanceTimersByTime(1000 + 5));

    expect(navigation.replace).toHaveBeenCalledTimes(1);
    const [, payload] = navigation.replace.mock.calls[0];
    expect(payload.total).toBe(2);
    expect(payload.correct).toBe(0);
    expect(Array.isArray(payload.review)).toBe(true);

    jest.useRealTimers();
  });

  test("back confirm modal opens via TopBar and confirm triggers goBack", async () => {
    const navigation = makeNav();
    const route = {
      params: {
        title: "Back Test",
        customQuestions: [
          {
            id: "q1",
            text: "A?",
            options: ["a", "b"],
            answerIndex: 0,
            hint: "",
          },
        ],
      },
    };

    const { getByTestId, queryByTestId } = render(
      <QuizPlayScreen navigation={navigation} route={route} />
    );

    // Open leave-confirm
    fireEvent.press(getByTestId("topbar-back"));
    expect(queryByTestId("confirm-leave")).toBeTruthy();
    expect(queryByTestId("cancel-stay")).toBeTruthy();

    // Cancel once
    fireEvent.press(getByTestId("cancel-stay"));
    expect(navigation.goBack).not.toHaveBeenCalled();

    // Open again and confirm leave
    fireEvent.press(getByTestId("topbar-back"));
    fireEvent.press(getByTestId("confirm-leave"));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  test("hint modal and settings modal open/close", async () => {
    const navigation = makeNav();
    const route = {
      params: {
        title: "Modals",
        customQuestions: [
          {
            id: "q1",
            text: "X?",
            options: ["x", "y"],
            answerIndex: 0,
            hint: "my hint",
          },
        ],
      },
    };

    const { getByText, queryByText, getByTestId } = render(
      <QuizPlayScreen navigation={navigation} route={route} />
    );

    // Settings via TopBar
    fireEvent.press(getByTestId("topbar-settings"));
    // SettingsModal content appears
    getByText("Quiz Settings");
    getByText("Done");
    fireEvent.press(getByText("Done"));
    // Should close (since our Modal respects visible)
    await waitFor(() => expect(queryByText("Quiz Settings")).toBeFalsy());

    // Hint modal — press the button labelled "Hint"
    fireEvent.press(getByText("Hint"));
    // Avoid title ambiguity by checking the unique body text
    getByText("my hint");
    fireEvent.press(getByText("Close"));
    await waitFor(() => expect(queryByText("my hint")).toBeFalsy());
  });

  test("settings switches persist sfx/haptics preferences to AsyncStorage", async () => {
    const navigation = makeNav();
    const route = {
      params: {
        title: "Settings",
        customQuestions: [
          { id: "q1", text: "A?", options: ["a", "b"], answerIndex: 0 },
        ],
      },
    };

    const { getByText, getByTestId } = render(
      <QuizPlayScreen navigation={navigation} route={route} />
    );

    // Open settings
    fireEvent.press(getByTestId("topbar-settings"));
    getByText("Quiz Settings");

    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;

    const sfxSwitch = getByTestId("settings-sfx-switch");
    const hapSwitch = getByTestId("settings-hap-switch");

    // OFF both -> expect both "0"
    fireEvent.press(sfxSwitch);
    fireEvent.press(hapSwitch);
    await waitFor(async () => {
      expect(await AsyncStorage.getItem("pref:sfxEnabled")).toBe("0");
      expect(await AsyncStorage.getItem("pref:hapticsEnabled")).toBe("0");
    });

    // ON both -> expect both "1"
    fireEvent.press(sfxSwitch);
    fireEvent.press(hapSwitch);
    await waitFor(async () => {
      expect(await AsyncStorage.getItem("pref:sfxEnabled")).toBe("1");
      expect(await AsyncStorage.getItem("pref:hapticsEnabled")).toBe("1");
    });
  });

  test("falls back to normalizeQuestions when no custom questions are supplied", async () => {
    const navigation = makeNav();
    const route = {
      params: { title: "From i18n", categoryId: "cat-1", setId: "set-1" },
    };

    render(<QuizPlayScreen navigation={navigation} route={route} />);

    await flush();

    // Pull the mocked function from the mocked module and assert calls
    const { normalizeQuestions } = require("../../utils/quizLogic");
    expect(normalizeQuestions).toHaveBeenCalledTimes(1);
  });
});
