jest.useRealTimers();

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

/* ---------------- Native shims --------------------- */
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

/* ---------------- RN mock: Modal + FlatList + keep A11y props ------------ */
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
  waitFor,
} = require("@testing-library/react-native");
afterEach(() => {
  cleanup();
});
const flush = async () =>
  act(async () => {
    await Promise.resolve();
  });

/* ---------------- i18n: return fallback defaultValue --------------------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k, arg) => {
      if (typeof arg === "string") return arg;
      if (arg && typeof arg === "object" && "defaultValue" in arg)
        return arg.defaultValue;
      return k;
    },
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

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

/* ---------------- Navigation mocks --------------------------------------- */
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    useNavigation: () => ({ goBack: mockGoBack }),
    // Run inside a React effect so state updates commit after mount
    useFocusEffect: (callback) => {
      const memoized = React.useCallback(callback, [callback]);
      React.useEffect(() => {
        const cleanup = memoized && memoized();
        return typeof cleanup === "function" ? cleanup : undefined;
      }, [memoized]);
    },
  };
});

/* ---------------- Storage (contacts) mocks -------------------------------- */
const mockGetContacts = jest.fn(async () => []);
const mockSaveContacts = jest.fn(async () => {});
jest.mock("../../utils/emergencyContacts", () => ({
  getContacts: (...a) => mockGetContacts(...a),
  saveContacts: (...a) => mockSaveContacts(...a),
}));

/* ---------------- Modal mocks -------------------------------------------- */
// We allow tests to set the payload before pressing "save".
let mockEditorPayload = { name: "New Contact", value: "+6591112222" };

jest.mock("../../components/ContactEditorModal", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ open, initial, onClose, onSave }) =>
    open ? (
      <View testID="contact-editor">
        <Text>Editor</Text>
        {initial ? (
          <Text testID="editor-initial">{initial.name || "Unnamed"}</Text>
        ) : null}
        <Pressable
          testID="editor-save"
          onPress={() => onSave(mockEditorPayload)}
        >
          <Text>Save</Text>
        </Pressable>
        <Pressable testID="editor-cancel" onPress={onClose}>
          <Text>Cancel</Text>
        </Pressable>
      </View>
    ) : null;
});

jest.mock("../../components/ConfirmModal", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
  }) =>
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

/* ---------------- SUT ----------------------------------------------------- */
const EmergencyContactsScreen =
  require("../../screens/EmergencyContactsScreen").default;

/* ---------------- Helpers ------------------------------------------------- */
const renderScreen = async () => {
  const r = render(<EmergencyContactsScreen />);
  await flush();
  return r;
};

const fmt = (e164) => {
  // Helper to match the screen's display formatting
  const m = /^\+65(\d{4})(\d{4})$/.exec(String(e164 || ""));
  return m ? `+65 ${m[1]} ${m[2]}` : String(e164 || "");
};

