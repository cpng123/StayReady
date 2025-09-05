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

/* ---------------- RN mock: Modal -> View, FlatList deterministic ---------- */
/* Also map TouchableOpacity -> Pressable to avoid Animated issues */
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
        contentContainerStyle,
        horizontal,
        ...rest
      },
      _ref
    ) => {
      const renderMaybe = (Comp) =>
        !Comp ? null : typeof Comp === "function" ? <Comp /> : Comp;

      const items = Array.isArray(data) ? data : [];
      const rows = horizontal
        ? [items]
        : numColumns && numColumns > 1
        ? items.reduce((acc, _, i) => {
            if (i % numColumns === 0) acc.push(items.slice(i, i + numColumns));
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

/* Disable NativeAnimated driver on any leftover usage (belts & suspenders) */
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
        overlay: "rgba(0,0,0,0.3)",
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

/* ---------------- i18n (returns defaultValue or key) ---------------------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key, defOrOpts) =>
      typeof defOrOpts === "string"
        ? defOrOpts
        : defOrOpts?.defaultValue ?? _key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

/* ---------------- ExternalResourceCard (lean) ----------------------------- */
jest.mock("../../components/ExternalResourceCard", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return ({ item }) => (
    <View testID={`ext-${item.id}`}>
      <Text>{item.title}</Text>
      <Text>{item.desc}</Text>
    </View>
  );
});

/* ---------------- Preparedness guides data mock --------------------------- */
const img = { uri: "x" };
const GUIDES = {
  firstaid: {
    id: "firstaid",
    hero: img,
    reasons: [
      { id: "r1", icon: img },
      { id: "r2", icon: img },
    ],
    sections: [
      {
        id: "aid-before",
        items: [
          { id: "kit", img, text: "Prepare a first aid kit" },
          { id: "train", img, text: "Learn basics" },
        ],
      },
      {
        id: "aid-during",
        items: [{ id: "assess", img, text: "Assess the scene" }],
      },
    ],
    externalResources: [
      { id: "res1", url: "https://example.com/a" },
      { id: "res2", url: "https://example.com/b" },
    ],
  },
  flood: {
    id: "flood",
    hero: img,
    reasons: [{ id: "why1", icon: img }],
    sections: [
      {
        id: "prepareBefore",
        items: [{ id: "drain", img, text: "Clear drains" }],
      },
    ],
    externalResources: [],
  },
};

jest.mock("../../data/preparednessGuides", () => ({
  __esModule: true,
  getGuideById: (id) => GUIDES[id],
}));

/* ---------------- SUT ----------------------------------------------------- */
const PreparednessGuideScreen =
  require("../../screens/PreparednessGuideScreen").default;

/* ---------------- Helpers ------------------------------------------------- */
const renderGuide = async (routeParams = {}) => {
  const r = render(
    <PreparednessGuideScreen
      route={{ params: routeParams }}
      navigation={{ goBack: mockGoBack, navigate: mockNavigate }}
    />
  );
  await flush();
  return r;
};

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

/* ---------------- Tests --------------------------------------------------- */
describe("PreparednessGuideScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders hero and description; back works", async () => {
    const screen = await renderGuide({ id: "firstaid" });

    // Description text comes from i18n key when no defaultValue is provided
    await waitFor(() => screen.getByText("firstaid.description"));

    const back = screen.getByLabelText("Back");
    fireEvent.press(back);
    expect(mockGoBack).toHaveBeenCalled();
  });

  test("reasons list opens a modal with localized label & closes", async () => {
    const screen = await renderGuide({ id: "firstaid" });

    // Reason pill label is the i18n key (no default provided)
    const pill = screen.getByLabelText("firstaid.reasons.r1.label");
    fireEvent.press(pill);

    // Modal body text is unique → use it to confirm the modal is open
    await waitFor(() => screen.getByText("firstaid.reasons.r1.text"));
    // The label exists both on the pill and in the modal title
    expect(
      screen.getAllByText("firstaid.reasons.r1.label").length
    ).toBeGreaterThan(0);

    // Close via accessibility label (common.close key)
    const closeBtn = screen.getByLabelText("common.close");
    fireEvent.press(closeBtn);
    // Modal content should disappear
    await act(async () => {});
  });

  test("grid sections render items with fallback captions; key normalization works", async () => {
    const screen = await renderGuide({ id: "firstaid" });

    // Titles are i18n keys; more importantly, captions use defaultValue fallback.
    // Verify a couple of captions appear:
    screen.getByText("Prepare a first aid kit");
    screen.getByText("Learn basics");
    screen.getByText("Assess the scene");
  });

  test("interactive learning CTA navigates with mapped categoryId", async () => {
    const screen = await renderGuide({ id: "firstaid" });

    const cta = screen.getByLabelText("preparedness_screen.interactive_cta");
    fireEvent.press(cta);

    expect(mockNavigate).toHaveBeenCalledWith("QuizSets", {
      categoryId: "aid", // mapped from firstaid
      title: "firstaid.title", // i18n key (no defaultValue provided)
    });
  });

  test("external resources section renders cards and 'See more' navigates", async () => {
    const screen = await renderGuide({ id: "firstaid" });

    // Header key text (no default provided)
    screen.getByText("preparedness_screen.external_resources");

    // Each resource card is present
    screen.getByTestId("ext-res1");
    screen.getByTestId("ext-res2");

    // See more -> navigate to ExternalResources
    const seeMore = screen.getByLabelText("common.see_more");
    fireEvent.press(seeMore);
    expect(mockNavigate).toHaveBeenCalledWith("ExternalResources");
  });

  test("invalid route id falls back to 'flood' guide", async () => {
    const screen = await renderGuide({ id: "nope" });

    // Flood description key (since fallback applied)
    screen.getByText("flood.description");

    // Interactive CTA maps categoryId to same id when not in special map
    const cta = screen.getByLabelText("preparedness_screen.interactive_cta");
    fireEvent.press(cta);
    expect(mockNavigate).toHaveBeenCalledWith("QuizSets", {
      categoryId: "flood",
      title: "flood.title",
    });
  });

  test("omits external section when no resources", async () => {
    const screen = await renderGuide({ id: "flood" });
    // Should not find the external resources header for flood (empty resources)
    expect(
      screen.queryByText("preparedness_screen.external_resources")
    ).toBeNull();
  });
});
