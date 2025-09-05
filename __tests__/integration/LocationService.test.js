jest.useRealTimers();

/* ---------------- Native shims ---------------------- */
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

// Some RN versions read from Libraries path instead
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

/* ---------------- RN mock: keep FlatList/Modal simple & deterministic ----- */
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  const React = require("react");

  const Modal = ({ children, ...props }) => (
    <RN.View {...props}>{children}</RN.View>
  );
  Modal.displayName = "Modal";

  const FlatList = React.forwardRef(
    (
      {
        data = [],
        renderItem,
        keyExtractor,
        ItemSeparatorComponent,
        ListEmptyComponent,
        ListHeaderComponent,
        numColumns,
        columnWrapperStyle,
        ...rest
      },
      _ref
    ) => {
      const renderMaybe = (Comp) =>
        !Comp ? null : typeof Comp === "function" ? <Comp /> : Comp;

      const items = Array.isArray(data) ? data : [];
      const rows =
        numColumns && numColumns > 1
          ? items.reduce((acc, _, i) => {
              if (i % numColumns === 0)
                acc.push(items.slice(i, i + numColumns));
              return acc;
            }, [])
          : items.map((x) => [x]);

      return (
        <RN.View {...rest} testID="flatlist-mock">
          {renderMaybe(ListHeaderComponent)}
          {items.length === 0
            ? renderMaybe(ListEmptyComponent)
            : rows.map((row, r) => (
                <RN.View
                  key={`r-${r}`}
                  style={numColumns > 1 ? columnWrapperStyle : undefined}
                >
                  {row.map((item, index) => (
                    <RN.View
                      key={
                        keyExtractor
                          ? keyExtractor(item, r * (numColumns || 1) + index)
                          : r * (numColumns || 1) + index
                      }
                    >
                      {renderItem?.({
                        item,
                        index: r * (numColumns || 1) + index,
                      })}
                      {ItemSeparatorComponent ? (
                        <ItemSeparatorComponent />
                      ) : null}
                    </RN.View>
                  ))}
                </RN.View>
              ))}
        </RN.View>
      );
    }
  );
  FlatList.displayName = "FlatList";

  // Expose Alert + Linking like the app code expects
  const Linking = {
    openURL: jest.fn(),
    canOpenURL: jest.fn(async () => true),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getInitialURL: jest.fn(),
  };

  return { ...RN, Modal, FlatList, Alert: { alert: jest.fn() }, Linking };
});

/* ---------------- RNTL after RN mocked ----------------------------------- */
const {
  render,
  fireEvent,
  act,
  cleanup,
  waitFor,
} = require("@testing-library/react-native");
afterEach(() => cleanup());
const flush = async () => act(async () => void (await Promise.resolve()));

/* ---------------- Theme context mock ------------------------------------- */
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

/* ---------------- Icons -> simple element -------------------------------- */
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return { Ionicons: (props) => React.createElement("Icon", props) };
});

/* ---------------- Navigation (manual mock) -------------------------------- */
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

/* ---------------- i18n (defaults + interpolation) ------------------------ */
jest.mock("react-i18next", () => ({
  useTranslation: () => {
    const interpolate = (s, vars) =>
      String(s ?? "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
        vars && Object.prototype.hasOwnProperty.call(vars, k)
          ? String(vars[k])
          : `{{${k}}}`
      );
    const t = (key, a) => {
      if (typeof a === "string") return a; // t(key, "Default")
      const opts = a || {};
      return interpolate(opts.defaultValue || key, opts);
    };
    return { t, i18n: { language: "en", changeLanguage: jest.fn() } };
  },
}));

/* ---------------- locationService + mockFlags ----------------------------- */
let demoEnabled = false;
let currentLoc = {
  coords: { latitude: 1.23, longitude: 103.77 },
  region: "East",
  address: "123 Test St",
  postal: "123456",
};
let flagsState = {
  flood: false,
  haze: false,
  dengue: false,
  wind: false,
  heat: false,
};

const resolve = () => Promise.resolve({ ...currentLoc, mocked: !!demoEnabled });

let mockResolveLocationLabel = jest.fn(resolve);
let mockGetDemoLocationEnabled = jest.fn(async () => demoEnabled);
let mockSetDemoLocationEnabled = jest.fn(async (v) => {
  demoEnabled = !!v;
});
jest.mock("../../utils/locationService", () => ({
  __esModule: true,
  resolveLocationLabel: (...a) => mockResolveLocationLabel(...a),
  getDemoLocationEnabled: (...a) => mockGetDemoLocationEnabled(...a),
  setDemoLocationEnabled: (...a) => mockSetDemoLocationEnabled(...a),
}));

let mockGetMockFlags = jest.fn(async () => ({ ...flagsState }));
let mockSetMockFlag = jest.fn(async (k, v) => {
  flagsState[k] = !!v;
});
let mockSetMockFloodEnabled = jest.fn(async (v) => {
  flagsState.flood = !!v;
});
jest.mock("../../utils/mockFlags", () => ({
  __esModule: true,
  getMockFlags: (...a) => mockGetMockFlags(...a),
  setMockFlag: (...a) => mockSetMockFlag(...a),
  setMockFloodEnabled: (...a) => mockSetMockFloodEnabled(...a),
}));

/* ---------------- SUT ----------------------------------------------------- */
const LocationSettings = require("../../screens/LocationSettings").default;

