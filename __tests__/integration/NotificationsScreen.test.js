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

/* ---------------- RN mock: Modal, FlatList, TouchableOpacity shim -------- */
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  const React = require("react");

  const Modal = ({ children, ...props }) => (
    <RN.View {...props}>{children}</RN.View>
  );
  Modal.displayName = "Modal";

  // Kill Animated opacity by mapping TouchableOpacity -> Pressable
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
        contentContainerStyle,
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
        <RN.View {...rest} testID="flatlist-mock" style={contentContainerStyle}>
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
  return {
    Ionicons: (props) => React.createElement("Icon", props),
  };
});

/* ---------------- Navigation focus (immediate) ---------------------------- */
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    // Run exactly once per mount, like a focused mount.
    useFocusEffect: (cb) => {
      React.useEffect(() => {
        const cleanup = cb?.();
        return typeof cleanup === "function" ? cleanup : undefined;
      }, []);
    },
  };
});

/* ---------------- i18n (identity defaults) -------------------------------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, defOrOpts) =>
      typeof defOrOpts === "string"
        ? defOrOpts
        : defOrOpts?.defaultValue ?? _key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

/* ---------------- notify utils ------------------------------------------- */
let mockGetNotificationLog = jest.fn(async () => []);
let mockMarkAllNotificationsRead = jest.fn(async () => {});
let mockMarkNotificationRead = jest.fn(async () => {});

jest.mock("../../utils/notify", () => ({
  __esModule: true,
  getNotificationLog: (...a) => mockGetNotificationLog(...a),
  markAllNotificationsRead: (...a) => mockMarkAllNotificationsRead(...a),
  markNotificationRead: (...a) => mockMarkNotificationRead(...a),
}));

/* ---------------- SUT ----------------------------------------------------- */
const NotificationsScreen =
  require("../../screens/NotificationsScreen").default;

/* ---------------- Helpers ------------------------------------------------- */
const renderNotif = async () => {
  const r = render(
    <NotificationsScreen
      navigation={{ goBack: mockGoBack, navigate: mockNavigate }}
    />
  );
  await flush();
  return r;
};

/* ---------------- Tests --------------------------------------------------- */
describe("NotificationsScreen (integration)", () => {
  const NOW = 1_700_000_000_000; // fixed 'now' for stable timeAgo
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("empty state: shows title and empty message; back works", async () => {
    mockGetNotificationLog = jest.fn(async () => []);
    const screen = await renderNotif();

    // Focus triggers load -> empty component
    await waitFor(() => screen.getByText("Notifications"));
    await waitFor(() => screen.getByText("No notifications yet"));

    const back = screen.getByTestId("notif-back");
    fireEvent.press(back);
    expect(mockGoBack).toHaveBeenCalled();
  });

  test("focus load: marks all as read, renders rows with compact timeAgo", async () => {
    mockGetNotificationLog = jest.fn(async () => [
      {
        id: "a1",
        kind: "haze",
        title: "Haze in East",
        body: "PM2.5 rising",
        time: NOW - 5_000, // 5s ago
        read: false,
        hazard: {
          kind: "haze",
          severity: "warning",
          locationName: "Bedok",
        },
      },
      {
        id: "b2",
        kind: "flood",
        title: "Flash Flood",
        body: "",
        time: NOW - 3 * 60 * 60 * 1000, // 3h ago
        read: false,
        severity: "danger",
      },
    ]);

    const screen = await renderNotif();

    // Title (mount signal) and rows
    await waitFor(() => screen.getByText("Notifications"));
    await waitFor(() => screen.getByTestId("notif-a1"));
    screen.getByTestId("notif-b2");

    // timeAgo labels
    screen.getByText("5s");
    screen.getByText("3h");

    // markAll called once during load
    expect(mockMarkAllNotificationsRead).toHaveBeenCalledTimes(1);
  });

  test("opening an item with embedded hazard navigates to HazardDetail", async () => {
    mockGetNotificationLog = jest.fn(async () => [
      {
        id: "a1",
        kind: "haze",
        title: "Haze in East",
        body: "PM2.5 rising",
        time: NOW - 12_000,
        read: false,
        hazard: {
          kind: "haze",
          severity: "warning",
          locationName: "Bedok",
        },
      },
    ]);

    const screen = await renderNotif();
    await waitFor(() => screen.getByTestId("notif-a1"));

    fireEvent.press(screen.getByTestId("notif-a1"));
    // wait for async handler to complete
    await waitFor(() =>
      expect(mockMarkNotificationRead).toHaveBeenCalledWith("a1")
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("HazardDetail", {
        hazard: { kind: "haze", severity: "warning", locationName: "Bedok" },
      })
    );
  });

  test("opening an item without hazard builds hazard from kind/severity/title", async () => {
    mockGetNotificationLog = jest.fn(async () => [
      {
        id: "b2",
        kind: "flood",
        title: "Flash Flood",
        body: "",
        time: NOW - 30_000,
        read: false,
        severity: "danger",
      },
    ]);

    const screen = await renderNotif();
    await waitFor(() => screen.getByTestId("notif-b2"));

    fireEvent.press(screen.getByTestId("notif-b2"));
    await waitFor(() =>
      expect(mockMarkNotificationRead).toHaveBeenCalledWith("b2")
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        "HazardDetail",
        expect.objectContaining({
          hazard: expect.objectContaining({
            kind: "flood",
            severity: "danger",
            title: "Flash Flood",
          }),
        })
      )
    );
  });

  test("load failure: shows empty list gracefully", async () => {
    mockGetNotificationLog = jest.fn(async () => {
      throw new Error("boom");
    });

    const screen = await renderNotif();
    await waitFor(() => screen.getByText("No notifications yet"));
  });
});
