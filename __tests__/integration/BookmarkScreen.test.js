jest.useFakeTimers({ legacyFakeTimers: true });

/* ---------------- Native shims (match SettingsScreen test) ---------------- */
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
    () => ({})
  );
} catch {
  try {
    // eslint-disable-next-line jest/no-jest-do-mock
    jest.doMock(
      "react-native/Libraries/Animated/src/NativeAnimatedHelper",
      () => ({})
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

/* ---------------- React Native mock: inline Modal + sync FlatList ---------------- */
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  const React = require("react");

  const Modal = ({ children, ...props }) => (
    <RN.View {...props}>{children}</RN.View>
  );
  Modal.displayName = "Modal";

  const renderEmpty = (Comp) => {
    if (!Comp) return null;
    return typeof Comp === "function" ? <Comp /> : Comp;
  };

  const FlatList = React.forwardRef(
    (
      { data = [], renderItem, keyExtractor, ListEmptyComponent, ...rest },
      ref
    ) => (
      <RN.View {...rest} ref={ref} testID="flatlist-mock">
        {data && data.length
          ? data.map((item, index) => (
              <RN.View key={keyExtractor ? keyExtractor(item, index) : index}>
                {renderItem?.({ item, index })}
              </RN.View>
            ))
          : renderEmpty(ListEmptyComponent)}
      </RN.View>
    )
  );
  FlatList.displayName = "FlatList";

  return { ...RN, Modal, FlatList };
});

/* ---------------- RNTL after RN mocked ---------------- */
const {
  render,
  fireEvent,
  act,
  cleanup,
  waitFor,
} = require("@testing-library/react-native");

afterEach(() => {
  cleanup();
  jest.runOnlyPendingTimers();
  jest.clearAllTimers();
});

const flush = async () =>
  act(async () => {
    await Promise.resolve();
  });

/* ---------------- App-level mocks ---------------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k, fb) =>
      ({
        "bookmarks.title": "Bookmarked Questions",
        "bookmarks.chips.all": "All",
        "bookmarks.chips.flood": "Flood",
        "bookmarks.chips.haze": "Haze",
        "bookmarks.chips.storm": "Thunderstorm",
        "bookmarks.chips.dengue": "Dengue",
        "bookmarks.chips.wind": "Wind",
        "bookmarks.chips.aid": "First Aid",
        "bookmarks.chips.fire": "Fire",
        "bookmarks.chips.kit": "Emergency Kit",
        "bookmarks.chips.disease": "Disease",
        "bookmarks.chips.earthquake": "Earthquake",
        "bookmarks.empty.no_matches_title": "No matches here",
        "bookmarks.empty.no_matches_body":
          "Try a different category or clear your search.",
        "bookmarks.empty.none_title": "No bookmarked questions",
        "bookmarks.empty.none_body":
          "Tap the bookmark icon on any question to save it here.",
        "bookmarks.confirm.title": "Delete bookmark?",
        "bookmarks.confirm.message":
          "This question will be removed from your bookmarks.",
        "bookmarks.confirm.delete": "Delete",
        "bookmarks.confirm.cancel": "Cancel",
        "bookmarks.confirm.reset_title": "Clear All Bookmarks?",
        "bookmarks.confirm.reset_message":
          "This will remove ALL saved questions. This action cannot be undone.",
        "bookmarks.confirm.delete_all": "Clear All",
      }[k] ??
      fb ??
      k),
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

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return { Ionicons: (props) => React.createElement("Icon", props) };
});

jest.mock("../../components/TopBar", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");
  return ({ title, onBack, rightIcon, onRightPress }) => (
    <View accessibilityRole="header">
      <Text>{title}</Text>
      <Pressable onPress={onBack}>
        <Text>Back</Text>
      </Pressable>
      {rightIcon ? (
        <Pressable testID="topbar-right" onPress={onRightPress}>
          <Text>{rightIcon}</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

jest.mock("../../components/SearchRow", () => {
  const React = require("react");
  const { View, TextInput } = require("react-native");
  return ({ value, onChangeText }) => (
    <View>
      <TextInput
        testID="search-input"
        value={value}
        onChangeText={(t) => onChangeText?.(t)}
      />
    </View>
  );
});

jest.mock("../../components/FilterChips", () => {
  const { View, Pressable, Text } = require("react-native");
  return ({ options, activeId, onChange }) => (
    <View>
      {options.map((opt) => (
        <Pressable
          key={opt.id}
          testID={`chip-${opt.id}`}
          onPress={() => onChange?.(opt.id)}
        >
          <Text>
            {opt.label} {activeId === opt.id ? "●" : ""}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

jest.mock("../../components/ReviewQuestionCard", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ text, onActionPress, index, total, style, actionIcon = "del" }) => (
    <View
      style={style}
      accessibilityLabel={`card-${index + 1}-of-${total}`}
      testID={`card-${index}`}
    >
      <Text>{text}</Text>
      <Pressable testID={`delete-btn-${index}`} onPress={onActionPress}>
        <Text>{actionIcon}</Text>
      </Pressable>
    </View>
  );
});

jest.mock("../../components/ConfirmModal", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({
    visible,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  }) =>
    visible ? (
      <View testID="confirm-modal">
        <Text testID="confirm-title">{title}</Text>
        <Text testID="confirm-message">{message}</Text>
        <Pressable testID="confirm-ok" onPress={onConfirm}>
          <Text>{confirmLabel}</Text>
        </Pressable>
        <Pressable testID="confirm-cancel" onPress={onCancel}>
          <Text>{cancelLabel}</Text>
        </Pressable>
      </View>
    ) : null;
});

/* ---------------- SAFELY mock ../../utils/bookmarks (no out-of-scope vars) ---------------- */
jest.mock("../../utils/bookmarks", () => {
  let store = [];
  let subscriber = null;

  const getAllBookmarks = jest.fn(async () => store.slice());
  const removeBookmark = jest.fn(async (id) => {
    store = store.filter((x) => String(x.id) !== String(id));
    subscriber && subscriber();
  });
  const subscribeBookmarks = jest.fn((cb) => {
    subscriber = cb;
    return () => {
      if (subscriber === cb) subscriber = null;
    };
  });
  const clearAllBookmarks = jest.fn(async () => {
    store = [];
    subscriber && subscriber();
  });

  // test helpers
  const __setStore = (items) => {
    store = items.slice();
  };
  const __getStore = () => store.slice();
  const __reset = () => {
    store = [];
    subscriber = null;
    getAllBookmarks.mockClear();
    removeBookmark.mockClear();
    subscribeBookmarks.mockClear();
    clearAllBookmarks.mockClear();
  };

  return {
    __esModule: true,
    getAllBookmarks,
    removeBookmark,
    subscribeBookmarks,
    clearAllBookmarks,
    __setStore,
    __getStore,
    __reset,
  };
});

const BookmarksAPI = require("../../utils/bookmarks");

/* ---------------- SUT ---------------- */
const BookmarkScreen = require("../../screens/BookmarkScreen").default;

/* ---------------- Tests ---------------- */
describe("BookmarkScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    BookmarksAPI.__reset();
    BookmarksAPI.__setStore([
      {
        id: 1,
        text: "First Aid: control bleeding",
        setTitle: "First Aid",
        categoryId: "aid",
        options: ["A", "B"],
        answerIndex: 0,
        selectedIndex: null,
        timesUp: false,
      },
      {
        id: 2,
        text: "Flood safety: move to higher ground",
        setTitle: "Flood",
        categoryId: "flood",
        options: ["C", "D"],
        answerIndex: 1,
        selectedIndex: null,
        timesUp: false,
      },
      {
        id: 3,
        text: "Fire: use extinguisher",
        setTitle: "Fire",
        categoryId: "fire",
        options: ["E", "F"],
        answerIndex: 0,
        selectedIndex: null,
        timesUp: false,
      },
    ]);
  });

  const renderScreen = async () => {
    const screen = render(<BookmarkScreen />);
    await flush();
    await waitFor(() => screen.getByText("Bookmarked Questions"));
    return screen;
  };

  test("loads and shows bookmarks; filters by chip and by search", async () => {
    const screen = await renderScreen();

    // initial items
    screen.getByText("First Aid: control bleeding");
    screen.getByText("Flood safety: move to higher ground");
    screen.getByText("Fire: use extinguisher");

    // filter by chip: First Aid
    fireEvent.press(screen.getByTestId("chip-aid"));
    await flush();
    screen.getByText("First Aid: control bleeding");
    expect(
      screen.queryByText("Flood safety: move to higher ground")
    ).toBeNull();
    expect(screen.queryByText("Fire: use extinguisher")).toBeNull();

    // back to "All"
    fireEvent.press(screen.getByTestId("chip-all"));
    await flush();

    // search for "flood" (case-insensitive)
    fireEvent.changeText(screen.getByTestId("search-input"), "flOod");
    await flush();
    screen.getByText("Flood safety: move to higher ground");
    expect(screen.queryByText("First Aid: control bleeding")).toBeNull();
    expect(screen.queryByText("Fire: use extinguisher")).toBeNull();
  });

  test("delete flow removes the selected bookmark", async () => {
    const screen = await renderScreen();

    screen.getByText("Flood safety: move to higher ground");

    // index 1 corresponds to the second card (id=2)
    fireEvent.press(screen.getByTestId("delete-btn-1"));
    await flush();
    screen.getByTestId("confirm-modal");
    fireEvent.press(screen.getByTestId("confirm-ok"));
    await flush();

    expect(BookmarksAPI.removeBookmark).toHaveBeenCalledWith(2);
    await waitFor(() =>
      expect(
        screen.queryByText("Flood safety: move to higher ground")
      ).toBeNull()
    );
    screen.getByText("First Aid: control bleeding");
    screen.getByText("Fire: use extinguisher");
  });

  test("clear all via TopBar right action", async () => {
    const screen = await renderScreen();

    // right icon is present when there are any items
    fireEvent.press(screen.getByTestId("topbar-right"));
    await flush();
    screen.getByTestId("confirm-modal");
    fireEvent.press(screen.getByTestId("confirm-ok"));
    await flush();

    expect(BookmarksAPI.clearAllBookmarks).toHaveBeenCalled();
    await waitFor(() => screen.getByText("No bookmarked questions"));
    screen.getByText("Tap the bookmark icon on any question to save it here.");
  });

  test("empty state when there are no bookmarks at mount", async () => {
    BookmarksAPI.__reset();
    BookmarksAPI.__setStore([]); // no items
    const screen = render(<BookmarkScreen />);
    await flush();
    await waitFor(() => screen.getByText("Bookmarked Questions"));
    screen.getByText("No bookmarked questions");
    screen.getByText("Tap the bookmark icon on any question to save it here.");
  });
});