/* ---------------- Helpers ------------------------------------------------- */
const renderScreen = async () => {
  const r = render(<LocationSettings />);
  // initial mount will show "Fetching…" then settle
  await waitFor(() => r.getByText("Location & Testing"));
  return r;
};

/* ---------------- Tests --------------------------------------------------- */
describe("LocationSettings (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reset backing state
    demoEnabled = false;
    currentLoc = {
      coords: { latitude: 1.23, longitude: 103.77 },
      region: "East",
      address: "123 Test St",
      postal: "123456",
    };
    flagsState = {
      flood: false,
      haze: false,
      dengue: false,
      wind: false,
      heat: false,
    };

    mockResolveLocationLabel = jest.fn(resolve);
    mockGetDemoLocationEnabled = jest.fn(async () => demoEnabled);
    mockSetDemoLocationEnabled = jest.fn(async (v) => {
      demoEnabled = !!v;
    });
    mockGetMockFlags = jest.fn(async () => ({ ...flagsState }));
    mockSetMockFlag = jest.fn(async (k, v) => {
      flagsState[k] = !!v;
    });
    mockSetMockFloodEnabled = jest.fn(async (v) => {
      flagsState.flood = !!v;
    });
  });

  test("initial load: shows loading, then coordinates & region; Refresh updates", async () => {
    const screen = await renderScreen();

    // Loading copy shows briefly (non-fatal if it disappears quickly)
    screen.getByText("Fetching…");

    // Then we see formatted coordinates & region
    await waitFor(() => screen.getByText("Coordinates"));
    screen.getByText("1.230000, 103.770000");
    screen.getByText("Region");
    screen.getByText("East");

    // Change location and hit Refresh
    currentLoc = {
      ...currentLoc,
      coords: { latitude: 1.23456789, longitude: 103.8181818 },
      region: "Central",
    };
    fireEvent.press(screen.getByLabelText("Refresh"));
    await waitFor(() => screen.getByText("1.234568, 103.818182"));
    screen.getByText("Central");
  });

  test("back button calls navigation.goBack", async () => {
    const screen = await renderScreen();
    const back = screen.getByLabelText("Back");
    fireEvent.press(back);
    expect(mockGoBack).toHaveBeenCalled();
  });

  test("Demo Location toggle persists flag and shows 'Using demo location (mocked).'", async () => {
    const screen = await renderScreen();

    const switches = screen.getAllByRole("switch");
    const demoSwitch = switches[0]; // first switch is the master demo toggle
    expect(demoSwitch.props.value).toBe(false);

    // Enable
    fireEvent(demoSwitch, "valueChange", true);
    await flush();

    expect(mockSetDemoLocationEnabled).toHaveBeenCalledWith(true);
    // load() runs; resolver now returns mocked: true via demoEnabled variable
    await waitFor(() => screen.getByText("Using demo location (mocked)."));

    // Disable again
    fireEvent(demoSwitch, "valueChange", false);
    await flush();
    expect(mockSetDemoLocationEnabled).toHaveBeenCalledWith(false);
  });

  test("hazard mock toggles call correct setters and reflect values", async () => {
    const screen = await renderScreen();

    const sw = screen.getAllByRole("switch");
    const [demo, flood, haze, dengue, wind, heat] = sw;
    expect(demo).toBeTruthy();

    // Turn each ON
    fireEvent(flood, "valueChange", true);
    fireEvent(haze, "valueChange", true);
    fireEvent(dengue, "valueChange", true);
    fireEvent(wind, "valueChange", true);
    fireEvent(heat, "valueChange", true);
    await flush();

    expect(mockSetMockFloodEnabled).toHaveBeenCalledWith(true);
    expect(mockSetMockFlag).toHaveBeenCalledWith("haze", true);
    expect(mockSetMockFlag).toHaveBeenCalledWith("dengue", true);
    expect(mockSetMockFlag).toHaveBeenCalledWith("wind", true);
    expect(mockSetMockFlag).toHaveBeenCalledWith("heat", true);

    // Values updated
    expect(flood.props.value).toBe(true);
    expect(haze.props.value).toBe(true);
    expect(dengue.props.value).toBe(true);
    expect(wind.props.value).toBe(true);
    expect(heat.props.value).toBe(true);

    // Turn OFF flood + one other to ensure false path
    fireEvent(flood, "valueChange", false);
    fireEvent(heat, "valueChange", false);
    await flush();
    expect(mockSetMockFloodEnabled).toHaveBeenCalledWith(false);
    expect(mockSetMockFlag).toHaveBeenCalledWith("heat", false);
    expect(flood.props.value).toBe(false);
    expect(heat.props.value).toBe(false);
  });

  test("initial mock flags hydrate switch values", async () => {
    // Pre-set flags before render
    flagsState = {
      flood: true,
      haze: true,
      dengue: false,
      wind: false,
      heat: true,
    };
    const screen = await renderScreen();

    const [, flood, haze, dengue, wind, heat] = screen.getAllByRole("switch");
    expect(flood.props.value).toBe(true);
    expect(haze.props.value).toBe(true);
    expect(dengue.props.value).toBe(false);
    expect(wind.props.value).toBe(false);
    expect(heat.props.value).toBe(true);
  });

  test("error state: shows translated fallback when resolver fails", async () => {
    mockResolveLocationLabel = jest.fn(async () => {
      // Throw with empty message so the screen uses the translated fallback
      throw new Error("");
    });

    const screen = await renderScreen();
    // It will attempt load on mount; wait for error message
    await waitFor(() => screen.getByText("Could not fetch your location."));
  });
});
