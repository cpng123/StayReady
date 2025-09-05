jest.useFakeTimers({ legacyFakeTimers: true });

/* ---------------- Native shims ---------------- */
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
    () => ({
      shouldUseNativeDriver: () => false,
    }),
  );
} catch {
  try {
    // eslint-disable-next-line jest/no-jest-do-mock
    jest.doMock(
      "react-native/Libraries/Animated/src/NativeAnimatedHelper",
      () => ({
        shouldUseNativeDriver: () => false,
      }),
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
  }),
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
  }),
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
  })),
);

/* ---------------- React Native mock: inline Modal + sync FlatList --------- */
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  const React = require("react");

  const Modal = ({ children, ...props }) => <RN.View {...props}>{children}</RN.View>;
  Modal.displayName = "Modal";

  const FlatList = React.forwardRef(
    ({ data = [], renderItem, keyExtractor, ItemSeparatorComponent, ...rest }, ref) => (
      <RN.View {...rest} ref={ref} testID="flatlist-mock">
        {data.map((item, index) => (
          <RN.View key={keyExtractor ? keyExtractor(item, index) : index}>
            {renderItem?.({ item, index })}
            {ItemSeparatorComponent ? <ItemSeparatorComponent /> : null}
          </RN.View>
        ))}
      </RN.View>
    ),
  );
  FlatList.displayName = "FlatList";

  return { ...RN, Modal, FlatList };
});

/* ---------------- RNTL after RN mocked ----------------------------------- */
const { render, fireEvent, act, cleanup, waitFor } = require("@testing-library/react-native");
afterEach(() => cleanup());
const flush = async () => act(async () => { await Promise.resolve(); });

/* ---------------- App-level mocks ---------------------------------------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k, arg) => {
      if (typeof arg === "string") return arg; // defaultValue as string
      if (arg && typeof arg === "object" && "defaultValue" in arg) {
        return arg.defaultValue;
      }
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

/* ---------------- Lightweight UI component stubs ------------------------- */
jest.mock("../../components/TopBar", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ title, onBack, rightIcon, onRightPress }) => (
    <View accessibilityRole="header">
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text>Back</Text>
      </Pressable>
      <Text>{title}</Text>
      {rightIcon ? (
        <Pressable testID="right-action" onPress={onRightPress}>
          <Text>Reset</Text>
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  );
});

