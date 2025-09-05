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

  const TouchableOpacity = ({ children, onPress, ...props }) => (
    <RN.Pressable onPress={onPress} {...props}>
      {children}
    </RN.Pressable>
  );
  TouchableOpacity.displayName = "TouchableOpacity";

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

  return { ...RN, Modal, FlatList, TouchableOpacity };
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

/* ---------------- Theme ----------------------------------- */
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

/* ---------------- Icons ----------------------------------- */
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    Ionicons: (props) => React.createElement("Icon", props),
    MaterialCommunityIcons: (props) => React.createElement("Icon", props),
  };
});

/* ---------------- Navigation (immediate focus) --------------- */
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => {
  const { act } = require("@testing-library/react-native");
  return {
    useFocusEffect: jest.fn((cb) => {
      let cleanup;
      act(() => {
        cleanup = cb?.();
      });
      return typeof cleanup === "function" ? cleanup : undefined;
    }),
  };
});

/* ---------------- i18n ------------------------------------ */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, defOrOpts) =>
      typeof defOrOpts === "string"
        ? defOrOpts
        : defOrOpts?.defaultValue ?? _key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

/* ---------------- Location resolver ------------------------ */
let mockResolveLocationLabel = jest.fn(async () => ({
  coords: { latitude: 1.3311, longitude: 103.8122 },
}));
jest.mock("../../utils/locationService", () => ({
  __esModule: true,
  resolveLocationLabel: (...a) => mockResolveLocationLabel(...a),
}));

/* ---------------- API datasets ----------------------------- */
const mkPts = (...arr) => ({ points: arr.map((x) => ({ id: x, v: x })) });

let mockGetRainfallLatest = jest.fn(async () => mkPts(1, 2));
let mockGetWindLatest = jest.fn(async () => mkPts(3));
let mockGetAirTemperatureLatest = jest.fn(async () => mkPts(4, 5));
let mockGetRelativeHumidityLatest = jest.fn(async () => mkPts(6));
let mockGetPM25Latest = jest.fn(async () => mkPts(7, 8, 9));
let mockGetDengueClustersGeoJSON = jest.fn(async () => ({
  type: "FeatureCollection",
  features: [],
}));
let mockGetClinicsGeoJSON = jest.fn(async () => ({
  type: "FeatureCollection",
  features: [],
}));

jest.mock("../../utils/api", () => ({
  __esModule: true,
  getRainfallLatest: (...a) => mockGetRainfallLatest(...a),
  getWindLatest: (...a) => mockGetWindLatest(...a),
  getAirTemperatureLatest: (...a) => mockGetAirTemperatureLatest(...a),
  getRelativeHumidityLatest: (...a) => mockGetRelativeHumidityLatest(...a),
  getPM25Latest: (...a) => mockGetPM25Latest(...a),
  getDengueClustersGeoJSON: (...a) => mockGetDengueClustersGeoJSON(...a),
  getClinicsGeoJSON: (...a) => mockGetClinicsGeoJSON(...a),
}));

/* ---------------- Hazard decision + mocks ------------------ */
let mockGetMockFlags = jest.fn(async () => ({}));
jest.mock("../../utils/mockFlags", () => ({
  __esModule: true,
  getMockFlags: (...a) => mockGetMockFlags(...a),
}));

let mockDecideGlobalHazard = jest.fn(() => ({
  kind: "haze",
  title: "Haze Warning",
  locationName: "Bedok",
}));
jest.mock("../../utils/hazard", () => ({
  __esModule: true,
  decideGlobalHazard: (...a) => mockDecideGlobalHazard(...a),
}));

/* ---------------- LeafletMapWebView bridge mock ------------ */
const mockLeafletBridge = {
  setRainfall: jest.fn(),
  setWind: jest.fn(),
  setTemp: jest.fn(),
  setHum: jest.fn(),
  setPM: jest.fn(),
  setDengue: jest.fn(),
  setClinics: jest.fn(),
  setOverlay: jest.fn(),
  recenter: jest.fn(),
};

jest.mock("../../components/LeafletMapWebView", () => {
  const React = require("react");
  const { forwardRef, useImperativeHandle } = React;
  const { View, Text } = require("react-native");

  const Leaflet = forwardRef(
    (
      {
        lat,
        lon,
        overlay,
        pins = [],
        rainfallPoints,
        windPoints,
        tempPoints,
        humPoints,
        pmPoints,
        dengueGeoJSON,
        clinicsGeoJSON,
      },
      ref
    ) => {
      // use the mock-prefixed variable here
      useImperativeHandle(ref, () => mockLeafletBridge, []);
      return (
        <View testID="leaflet">
          <Text testID="leaflet-lat">{String(lat)}</Text>
          <Text testID="leaflet-lon">{String(lon)}</Text>
          <Text testID="leaflet-overlay">{overlay}</Text>
          <Text testID="leaflet-pins">{String(pins?.length || 0)}</Text>
          <Text>{rainfallPoints ? "rp" : ""}</Text>
          <Text>{windPoints ? "wp" : ""}</Text>
          <Text>{tempPoints ? "tp" : ""}</Text>
          <Text>{humPoints ? "hp" : ""}</Text>
          <Text>{pmPoints ? "pp" : ""}</Text>
          <Text>{dengueGeoJSON ? "dg" : ""}</Text>
          <Text>{clinicsGeoJSON ? "cl" : ""}</Text>
        </View>
      );
    }
  );
  Leaflet.displayName = "LeafletMapWebView";
  return Leaflet;
});

/* ---------------- HazardBanner (lean mock) ----------------- */
jest.mock("../../components/HazardBanner", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ hazard }) => (
    <View testID="hazard-banner">
      <Text>{hazard?.kind}</Text>
      <Text>{hazard?.title}</Text>
    </View>
  );
});