/* ---------------- Tests --------------------------------------------------- */
describe("EmergencyContactsScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEditorPayload = { name: "New Contact", value: "+6591112222" };
    mockGetContacts.mockResolvedValue([]);
    mockSaveContacts.mockResolvedValue();
  });

  test("empty state: shows copy and 'Add Contact'; saving from empty adds and persists", async () => {
    mockGetContacts.mockResolvedValueOnce([]); // empty
    const screen = await renderScreen();

    // Empty copy
    screen.getByText("No emergency contacts yet");
    screen.getByText(/Add at least one contact/i);

    // Tap empty state's Add button (same a11y label as top-right)
    const addButtons = screen.getAllByLabelText("Add Contact");
    fireEvent.press(addButtons[0]); // empty-state button
    await flush();

    // Editor appears; save with default payload
    await waitFor(() => screen.getByTestId("contact-editor"));
    fireEvent.press(screen.getByTestId("editor-save"));
    await flush();

    // Persisted
    expect(mockSaveContacts).toHaveBeenCalled();
    await waitFor(() => screen.getByText("New Contact"));
    screen.getByText(fmt("+6591112222"));
  });

  test("loads list, formats numbers, and opens editor when row pressed; editing updates & persists", async () => {
    const initial = [
      { id: "a1", name: "Mum", value: "+6591234567" },
      { id: "b2", name: "Dad", value: "+6587654321" },
    ];
    mockGetContacts.mockResolvedValueOnce(initial);
    const screen = await renderScreen();
    await waitFor(() => screen.getByText("Mum"));
    screen.getByText(fmt("+6591234567"));
    screen.getByText("Dad");
    screen.getByText(fmt("+6587654321"));

    // Press first row (outer row has a11yLabel "Edit contact")
    const editRows = screen.getAllByLabelText("Edit contact");
    fireEvent.press(editRows[0]);

    await waitFor(() => screen.getByTestId("contact-editor"));
    // Change payload before saving
    mockEditorPayload = { name: "Mum (ICE)", value: "+6591112222" };
    fireEvent.press(screen.getByTestId("editor-save"));
    await flush();

    // Save called with updated first item preserving id
    const saved = mockSaveContacts.mock.calls.pop()?.[0];
    expect(Array.isArray(saved)).toBe(true);
    expect(saved[0]).toMatchObject({
      id: "a1",
      name: "Mum (ICE)",
      value: "+6591112222",
    });

    // UI updated
    screen.getByText("Mum (ICE)");
    screen.getByText(fmt("+6591112222"));
  });

  test("top bar add: opens editor; saving prepends new contact & persists", async () => {
    const initial = [{ id: "x1", name: "Alice", value: "+6590001111" }];
    mockGetContacts.mockResolvedValueOnce(initial);
    const screen = await renderScreen();
    await waitFor(() => screen.getByText("Alice"));

    // Tap top-right add button (a11y label "Add Contact")
    const addButtons = screen.getAllByLabelText("Add Contact");
    const topRight = addButtons[addButtons.length - 1];
    mockEditorPayload = { name: "Sister", value: "+6593334444" };
    fireEvent.press(topRight);
    await flush();

    await waitFor(() => screen.getByTestId("contact-editor"));
    fireEvent.press(screen.getByTestId("editor-save"));
    await flush();

    const saved = mockSaveContacts.mock.calls.pop()?.[0];
    expect(saved.length).toBe(2);
    // New item unshifted to front, gets generated id
    expect(saved[0]).toMatchObject({ name: "Sister", value: "+6593334444" });
    expect(typeof saved[0].id).toBe("string");

    // UI updated
    screen.getByText("Sister");
    screen.getByText(fmt("+6593334444"));
  });

  test("delete flow: tapping trash opens confirm; confirming removes item & persists", async () => {
    const initial = [
      { id: "a1", name: "One", value: "+6591111111" },
      { id: "b2", name: "Two", value: "+6592222222" },
    ];
    mockGetContacts.mockResolvedValueOnce(initial);
    const screen = await renderScreen();

    await waitFor(() => screen.getByText("Two"));
    const delBtns = screen.getAllByLabelText("Delete");
    fireEvent.press(delBtns[1]);
    await flush();

    await waitFor(() => screen.getByTestId("confirm-modal"));
    fireEvent.press(screen.getByTestId("confirm-btn"));
    await flush();

    // Persisted without "Two"
    const saved = mockSaveContacts.mock.calls.pop()?.[0];
    expect(saved.find((c) => c.name === "Two")).toBeUndefined();

    // UI no longer shows "Two"
    expect(screen.queryByText("Two")).toBeNull();
    expect(screen.queryByTestId("confirm-modal")).toBeNull();
  });

  test("migration: items without id get an id and are persisted once on load", async () => {
    const legacy = [{ name: "Friend", value: "+6590001111" }]; // no id
    mockGetContacts.mockResolvedValueOnce(legacy);

    const screen = await renderScreen();
    await waitFor(() => screen.getByText("Friend"));
    screen.getByText(fmt("+6590001111"));

    // Saved with id assigned
    expect(mockSaveContacts).toHaveBeenCalledTimes(1);
    const saved = mockSaveContacts.mock.calls[0][0];
    expect(saved[0]).toMatchObject({ name: "Friend", value: "+6590001111" });
    expect(typeof saved[0].id).toBe("string");
  });

  test("back button calls navigation.goBack", async () => {
    mockGetContacts.mockResolvedValueOnce([]);
    const screen = await renderScreen();

    const backBtn = screen.getByLabelText("Back");
    fireEvent.press(backBtn);
    expect(mockGoBack).toHaveBeenCalled();
  });
});