jest.mock("../../components/SearchRow", () => {
  const { View, TextInput } = require("react-native");
  return ({ value, onChangeText, placeholder }) => (
    <View>
      <TextInput
        testID="search-input"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
});

jest.mock("../../components/FilterChips", () => {
  const { View, Text, Pressable } = require("react-native");
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
            {activeId === opt.id ? "\n\n  ●" : "\n\n  "}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

jest.mock("../../components/ConfirmModal", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ visible, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) =>
    visible ? (
      <View testID="confirm-modal">
        <Text testID="confirm-title">{title}</Text>
        <Text testID="confirm-message">{message}</Text>
        <Pressable testID="confirm-btn" onPress={onConfirm}>
          <Text>{confirmLabel}</Text>
        </Pressable>
        <Pressable testID="cancel-btn" onPress={onCancel}>
          <Text>{cancelLabel}</Text>
        </Pressable>
      </View>
    ) : null;
});

jest.mock("../../components/ChecklistSectionCard", () => {
  const { View, Text, Pressable } = require("react-native");
  // Minimal renderable “card” that exposes item toggles
  return ({ section, onToggle }) => (
    <View>
      <Text>{section.title || section.id}</Text>
      {section.items.map((it) => (
        <Pressable
          key={it.id}
          testID={`toggle-${it.id}`}
          onPress={() => onToggle(section.id, it.id)}
        >
          <Text>{(it.done ? "✅ " : "⬜ ") + (it.text || it.id)}</Text>
        </Pressable>
      ))}
    </View>
  );
});

/* ---------------- Data + Storage layer fakes ------------------------------ */
jest.mock("../../data/checklist", () => {
  const filters = [
    { id: "safety", label: "Safety" },
    { id: "flood", label: "Flood" },
    { id: "haze", label: "Haze" },
  ];
  const SECTIONS = {
    safety: [
      {
        id: "sec-safety",
        title: "Safety Basics",
        items: [
          { id: "s1-a", text: "Install smoke alarms" },
          { id: "s1-b", text: "Keep first aid kit" },
        ],
      },
    ],
    flood: [
      {
        id: "sec-flood",
        title: "Flood Prep",
        items: [
          { id: "f1-a", text: "Stock bottled water" },
          { id: "f1-b", text: "Move valuables up" },
        ],
      },
    ],
    haze: [
      {
        id: "sec-haze",
        title: "Haze/PM2.5",
        items: [
          { id: "h1-a", text: "Buy N95 masks" },
          { id: "h1-b", text: "Check air purifier" },
        ],
      },
    ],
  };
  return {
    getChecklistFilters: (t) => filters.map((f) => ({ ...f, label: t(f.label, f.label) })),
    getSectionsByFilter: (id, _t) => (SECTIONS[id] ? SECTIONS[id].map((x) => ({ ...x })) : []),
  };
});

jest.mock("../../utils/checklistStorage", () => {
  let store = {}; // { [itemId]: boolean }

  const loadChecklistDoneMap = jest.fn(async () => ({ ...store }));
  const saveChecklistDoneMap = jest.fn(async (next) => { store = { ...next }; });
  const clearChecklistDoneMap = jest.fn(async () => { store = {}; });

  const applyDoneToSections = (sections, done) =>
    sections.map((s) => ({
      ...s,
      items: s.items.map((i) => ({ ...i, done: !!done[i.id] })),
    }));

  const __mocked = {
    setStore: (m) => { store = { ...(m || {}) }; },
    getStore: () => ({ ...store }),
    _reset: () => { store = {}; },
  };

  return {
    loadChecklistDoneMap,
    saveChecklistDoneMap,
    clearChecklistDoneMap,
    applyDoneToSections,
    __mocked,
  };
});
const ChecklistAPI = require("../../utils/checklistStorage");

/* ---------------- SUT ----------------------------------------------------- */
const ChecklistScreen = require("../../screens/ChecklistScreen").default;

/* ---------------- Helpers ------------------------------------------------- */
const renderScreen = async () => {
  const r = render(<ChecklistScreen navigation={{ goBack: jest.fn() }} />);
  await flush();
  // Title should render with defaultValue now
  await waitFor(() => r.getByText("StayReady Checklist"));
  return r;
};

/* ---------------- Tests --------------------------------------------------- */
describe("ChecklistScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // seed with one item already done
    ChecklistAPI.__mocked.setStore({ "s1-b": true });
  });

  test("renders sections; search & filter chips work; toggling persists map", async () => {
    const screen = await renderScreen();

    // Initially in "Safety" filter (default), both items rendered
    screen.getByText("Safety Basics");
    screen.getByText("⬜ Install smoke alarms");
    screen.getByText("✅ Keep first aid kit"); // seeded checked

    // Toggle s1-a → should persist as true
    fireEvent.press(screen.getByTestId("toggle-s1-a"));
    await flush();
    expect(ChecklistAPI.saveChecklistDoneMap).toHaveBeenCalled();
    const lastSaved = ChecklistAPI.saveChecklistDoneMap.mock.calls.at(-1)[0];
    expect(lastSaved["s1-a"]).toBe(true);

    // Filter to Flood
    fireEvent.press(screen.getByTestId("chip-flood"));
    await flush();
    screen.getByText("Flood Prep");
    screen.getByTestId("toggle-f1-a");
    screen.getByTestId("toggle-f1-b");

    // Search narrows to "water" (only f1-a remains)
    fireEvent.changeText(screen.getByTestId("search-input"), "water");
    await flush();
    screen.getByTestId("toggle-f1-a");
    expect(screen.queryByTestId("toggle-f1-b")).toBeNull();

    // Clear search
    fireEvent.changeText(screen.getByTestId("search-input"), "");
    await flush();
    screen.getByTestId("toggle-f1-b");
  });

  test("reset-all confirmation clears all checks and closes modal", async () => {
    const screen = await renderScreen();

    fireEvent.press(screen.getByTestId("right-action")); // open confirm
    await flush();
    screen.getByTestId("confirm-modal");
    screen.getByText("Reset all checks?");
    screen.getByText("This will uncheck every item in all tabs.");

    // Confirm reset
    fireEvent.press(screen.getByTestId("confirm-btn"));
    await flush();
    expect(ChecklistAPI.clearChecklistDoneMap).toHaveBeenCalled();

    // All items become unchecked visually (still on Safety tab)
    screen.getByText("⬜ Install smoke alarms");
    screen.getByText("⬜ Keep first aid kit");
    expect(screen.queryByTestId("confirm-modal")).toBeNull();
  });

  test("reset-all cancel keeps existing checks", async () => {
    const screen = await renderScreen();

    // Seed shows one checked
    screen.getByText("✅ Keep first aid kit");

    fireEvent.press(screen.getByTestId("right-action")); // open confirm
    await flush();
    screen.getByTestId("confirm-modal");
    fireEvent.press(screen.getByTestId("cancel-btn"));
    await flush();

    expect(ChecklistAPI.clearChecklistDoneMap).not.toHaveBeenCalled();
    // Still checked
    screen.getByText("✅ Keep first aid kit");
    expect(screen.queryByTestId("confirm-modal")).toBeNull();
  });

  test("toggling in another tab persists across remount (load map on mount)", async () => {
    const screen1 = await renderScreen();

    // Go to Haze, toggle h1-a (Buy N95 masks)
    fireEvent.press(screen1.getByTestId("chip-haze"));
    await flush();
    screen1.getByText("Haze/PM2.5");
    fireEvent.press(screen1.getByTestId("toggle-h1-a"));
    await flush();
    const saved = ChecklistAPI.saveChecklistDoneMap.mock.calls.at(-1)[0];
    expect(saved["h1-a"]).toBe(true);

    // Unmount and render again (simulates app navigation / reload)
    screen1.unmount();
    const screen2 = await renderScreen();
    fireEvent.press(screen2.getByTestId("chip-haze"));
    await flush();
    // Should reflect persisted done state
    screen2.getByText("✅ Buy N95 masks");
  });
});
