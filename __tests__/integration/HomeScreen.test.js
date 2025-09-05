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

/* ---------------- Navigation (manual mock, immediate focus) --------------- */
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => {
  const { act } = require("@testing-library/react-native");
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: jest.fn((cb) => {
      let cleanup;
      act(() => {
        cleanup = cb?.();
      });
      return typeof cleanup === "function" ? cleanup : undefined;
    }),
  };
});

/* ---------------- LinearGradient mock ------------------------------------ */
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }) => children ?? null,
}));

/* ---------------- Child component mocks ---------------------------------- */
jest.mock("../../components/WarningCard", () => {
  const { Pressable, Text } = require("react-native");
  return ({ item, onPress }) => (
    <Pressable
      testID={`ewcard-${item.id}`}
      accessibilityLabel={`ewcard-${item.id}`}
      onPress={onPress}
    >
      <Text>{item.title || item.id}</Text>
    </Pressable>
  );
});

jest.mock("../../components/ImageOverlayCard", () => {
  const { Pressable, Text } = require("react-native");
  return ({ title, onPress, testID }) => (
    <Pressable
      testID={testID || `image-card-${title}`}
      accessibilityLabel={title}
      onPress={onPress}
    >
      <Text>{title}</Text>
    </Pressable>
  );
});

jest.mock("../../components/HazardBanner", () => {
  const { View, Text } = require("react-native");
  return ({ hazard }) => (
    <View testID="hazard-banner">
      <Text>{hazard?.kind}</Text>
    </View>
  );
});

jest.mock("../../components/ConfirmModal", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ visible, title, message, onConfirm, onCancel }) =>
    !visible ? null : (
      <View testID="confirm-modal">
        <Text>{title}</Text>
        <Text>{message}</Text>
        <Pressable onPress={onCancel} testID="confirm-cancel">
          <Text>Cancel</Text>
        </Pressable>
        <Pressable onPress={onConfirm} testID="confirm-proceed">
          <Text>Proceed</Text>
        </Pressable>
      </View>
    );
});

jest.mock("../../components/LeafletMapWebView", () => {
  const { View } = require("react-native");
  return () => <View testID="leaflet" />;
});

/* ---------------- i18n (supports interpolation & 2/3 arg signatures) ----- */
jest.mock("react-i18next", () => ({
  useTranslation: () => {
    const interpolate = (template, vars) =>
      String(template ?? "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
        vars && Object.prototype.hasOwnProperty.call(vars, k)
          ? String(vars[k])
          : `{{${k}}}`
      );

    const t = (key, a, b) => {
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

      // return defaults for our test usage
      if (ns === "common") {
        if (key === "common.error") return "Error";
      }
      // For everything else, use provided defaultValue or return key
      return interpolate(defaultValue || key, opts);
    };

    return { t, i18n: { language: "en", changeLanguage: jest.fn() } };
  },
}));

/* ---------------- Utils / hooks / data mocks ----------------------------- */
let mockResolveLocationLabel = jest.fn(async () => ({
  address: "123 Test St",
  postal: "123456",
  region: "East",
  coords: { latitude: 1.33, longitude: 103.8 },
}));
jest.mock("../../utils/locationService", () => ({
  __esModule: true,
  resolveLocationLabel: (...a) => mockResolveLocationLabel(...a),
}));

let mockGetUnreadCount = jest.fn(async () => 5);
jest.mock("../../utils/notify", () => ({
  __esModule: true,
  getUnreadCount: (...a) => mockGetUnreadCount(...a),
}));

let mockRefreshHaz = jest.fn(async () => {});
let mockUseHazards = jest.fn(() => ({
  loading: false,
  topHazard: { kind: "haze", severity: "warning", locationName: "Bedok" },
  cards: [
    {
      id: "ew1",
      title: "EW One",
      hazard: { kind: "haze", severity: "warning" },
    },
    {
      id: "ew2",
      title: "EW Two",
      hazard: { kind: "flood", severity: "danger" },
    },
  ],
  refresh: mockRefreshHaz,
}));
jest.mock("../../hooks/useHazards", () => ({
  __esModule: true,
  default: (...a) => mockUseHazards(...a),
}));

