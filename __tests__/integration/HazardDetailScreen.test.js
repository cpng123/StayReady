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
jest.mock("react-native/Libraries/Utilities/NativePlatformConstantsIOS", () => ({
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
}));

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
              if (i % numColumns === 0) acc.push(items.slice(i, i + numColumns));
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
                      {ItemSeparatorComponent ? <ItemSeparatorComponent /> : null}
                    </RN.View>
                  ))}
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
const {
  render,
  fireEvent,
  act,
  cleanup,
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

/* ---------------- Icons -> simple elements -------------------------------- */
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return { Ionicons: (props) => React.createElement("Icon", props) };
});

/* ---------------- Child components --------------------------------------- */
// Lean banner mock that surfaces key props
jest.mock("../../components/HazardBanner", () => {
  const { View, Text } = require("react-native");
  return ({ hazard, dateStr, timeAgoStr, locLabel, style }) => (
    <View testID="hazard-banner" style={style}>
      <Text>{hazard?.kind}</Text>
      {locLabel ? <Text>{locLabel}</Text> : null}
      <Text>{String(dateStr)}</Text>
      <Text>{String(timeAgoStr)}</Text>
    </View>
  );
});

// Map preview mock
jest.mock("../../components/LeafletMapWebView", () => {
  const { View } = require("react-native");
  return ({ height = 170 }) => (
    <View testID="leaflet" style={{ height, width: "100%" }} />
  );
});

/* ---------------- Data: getGuideById ------------------------------------- */
let mockGetGuideById = jest.fn((id) => ({
  id,
  sections: [
    {
      id: "prepareBefore",
      items: [
        { id: "a1", text: "Tip 1", img: { uri: "x1" } },
        { id: "a2", text: "Tip 2", img: { uri: "x2" } },
        { id: "a3", text: "Tip 3", img: { uri: "x3" } },
        { id: "a4", text: "Tip 4", img: { uri: "x4" } },
        { id: "a5", text: "Tip 5", img: { uri: "x5" } },
      ],
    },
  ],
}));

jest.mock("../../data/preparednessGuides", () => ({
  __esModule: true,
  getGuideById: (...a) => mockGetGuideById(...a),
}));

/* ---------------- i18n (supports 2-arg & 3-arg + interpolation) ---------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => {
    const interpolate = (template, vars) =>
      String(template ?? "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
        vars && Object.prototype.hasOwnProperty.call(vars, k)
          ? String(vars[k])
          : `{{${k}}}`
      );

    const t = (key, a, b) => {
      // Normalize args to { ns, defaultValue, ...vars }
      let opts = {};
      let defaultValue;
      if (typeof a === "string") {
        defaultValue = a;
        opts = b || {};
      } else if (typeof a === "object" && a !== null) {
        opts = a;
        defaultValue = a.defaultValue;
      }
      const ns = opts.ns || "common";

      if (ns === "common") {
        if (key === "common.back") return "Back";
        if (key === "hazardDetail.description") return "Description";
        if (key === "hazardDetail.affected_area") return "Affected Area";
        if (key === "hazardDetail.view_on_map") return "View on Map";
        if (key === "hazardDetail.open_map") return "Open map";
        if (key === "hazardDetail.safety_tips") return "Safety Tips";
        if (key === "common.see_more") return "See More";
        if (key === "settings.country_sg") return "Singapore";
        // Titles used by titleFor(..)
        if (key === "early.cards.flood.title") return "Flash Flood";
        if (key === "early.cards.haze.title") return "Haze (PM2.5)";
        if (key === "early.cards.dengue.title") return "Dengue Clusters";
        if (key === "early.cards.wind.title") return "Strong Winds";
        if (key === "early.cards.heat.title") return "Heat Advisory";
        if (key === "home.hazard.alert") return "Hazard Alert";
        if (key === "home.hazard.slogan") return "Stay Alert, Stay Safe";
        // Any other common key -> use defaultValue with interpolation
        return interpolate(defaultValue || key, opts);
      }

      if (ns === "preparedness") {
        // The screen passes item.text as defaultValue; just return it (with interpolation if ever used)
        return interpolate(defaultValue || key, opts);
      }

      return interpolate(defaultValue || key, opts);
    };

    return { t, i18n: { language: "en", changeLanguage: jest.fn() } };
  },
}));


/* ---------------- SUT ----------------------------------------------------- */
const HazardDetailScreen =
  require("../../screens/HazardDetailScreen").default;

/* ---------------- Helpers ------------------------------------------------- */
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

const renderWithHazard = async (hazard) => {
  const r = render(
    <HazardDetailScreen
      navigation={{ goBack: mockGoBack, navigate: mockNavigate }}
      route={{ params: { hazard } }}
    />
  );
  await flush();
  return r;
};

/* ---------------- Tests --------------------------------------------------- */
describe("HazardDetailScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders title, banner, long description (haze:danger), and back works", async () => {
    const hazard = {
      kind: "haze",
      severity: "danger",
      metrics: { region: "North" },
    };
    const screen = await renderWithHazard(hazard);

    // Title from titleFor()
    screen.getByText("Haze (PM2.5)");

    // Banner present
    screen.getByTestId("hazard-banner");

    // Long description uses interpolation
    screen.getByText(/Unhealthy PM2\.5 in the North/i);

    // Back button
    const back = screen.getByLabelText("Back");
    fireEvent.press(back);
    expect(mockGoBack).toHaveBeenCalled();
  });

  test("map CTA opens MapView with overlay mapped by hazard (haze -> 'pm')", async () => {
    const screen = await renderWithHazard({
      kind: "haze",
      severity: "warning",
      metrics: { region: "East" },
    });

    // CTA has a11y label "Open map"
    const openMap = screen.getByLabelText("Open map");
    fireEvent.press(openMap);

    expect(mockNavigate).toHaveBeenCalledWith("MapView", { overlay: "pm" });
  });

  test("Safety Tips grid shows first 4 items and 'See More' opens the Preparedness Guide (heat -> 'heatstroke')", async () => {
    const screen = await renderWithHazard({
      kind: "heat",
      severity: "warning",
      metrics: { hi: 41.2, region: "Central" },
    });

    screen.getByText("Safety Tips");

    // First 4 only
    screen.getByText("Tip 1");
    screen.getByText("Tip 2");
    screen.getByText("Tip 3");
    screen.getByText("Tip 4");
    expect(screen.queryByText("Tip 5")).toBeNull();

    // See More -> PreparednessGuide with mapped id 'heatstroke'
    const seeMore = screen.getByLabelText("See More");
    fireEvent.press(seeMore);
    expect(mockNavigate).toHaveBeenCalledWith("PreparednessGuide", {
      id: "heatstroke",
    });

    // Also ensure we looked up a guide (any id is fine — mapped id is asserted above)
    expect(mockGetGuideById).toHaveBeenCalled();
  });

  test("dengue (warning) description formats km to 1 decimal and includes place", async () => {
    const screen = await renderWithHazard({
      kind: "dengue",
      severity: "warning",
      locationName: "Clementi",
      metrics: { km: 1.234 },
    });

    screen.getByText(/Active cluster near Clementi \(~1\.2 km\)\./i);
  });

  test("flood (danger) description uses danger copy and MapView overlay 'rain'", async () => {
    const screen = await renderWithHazard({
      kind: "flood",
      severity: "danger",
      locationName: "Pasir Ris",
    });

    screen.getByText(/Flash flooding around Pasir Ris/i);

    const openMap = screen.getByLabelText("Open map");
    fireEvent.press(openMap);
    expect(mockNavigate).toHaveBeenCalledWith("MapView", { overlay: "rain" });
  });
});