try {
  // eslint-disable-next-line jest/no-jest-do-mock
  jest.doMock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({
    shouldUseNativeDriver: () => false,
  }));
} catch {
  try {
    // eslint-disable-next-line jest/no-jest-do-mock
    jest.doMock(
      "react-native/Libraries/Animated/src/NativeAnimatedHelper",
      () => ({
        shouldUseNativeDriver: () => false,
      })
    );
  } catch {}
}

/* ---------------- SUT ------------------------------------- */
const MapScreen = require("../../screens/MapScreen").default;

/* ---------------- Helpers --------------------------------- */
const renderMap = async (routeParams = {}) => {
  const r = render(
    <MapScreen
      route={{ params: routeParams }}
      navigation={{ goBack: mockGoBack }}
    />
  );
  await flush();
  return r;
};

/* ---------------- Tests ----------------------------------- */
describe("MapScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset bridge spies
    Object.keys(mockLeafletBridge).forEach((k) =>
      mockLeafletBridge[k].mockClear()
    ); // Default resolvers/decider
    mockResolveLocationLabel = jest.fn(async () => ({
      coords: { latitude: 1.3311, longitude: 103.8122 },
    }));
    mockDecideGlobalHazard = jest.fn(() => ({
      kind: "haze",
      title: "Haze Warning",
      locationName: "Bedok",
    }));
  });

  test("renders map, default overlay 'rain', shows hazard banner, back works", async () => {
    const screen = await renderMap();

    // Hazard banner comes from decideGlobalHazard()
    screen.getByTestId("hazard-banner");
    screen.getByText("haze");
    screen.getByText("Haze Warning");

    // Default overlay is 'rain'
    expect(screen.getByTestId("leaflet-overlay").props.children).toBe("rain");

    // Back button
    const back = screen.getByLabelText("Back");
    fireEvent.press(back);
    expect(mockGoBack).toHaveBeenCalled();
  });

  test("pressing metric pills switches overlay and calls webview.setOverlay", async () => {
    const screen = await renderMap();

    fireEvent.press(screen.getByTestId("metric-wind"));
    expect(mockLeafletBridge.setOverlay).toHaveBeenCalledWith("wind");

    // Overlay prop should reflect change after re-render
    await waitFor(() =>
      expect(screen.getByTestId("leaflet-overlay").props.children).toBe("wind")
    );
  });

  test("route param 'overlay' preselects layer; 'pin' passes to webview", async () => {
    const screen = await renderMap({
      overlay: "pm",
      pin: { lat: 1.3, lon: 103.8, id: "only" },
    });

    expect(screen.getByTestId("leaflet-overlay").props.children).toBe("pm");
    expect(screen.getByTestId("leaflet-pins").props.children).toBe("1");
  });

  test("on mount: fetches datasets and pushes to webview via bridge setters", async () => {
    await renderMap();

    expect(mockGetRainfallLatest).toHaveBeenCalled();
    expect(mockGetWindLatest).toHaveBeenCalled();
    expect(mockGetAirTemperatureLatest).toHaveBeenCalled();
    expect(mockGetRelativeHumidityLatest).toHaveBeenCalled();
    expect(mockGetPM25Latest).toHaveBeenCalled();
    expect(mockGetDengueClustersGeoJSON).toHaveBeenCalled();
    expect(mockGetClinicsGeoJSON).toHaveBeenCalled();

    expect(mockLeafletBridge.setRainfall).toHaveBeenCalledWith(
      expect.arrayContaining([
        { id: 1, v: 1 },
        { id: 2, v: 2 },
      ])
    );
    expect(mockLeafletBridge.setWind).toHaveBeenCalledWith(
      expect.arrayContaining([{ id: 3, v: 3 }])
    );
    expect(mockLeafletBridge.setTemp).toHaveBeenCalledWith(
      expect.arrayContaining([
        { id: 4, v: 4 },
        { id: 5, v: 5 },
      ])
    );
    expect(mockLeafletBridge.setHum).toHaveBeenCalledWith(
      expect.arrayContaining([{ id: 6, v: 6 }])
    );
    expect(mockLeafletBridge.setPM).toHaveBeenCalledWith(
      expect.arrayContaining([
        { id: 7, v: 7 },
        { id: 8, v: 8 },
        { id: 9, v: 9 },
      ])
    );
    expect(mockLeafletBridge.setDengue).toHaveBeenCalledWith(
      expect.objectContaining({ type: "FeatureCollection" })
    );
    expect(mockLeafletBridge.setClinics).toHaveBeenCalledWith(
      expect.objectContaining({ type: "FeatureCollection" })
    );
  });

  test("recenter button resolves location and calls webview.recenter", async () => {
    mockResolveLocationLabel = jest.fn(async () => ({
      coords: { latitude: 1.4001, longitude: 103.9002 },
    }));

    const screen = await renderMap();

    fireEvent.press(screen.getByTestId("map-recenter"));
    await flush();

    expect(mockResolveLocationLabel).toHaveBeenCalled();
    expect(mockLeafletBridge.recenter).toHaveBeenCalledWith(
      1.4001,
      103.9002,
      13
    );

    // Props lat/lon also update after setCenter
    await waitFor(() => {
      expect(screen.getByTestId("leaflet-lat").props.children).toBe("1.4001");
      expect(screen.getByTestId("leaflet-lon").props.children).toBe("103.9002");
    });
  });

  test("focus effects run and hazard decision is evaluated", async () => {
    await renderMap();
    // Called at least once during mount/effects
    expect(mockDecideGlobalHazard).toHaveBeenCalled();
  });
});