jest.mock("../../hooks/useNotifyOnHazard", () => ({
  __esModule: true,
  default: () => null,
}));

const { Linking } = require("react-native");
const { Alert } = require("react-native");

jest.mock("../../data/homeData", () => {
  const img = { uri: "x" };
  return {
    __esModule: true,
    CONTACTS: [
      { id: "sos", title: "SOS", subtitle: "Quick alerts", img },
      {
        id: "police",
        title: "Police",
        subtitle: "Call Police",
        img,
        number: "999",
      },
    ],
    getHomePreparedness: () => [
      { id: "flood", title: "Flood", img },
      { id: "haze", title: "Haze", img },
      { id: "fire", title: "Fire", img },
      { id: "kit", title: "Go-Bag", img },
    ],
    ROUTINE: [
      { id: "routine-external", title: "External resources", img },
      { id: "routine-quiz", title: "Daily quiz", img },
      { id: "routine-checklist", title: "Checklists", img },
    ],
  };
});

/* ---------------- SUT ----------------------------------------------------- */
const HomeScreen = require("../../screens/HomeScreen").default;

/* ---------------- Helpers ------------------------------------------------- */
const renderHome = async () => {
  const r = render(<HomeScreen />);
  await waitFor(() => r.getByText("Donate")); // donation CTA as mount signal
  await flush();
  return r;
};

