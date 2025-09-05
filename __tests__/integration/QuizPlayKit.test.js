/**
 * __tests__/integration/QuizPlayKit.test.js
 */

jest.useRealTimers();

const React = require("react");
const { View, Text } = require("react-native");

/* ---------------- Native shims (match other suites) ---------------------- */
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

// Sometimes RN reads from Libraries/*
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

/* ---------------- RN mock: keep Modal simple; map TouchableOpacity->Pressable */
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  const React = require("react");

  const Modal = ({ children, ...props }) => (
    <RN.View {...props}>{children}</RN.View>
  );
  Modal.displayName = "Modal";

  const TouchableOpacity = ({ children, onPress, ...props }) => (
    <RN.Pressable onPress={onPress} {...props}>
      {children}
    </RN.Pressable>
  );
  TouchableOpacity.displayName = "TouchableOpacity";

  return { ...RN, Modal, TouchableOpacity };
});

/* Disable NativeAnimated driver (avoid flushQueue issues) */
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

/* ---------------- Icons -> lightweight elements --------------------------- */
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    Ionicons: (props) => React.createElement("Icon", props),
    MaterialCommunityIcons: (props) => React.createElement("Icon", props),
  };
});

/* ---------------- Safe area insets ---------------------------------------- */
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

/* ---------------- Theme context & ThemeToggle ------------------------------ */
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

/* ---------------- i18n (return defaultValue or key) ------------------------ */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, defOrOpts) =>
      typeof defOrOpts === "string"
        ? defOrOpts
        : defOrOpts?.defaultValue ?? _key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

/* ---------------- Notify utils (used by SettingsModal) --------------------- */
let mockGetNotificationsEnabled = jest.fn(async () => true);
let mockSetNotificationsEnabled = jest.fn(async () => {});
let mockInitNotifications = jest.fn(async () => {});
jest.mock("../../utils/notify", () => ({
  __esModule: true,
  getNotificationsEnabled: (...a) => mockGetNotificationsEnabled(...a),
  setNotificationsEnabled: (...a) => mockSetNotificationsEnabled(...a),
  initNotifications: (...a) => mockInitNotifications(...a),
}));

/* ---------------- AsyncStorage (in-memory) -------------------------------- */
jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map();
  return {
    __esModule: true,
    default: {
      getItem: async (k) => (store.has(k) ? store.get(k) : null),
      setItem: async (k, v) => void store.set(k, String(v)),
      removeItem: async (k) => void store.delete(k),
      clear: async () => void store.clear(),
    },
  };
});

/* ---------------- Expo AV / Haptics (no real audio/haptics) ---------------- */
const mockBg = {
  playAsync: jest.fn(),
  stopAsync: jest.fn(),
  unloadAsync: jest.fn(),
};
const mockSfx = () => ({
  replayAsync: jest.fn(),
  unloadAsync: jest.fn(),
});
const mockCorrect = mockSfx();
const mockWrong = mockSfx();
const mockTimes = mockSfx();

