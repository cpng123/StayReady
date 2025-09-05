jest.useFakeTimers({ legacyFakeTimers: true });

/* ---------------- Native shims ------------------- */
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

try {
  // eslint-disable-next-line jest/no-jest-do-mock
  jest.doMock(
    "react-native/Libraries/Animated/NativeAnimatedHelper",
    () => ({ shouldUseNativeDriver: () => false })
  );
} catch {
  try {
    // eslint-disable-next-line jest/no-jest-do-mock
    jest.doMock(
      "react-native/Libraries/Animated/src/NativeAnimatedHelper",
      () => ({ shouldUseNativeDriver: () => false })
    );
  } catch {}
}

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

/* -------- React Native mock: inline Modal + FlatList w/ imperative ref ---- */
let mockCarouselScrollCalls = [];

jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  const React = require("react");

  const Modal = ({ children, ...props }) => <RN.View {...props}>{children}</RN.View>;
  Modal.displayName = "Modal";

  const FlatList = React.forwardRef(
    (
      {
        data = [],
        renderItem,
        keyExtractor,
        ItemSeparatorComponent,
        horizontal,
        pagingEnabled,
        ListHeaderComponent,
        ListEmptyComponent,
        ...rest
      },
      ref
    ) => {
      const imperative = {
        scrollToIndex: ({ index }) => {
          if (horizontal && pagingEnabled) {
            mockCarouselScrollCalls.push(index);
          }
        },
      };
      if (ref) {
        if (typeof ref === "function") ref(imperative);
        else ref.current = imperative;
      }

      const renderMaybe = (Comp) => {
        if (!Comp) return null;
        return typeof Comp === "function" ? <Comp /> : Comp;
      };

      return (
        <RN.View {...rest} testID="flatlist-mock">
          {renderMaybe(ListHeaderComponent)}
          {data.length === 0
            ? renderMaybe(ListEmptyComponent)
            : data.map((item, index) => (
                <RN.View key={keyExtractor ? keyExtractor(item, index) : index}>
                  {renderItem?.({ item, index })}
                  {ItemSeparatorComponent ? <ItemSeparatorComponent /> : null}
                </RN.View>
              ))}
        </RN.View>
      );
    }
  );
  FlatList.displayName = "FlatList";

  return { ...RN, Modal, FlatList };
});

/* ---------------- RNTL after RN mocked ----------------------------------- */
const { render, fireEvent, act, cleanup, waitFor } = require("@testing-library/react-native");
afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  mockCarouselScrollCalls = [];
});
const flush = async () => act(async () => { await Promise.resolve(); });

/* ---------------- App-level mocks ---------------------------------------- */
// i18n: return defaultValue (string OR {defaultValue}) if provided
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k, arg) => {
      if (typeof arg === "string") return arg;
      if (arg && typeof arg === "object" && "defaultValue" in arg) return arg.defaultValue;
      return k;
    },
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
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

// Vector icons + gradient → simple elements
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return { Ionicons: (props) => React.createElement("Icon", props) };
});
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children, ...p }) => {
    const { View } = require("react-native");
    return <View {...p}>{children}</View>;
  },
}));

// Navigation mock
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

/* ---------------- WarningCard mock (pressable for grid) ------------------- */
jest.mock("../../components/WarningCard", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ item, onPress, style }) => (
    <Pressable testID={`card-${item.id}`} onPress={onPress} style={style}>
      <View>
        <Text>{item.title}</Text>
        <Text>{item.desc || item.hazard?.summary || ""}</Text>
      </View>
    </Pressable>
  );
});

/* ---------------- useHazards hook mock (controllable) --------------------- */
let mockHazardsReturn = { loading: true, cards: [] }; // default
jest.mock("../../hooks/useHazards", () => ({
  __esModule: true,
  default: (..._args) => mockHazardsReturn,
}));

/* ---------------- SUT ----------------------------------------------------- */
const EarlyWarningScreen = require("../../screens/EarlyWarningScreen").default;

/* ---------------- Fixtures ------------------------------------------------ */
const sampleCards = [
  {
    id: "c1",
    title: "Heavy Rain",
    desc: "Flash flood possible",
    img: { uri: "x1" },
    hazard: { id: "h1", summary: "Flood watch" },
  },
  {
    id: "c2",
    title: "Haze Alert",
    desc: "PM2.5 elevated",
    img: { uri: "x2" },
    hazard: { id: "h2", summary: "Air quality advisory" },
  },
  {
    id: "c3",
    title: "Strong Wind",
    desc: "Gusts up to 60km/h",
    img: { uri: "x3" },
    hazard: { id: "h3", summary: "Wind advisory" },
  },
];

/* ---------------- Helper to render --------------------------------------- */
const renderScreen = async () => {
  const r = render(
    <EarlyWarningScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack }} />
  );
  await flush();
  return r;
};

/* ---------------- Tests --------------------------------------------------- */
describe("EarlyWarningScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHazardsReturn = { loading: true, cards: [] };
  });

  test("loading state: shows hero spinner and 'Loading…' list copy", async () => {
    mockHazardsReturn = { loading: true, cards: [] };
    const screen = await renderScreen();

    await waitFor(() => screen.getByText("Loading…"));
  });

  test("empty state after load: shows 'No hazards right now.'", async () => {
    mockHazardsReturn = { loading: false, cards: [] };
    const screen = await renderScreen();

    screen.getByText("No hazards right now.");
  });

  test("with cards: renders hero + grid; tapping a grid card navigates", async () => {
    mockHazardsReturn = { loading: false, cards: sampleCards };
    const screen = await renderScreen();

    // Header copy renders
    screen.getByText("Early Warning");
    screen.getByText("Monitoring common hazards");

    // Grid cards render
    sampleCards.forEach((c) => screen.getByTestId(`card-${c.id}`));

    // Tap a grid card -> navigates to HazardDetail with hazard param
    fireEvent.press(screen.getByTestId("card-c2"));
    expect(mockNavigate).toHaveBeenCalledWith("HazardDetail", { hazard: sampleCards[1].hazard });
  });

  test("auto-advances the hero carousel (calls scrollToIndex every 5s)", async () => {
    mockHazardsReturn = { loading: false, cards: sampleCards };
    await renderScreen();

    expect(mockCarouselScrollCalls.length).toBe(0);

    jest.advanceTimersByTime(5000);
    await flush();
    expect(mockCarouselScrollCalls).toContain(1);

    jest.advanceTimersByTime(5000);
    await flush();
    expect(mockCarouselScrollCalls).toContain(2);

    jest.advanceTimersByTime(5000);
    await flush();
    expect(mockCarouselScrollCalls).toContain(0);
  });
});
