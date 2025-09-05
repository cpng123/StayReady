jest.useRealTimers();

/* ---------------- Native shims  ---------------------- */
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

/* ---------------- More RN infra shims ----------------------------------- */
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
  jest.doMock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({
    shouldUseNativeDriver: () => false,
  }));
} catch {
  try {
    // eslint-disable-next-line jest/no-jest-do-mock
    jest.doMock(
      "react-native/Libraries/Animated/src/NativeAnimatedHelper",
      () => ({ shouldUseNativeDriver: () => false })
    );
  } catch {}
}

/* ---------------- RN mock: Modal + FlatList ------------ */
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
        ...rest
      },
      _ref
    ) => {
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
const {
  render,
  fireEvent,
  act,
  cleanup,
  within,
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

/* ---------------- Navigation --------------------------------------------- */
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

/* ---------------- Data (preparedness guides) ------------------------------ */
jest.mock("../../data/preparednessGuides", () => ({
  PREPAREDNESS_GUIDES: {
    flood: {
      id: "flood",
      externalResources: [
        { id: "r1", url: "https://x", updated: "2025-05-10" }, // latest
        { id: "r2", url: "https://y", updated: "2024-01-05" },
      ],
    },
    haze: {
      id: "haze",
      externalResources: [{ id: "r3", url: "https://z", updated: "2025-04-20" }],
    },
    storm: {
      id: "storm",
      externalResources: [
        { id: "alpha", url: "https://a" }, // no updated
        { id: "beta", url: "https://b" },  // no updated
      ],
    },
  },
}));

/* ---------------- Child components --------------------------------------- */
jest.mock("../../components/ExternalResourceCard", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ item }) => (
    <Pressable testID="resource-card" accessibilityLabel={`card-${item.key}`}>
      <View>
        <Text>{item.title}</Text>
        {item.updated ? <Text>{item.updated}</Text> : null}
      </View>
    </Pressable>
  );
});

jest.mock("../../components/TopBar", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ title, onBack }) => (
    <View accessibilityRole="header">
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack}>
        <Text>Back</Text>
      </Pressable>
      <Text>{title}</Text>
    </View>
  );
});

jest.mock("../../components/SearchRow", () => {
  const { View, TextInput, Pressable, Text } = require("react-native");
  return ({ value, onChangeText, onSortToggle, placeholder, showSort }) => (
    <View>
      <TextInput
        testID="search-input"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
      {showSort ? (
        <Pressable testID="sort-btn" onPress={onSortToggle}>
          <Text>Sort</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

jest.mock("../../components/FilterChips", () => {
  const { View, Pressable, Text } = require("react-native");
  return ({ options = [], activeId, onChange }) => (
    <View>
      {options.map((opt) => (
        <Pressable
          key={opt.id}
          testID={`chip-${opt.id}`}
          accessibilityRole="button"
          onPress={() => onChange(opt.id)}
        >
          <Text>
            {opt.label}
            {activeId === opt.id ? "\n●" : ""}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

/* ---------------- i18n ---------------------------------------------------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, opts = {}) => {
      const ns = opts.ns || "common";
      if (ns === "common") {
        if (key === "preparedness_screen.external_resources") return "External Resources";
        if (key === "common.search" || key === "search") return "Search";
        if (key === "filters.all") return opts.defaultValue || "All";
        // topic chips
        if (key === "home.prep.topic.flood") return "Flood";
        if (key === "home.prep.topic.haze") return "Haze";
        if (key === "home.prep.topic.storm") return "Storm";
        if (key === "home.prep.topic.dengue") return "Dengue";
        if (key === "home.prep.topic.wind") return "Wind";
        if (key === "home.prep.topic.aid") return "Aid";
        if (key === "home.prep.topic.fire") return "Fire";
        if (key === "home.prep.topic.kit") return "Go-Bag";
        if (key === "home.prep.topic.disease") return "Disease";
        if (key === "home.prep.topic.earthquake") return "Earthquake";
        if (key === "home.prep.topic.heatstroke") return "Heatstroke";
        return opts.defaultValue || key;
      }
      // preparedness: "<guide>.externalResources.<id>.(title|desc)"
      const m = /^([^.]*)\.externalResources\.([^.]*)\.(title|desc)$/.exec(key);
      if (m) {
        const [, guide, rid, field] = m;
        return `${guide}:${rid} ${field}`;
      }
      return key;
    },
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

/* ---------------- SUT ----------------------------------------------------- */
const ExternalResourceScreen =
  require("../../screens/ExternalResourceScreen").default;

/* ---------------- Helpers ------------------------------------------------- */
const renderScreen = async () => {
  const r = render(<ExternalResourceScreen navigation={{ goBack: mockGoBack }} />);
  await flush();
  return r;
};

/* ---------------- Tests --------------------------------------------------- */
describe("ExternalResourceScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders header title and lists resources; default sort is latest 'updated' first", async () => {
    const screen = await renderScreen();

    screen.getByText("External Resources");

    const cards = screen.getAllByTestId("resource-card");
    expect(within(cards[0]).getByText("flood:r1 title")).toBeTruthy();
    within(cards[0]).getByText("2025-05-10");

    screen.getByText("haze:r3 title");
    screen.getByText("flood:r2 title");
  });

  test("filter chips: selecting 'Flood' shows only flood items", async () => {
    const screen = await renderScreen();

    fireEvent.press(screen.getByTestId("chip-flood"));
    await flush();

    const cards = screen.getAllByTestId("resource-card");
    expect(cards.length).toBe(2);
    within(cards[0]).getByText(/flood:/i);
    within(cards[1]).getByText(/flood:/i);
  });

  test("search filters by localized title/desc", async () => {
    const screen = await renderScreen();

    fireEvent.changeText(screen.getByTestId("search-input"), "r3");
    await flush();

    const cards = screen.getAllByTestId("resource-card");
    expect(cards.length).toBe(1);
    within(cards[0]).getByText("haze:r3 title");
  });

  test("sort toggle flips ordering by updated (asc/desc)", async () => {
    const screen = await renderScreen();

    let cards = screen.getAllByTestId("resource-card");
    within(cards[0]).getByText("flood:r1 title");

    fireEvent.press(screen.getByTestId("sort-btn"));
    await flush();

    cards = screen.getAllByTestId("resource-card");
    within(cards[0]).getByText("flood:r2 title");
    within(cards[0]).getByText("2024-01-05");
  });

  test("tie-breaker by title when dates equal/missing (storm group)", async () => {
    const screen = await renderScreen();

    fireEvent.press(screen.getByTestId("chip-storm"));
    await flush();

    let cards = screen.getAllByTestId("resource-card");
    within(cards[0]).getByText("storm:alpha title");
    within(cards[1]).getByText("storm:beta title");

    fireEvent.press(screen.getByTestId("sort-btn"));
    await flush();

    cards = screen.getAllByTestId("resource-card");
    within(cards[0]).getByText("storm:beta title");
    within(cards[1]).getByText("storm:alpha title");
  });

  test("back button calls navigation.goBack", async () => {
    const screen = await renderScreen();
    const back = screen.getByLabelText("Back");
    fireEvent.press(back);
    expect(mockGoBack).toHaveBeenCalled();
  });
});