jest.mock("expo-av", () => ({
  Audio: {
    setAudioModeAsync: jest.fn(async () => {}),
    Sound: {
      createAsync: jest.fn(async (_asset, _opts) => {
        // Return sequential sounds: bg, correct, wrong, times-up
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
}));

jest.mock("expo-haptics", () => ({
  NotificationFeedbackType: {
    Success: "success",
    Error: "error",
    Warning: "warning",
  },
  notificationAsync: jest.fn(async () => {}),
}));

/* ---------------- quizLogic: make timings tiny & scoring deterministic ----- */
jest.mock("../../utils/quizLogic", () => ({
  __esModule: true,
  QUESTION_SECONDS: 1, // tiny for tests
  REVEAL_DELAY_MS: 5,
  computeXp: jest.fn(() => 10),
  pickEncouragement: jest.fn(() => "keep going"),
  // Minimal flags logic for OptionItem visuals
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
}));

/* ---------------- RNTL ----------------------------------------------------- */
const {
  render,
  fireEvent,
  act,
  cleanup,
  waitFor,
} = require("@testing-library/react-native");
afterEach(() => cleanup());
const flush = async () => act(async () => void (await Promise.resolve()));

/* ---------------- SUT ------------------------------------------------------ */
const {
  useQuizEngine,
  OptionItem,
  HintModal,
  ToastOverlay,
  TimerBar,
  MetaPill,
  QuestionCard,
  SettingsModal,
} = require("../../screens/QuizPlayKit"); // ← adjust if your path differs

/* ---------------- Harnesses ------------------------------------------------ */
function EngineHarness({ questions, onFinish, sfx, haptics }) {
  const eng = useQuizEngine({ questions, sfx, haptics, onFinish });

  return (
    <React.Fragment>
      <MetaPill progress={eng.progressText} score={eng.score} />
      <QuestionCard text={eng.current?.text} />
      <TimerBar barW={eng.barW} onLayout={eng.onTrackLayout} time={eng.time} />
      <ToastOverlay
        toast={eng.toast}
        y={eng.toastY}
        opacity={eng.toastOpacity}
      />
      <View>
        {eng.current?.options?.map((opt, i) => (
          <OptionItem
            key={i}
            text={opt}
            flags={eng.flagsFor(i)}
            disabled={false}
            onPress={() => eng.choose(i)}
            testID={`opt-${i}`}
          />
        ))}
      </View>
      <Text testID="progress">{eng.progressText}</Text>
    </React.Fragment>
  );
}

/* ---------------- Tests ---------------------------------------------------- */
describe("QuizPlayKit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.__soundCount = 0;
  });

  test("useQuizEngine → correct answers, score & finish callback", async () => {
    jest.useFakeTimers();

    const questions = [
      {
        id: "q1",
        text: "1+1=?",
        options: ["1", "2", "3", "4"],
        answerIndex: 1,
      },
      {
        id: "q2",
        text: "2+2=?",
        options: ["4", "3", "2", "1"],
        answerIndex: 0,
      },
    ];

    const onFinish = jest.fn();
    const sfx = { play: jest.fn(), stopBg: jest.fn() };
    const haptics = { notify: jest.fn() };

    const screen = render(
      <EngineHarness
        questions={questions}
        onFinish={onFinish}
        sfx={sfx}
        haptics={haptics}
      />
    );

    await flush();

    // Answer Q1 correctly
    fireEvent.press(screen.getByTestId("opt-1"));
    // Toast “+ 10 XP” appears
    await waitFor(() => screen.getByText("+ 10 XP"));

    // Advance reveal delay to move to next Q
    await act(async () => {
      jest.advanceTimersByTime(5);
    });

    // Answer Q2 correctly
    fireEvent.press(screen.getByTestId("opt-0"));
    await waitFor(() => screen.getByText("+ 10 XP"));

    // Advance to trigger finish
    await act(async () => {
      jest.advanceTimersByTime(5);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    const payload = onFinish.mock.calls[0][0];
    expect(payload.total).toBe(2);
    expect(payload.correctCount).toBe(2);
    expect(payload.score).toBe(20); // 10 + 10 from our mocked computeXp
    expect(Array.isArray(payload.review)).toBe(true);

    // SFX/Haptics feedback
    expect(sfx.play).toHaveBeenCalledWith("correct");
    expect(haptics.notify).toHaveBeenCalledWith("success");

    jest.useRealTimers();
  });

  test("useQuizEngine → times up triggers sfx/haptics and proceeds", async () => {
    jest.useFakeTimers();

    const questions = [
      { id: "q1", text: "A?", options: ["a", "b"], answerIndex: 0 },
      { id: "q2", text: "B?", options: ["c", "d"], answerIndex: 1 },
    ];

    const onFinish = jest.fn();
    const sfx = { play: jest.fn(), stopBg: jest.fn() };
    const haptics = { notify: jest.fn() };

    render(
      <EngineHarness
        questions={questions}
        onFinish={onFinish}
        sfx={sfx}
        haptics={haptics}
      />
    );

    // Let Q1 time out (QUESTION_SECONDS = 1s)
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    // Reveal -> next
    await act(async () => {
      jest.advanceTimersByTime(5);
    });
    // Let Q2 time out
    await act(async () => {
      jest.advanceTimersByTime(1000 + 5);
    });

    expect(sfx.play).toHaveBeenCalledWith("timesup");
    expect(haptics.notify).toHaveBeenCalledWith("warning");
    expect(onFinish).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  test("OptionItem exposes selected/disabled via a11y state", async () => {
    const { getByText } = render(
      <OptionItem
        text="Pick me"
        onPress={() => {}}
        disabled={false}
        flags={{ showBlue: true, showGreen: false, showRed: false }}
      />
    );
    // The Text is a direct child of the touchable; parent holds the a11y props.
    const btn = getByText("Pick me").parent;
    expect(btn.props.accessibilityState.selected).toBe(true);
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });

  test("HintModal shows hint and closes", async () => {
    const onClose = jest.fn();
    const screen = render(
      <HintModal open={true} onClose={onClose} hint="Use soap and water." />
    );

    screen.getByText("Hint"); // title via i18n default
    screen.getByText("Use soap and water.");

    fireEvent.press(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  test("TimerBar + MetaPill + QuestionCard basic render", async () => {
    const { getByText } = render(
      <>
        <MetaPill progress="1/5" score={30} />
        <QuestionCard text="What is fire safety?" />
        <TimerBar
          barW={new (require("react-native").Animated.Value)(10)}
          onLayout={() => {}}
          time={7}
        />
      </>
    );

    getByText("1/5");
    getByText("30");
    getByText("What is fire safety?");
    getByText("Time");
    getByText("7");
  });

  test("SettingsModal → Done calls onClose", async () => {
    const onClose = jest.fn();
    const screen = render(
      <SettingsModal
        open={true}
        onClose={onClose}
        soundEnabled={true}
        setSoundEnabled={() => {}}
        hapticEnabled={true}
        setHapticEnabled={() => {}}
      />
    );

    // Title + "Done" button
    screen.getByText("Quiz Settings");
    const done = screen.getByText("Done");
    fireEvent.press(done);
    expect(onClose).toHaveBeenCalled();
  });
});