/* ---------------- Tests --------------------------------------------------- */
describe("HomeScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { Linking, Alert } = require("react-native");
    Linking.openURL.mockClear();
    Linking.canOpenURL.mockClear();
    Alert.alert.mockClear();
    mockResolveLocationLabel = jest.fn(async () => ({
      address: "123 Test St",
      postal: "123456",
      region: "East",
      coords: { latitude: 1.33, longitude: 103.8 },
    }));
    mockGetUnreadCount = jest.fn(async () => 5);
    mockUseHazards = jest.fn(() => ({
      loading: false,
      topHazard: { kind: "haze", severity: "warning", locationName: "Bedok" },
      cards: [
        {
          id: "ew1",
          title: "EW One",
          hazard: { kind: "haze", severity: "warning", locationName: "Bedok" },
        },
        {
          id: "ew2",
          title: "EW Two",
          hazard: {
            kind: "flood",
            severity: "danger",
            locationName: "Pasir Ris",
          },
        },
      ],
      refresh: mockRefreshHaz,
    }));
  });

  test("renders header with resolved address, shows unread badge, and top buttons navigate", async () => {
    const screen = await renderHome();

    // Location section
    screen.getByText("Your location");
    await waitFor(() => screen.getByText("123 Test St 123456, Singapore"));

    // Unread badge '5'
    const bell = screen.getByTestId("notifications-button");
    expect(bell).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();

    fireEvent.press(bell);
    expect(mockNavigate).toHaveBeenCalledWith("Notifications");

    const settings = screen.getByTestId("settings-button");
    fireEvent.press(settings);
    expect(mockNavigate).toHaveBeenCalledWith("LocationSettings");
  });

  test("donate: opens external link when supported", async () => {
    Linking.canOpenURL.mockResolvedValueOnce(true);
    Linking.openURL.mockResolvedValueOnce();

    const screen = await renderHome();
    fireEvent.press(screen.getByText("Donate"));
    await flush();

    expect(Linking.canOpenURL).toHaveBeenCalled();
    expect(Linking.openURL).toHaveBeenCalled();
  });

  test("donate: alerts when url unsupported, and when open fails", async () => {
    // Unsupported
    Linking.canOpenURL.mockResolvedValueOnce(false);
    const screen = await renderHome();
    fireEvent.press(screen.getByText("Donate"));
    await flush();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Please try again later."
    );

    // Supported but open throws
    Linking.canOpenURL.mockResolvedValueOnce(true);
    Linking.openURL.mockRejectedValueOnce(new Error("nope"));
    fireEvent.press(screen.getByText("Donate"));
    await flush();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Could not open the link."
    );
  });

  test("map preview: pressing opens MapView; hazard banner shows topHazard kind", async () => {
    const screen = await renderHome();

    // Hazard banner shows top hazard kind (from hook)
    screen.getByTestId("hazard-banner");
    screen.getByText("haze");

    // Press map card (wrap has accessibility label 'View on Map')
    const mapCard = screen.getByLabelText("View on Map");
    fireEvent.press(mapCard);
    expect(mockNavigate).toHaveBeenCalledWith("MapView");
  });

  test("early warning list: pressing a card opens HazardDetail with hazard", async () => {
    const screen = await renderHome();

    fireEvent.press(screen.getByTestId("ewcard-ew2"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "HazardDetail",
      expect.objectContaining({
        hazard: expect.objectContaining({ kind: "flood" }),
      })
    );
  });

  test("preparedness cards navigate to PreparednessGuide", async () => {
    const screen = await renderHome();

    // Use accessibility label equals title
    fireEvent.press(screen.getByLabelText("Flood"));
    expect(mockNavigate).toHaveBeenCalledWith("PreparednessGuide", {
      id: "flood",
    });
  });

  test("routine cards navigate to ExternalResources, GamesTab, Checklist", async () => {
    const screen = await renderHome();

    fireEvent.press(screen.getByTestId("routine-card-routine-external"));
    expect(mockNavigate).toHaveBeenCalledWith("ExternalResources");

    fireEvent.press(screen.getByTestId("routine-card-routine-quiz"));
    expect(mockNavigate).toHaveBeenCalledWith("GamesTab");

    fireEvent.press(screen.getByTestId("routine-card-routine-checklist"));
    expect(mockNavigate).toHaveBeenCalledWith("Checklist");
  });

  test("emergency contacts: SOS opens SOSTab; Police shows confirm and dials via Linking", async () => {
    Linking.canOpenURL.mockResolvedValueOnce(true);
    Linking.openURL.mockResolvedValueOnce();

    const screen = await renderHome();

    // SOS
    fireEvent.press(screen.getByLabelText("SOS"));
    expect(mockNavigate).toHaveBeenCalledWith("SOSTab");

    // Police -> confirm modal appears -> proceed
    fireEvent.press(screen.getByLabelText("Police"));
    await waitFor(() => screen.getByTestId("confirm-modal"));
    fireEvent.press(screen.getByTestId("confirm-proceed"));
    await flush();

    expect(Linking.canOpenURL).toHaveBeenCalledWith("tel:999");
    expect(Linking.openURL).toHaveBeenCalledWith("tel:999");
  });

  test("emergency contacts: dialing fallback shows manual dial alert when tel: not supported", async () => {
    Linking.canOpenURL.mockResolvedValueOnce(false);
    const screen = await renderHome();

    fireEvent.press(screen.getByLabelText("Police"));
    await waitFor(() => screen.getByTestId("confirm-modal"));
    fireEvent.press(screen.getByTestId("confirm-proceed"));
    await flush();

    expect(Alert.alert).toHaveBeenCalledWith(
      "Not supported",
      "Please dial 999 manually."
    );
  });

  test("unread badge caps at 99+", async () => {
    mockGetUnreadCount = jest.fn(async () => 150); // override before render
    const screen = await renderHome();

    // Badge text '99+'
    await waitFor(() => screen.getByText("99+"));
  });

  test("header location falls back to 'Singapore' when resolver fails", async () => {
    mockResolveLocationLabel = jest.fn(async () => {
      throw new Error("no location");
    });
    const screen = await renderHome();

    await waitFor(() => screen.getByText("Singapore"));
  });

  test("chatbot FAB opens Chatbot", async () => {
    const screen = await renderHome();

    // It's the only Pressable with 'Open Chatbot' label
    const fab = screen.getByLabelText("Open Chatbot");
    fireEvent.press(fab);

    expect(mockNavigate).toHaveBeenCalledWith("Chatbot");
  });
});
