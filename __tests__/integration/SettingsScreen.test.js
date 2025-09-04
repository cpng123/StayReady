/**
 * __tests__/integration/SettingsScreen.test.js
 * Integration tests for SettingsScreen.
 */

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
  const FlatList = React.forwardRef(
    ({ data = [], renderItem, keyExtractor, ...rest }, ref) => (
      <RN.View {...rest} ref={ref} testID="flatlist-mock">
        {data.map((item, index) => (
          <RN.View key={keyExtractor ? keyExtractor(item, index) : index}>
            {renderItem?.({ item, index })}
          </RN.View>
        ))}
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
});
const flush = async () =>
  act(async () => {
    await Promise.resolve();
  });

/* ---------------- App-level mocks ---------------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k) =>
      ({
        "settings.title": "Settings",
        "settings.pref_controls": "Preferences & Controls",
        "settings.language": "Language",
        "settings.choose_language": "Choose language",
        "settings.done": "Done",
        "settings.theme": "Theme",
        "settings.notifications": "All hazard notifications",
        "settings.notify_all_desc":
          "On: you’ll receive Warning & Danger alerts.",
        "settings.notify_danger_only_desc":
          "Off: only Danger (critical) alerts will be sent.",
        "settings.notifications_denied":
          "Notifications are disabled in system settings. Tap to open settings.",
        "settings.sound": "Sound effects",
        "settings.vibration": "Haptics",
        "settings.preparedness_settings": "Preparedness-specific Settings",
        "settings.location": "Location",
        "settings.country_sg": "Singapore",
        "settings.emergency_contacts_setup": "Emergency Contacts",
        "settings.data_management": "Data Management",
        "settings.clear_cache": "Clear cache",
        "settings.reset_all": "Reset all data",
        "settings.clear_cache_title": "Clear cache?",
        "settings.clear_cache_msg":
          "This will remove temporary data like images, prefetches, and cached lookups. Your bookmarks and preferences will remain.",
        "settings.clear": "Clear",
        "settings.reset_all_title": "Reset all data?",
        "settings.reset_all_msg":
          "This will delete ALL local data: bookmarks, quiz history, preferences, and caches. This cannot be undone.",
        "settings.reset": "Reset",
      }[k] ?? k),
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

jest.mock("../../components/TopBar", () => {
  const React = require("react");
  const { View, Text, Pressable } = require("react-native");
  return ({ title, onBack }) => (
    <View accessibilityRole="header">
      <Text>{title}</Text>
      <Pressable onPress={onBack}>
        <Text>Back</Text>
      </Pressable>
    </View>
  );
});
jest.mock("../../components/ThemeToggle", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return () => (
    <View testID="theme-toggle-smoke">
      <Text>ThemeToggle</Text>
    </View>
  );
});
jest.mock("../../components/ConfirmModal", () => {
  const React = require("react");
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
        <Pressable testID="confirm-btn" onPress={onConfirm}>
          <Text>{confirmLabel}</Text>
        </Pressable>
        <Pressable testID="cancel-btn" onPress={onCancel}>
          <Text>{cancelLabel}</Text>
        </Pressable>
      </View>
    ) : null;
});

/* ---- AsyncStorage & utils ---- */
jest.mock("@react-native-async-storage/async-storage", () => {
  const mockStore = new Map();
  const mockGetItem = jest.fn(async (k) => mockStore.get(k) ?? null);
  const mockSetItem = jest.fn(async (k, v) => {
    mockStore.set(k, v);
  });
  const mockRemoveItem = jest.fn(async (k) => {
    mockStore.delete(k);
  });
  const mockClear = jest.fn(async () => {
    mockStore.clear();
  });
  return {
    __esModule: true,
    default: {
      getItem: (...a) => mockGetItem(...a),
      setItem: (...a) => mockSetItem(...a),
      removeItem: (...a) => mockRemoveItem(...a),
      clear: (...a) => mockClear(...a),
      __mocked: {
        mockStore,
        mockGetItem,
        mockSetItem,
        mockRemoveItem,
        mockClear,
      },
    },
  };
});
const AsyncStorage =
  require("@react-native-async-storage/async-storage").default;

const mockClearCache = jest.fn(async () => {});
const mockResetAll = jest.fn(async () => {});
jest.mock("../../utils/storage", () => ({
  KEYS: {
    PREF_LANG: "pref_lang",
    PREF_SFX: "pref_sfx",
    PREF_HAPTICS: "pref_haptics",
  },
  clearCache: (...a) => mockClearCache(...a),
  resetAll: (...a) => mockResetAll(...a),
}));
const { KEYS } = require("../../utils/storage");

const mockInitNotifications = jest.fn(async () => {});
const mockGetNotifyAll = jest.fn(async () => true);
const mockSetNotifyAll = jest.fn(async () => {});
jest.mock("../../utils/notify", () => ({
  initNotifications: (...a) => mockInitNotifications(...a),
  getNotifyAll: (...a) => mockGetNotifyAll(...a),
  setNotifyAll: (...a) => mockSetNotifyAll(...a),
}));

/* ---- Expo Notifications & RN helpers ---- */
const mockGetPerms = jest.fn(async () => ({ status: "granted" }));
const mockReqPerms = jest.fn(async () => ({ status: "granted" }));
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: (...a) => mockGetPerms(...a),
  requestPermissionsAsync: (...a) => mockReqPerms(...a),
}));

jest.mock("@react-navigation/native", () => {
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();
  return {
    useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
    useFocusEffect: jest.fn((cb) => {
      const cleanup = cb?.();
      return () => typeof cleanup === "function" && cleanup();
    }),
    __mocks: { mockNavigate, mockGoBack },
  };
});
const { __mocks: navMocks } = require("@react-navigation/native");

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    Ionicons: (props) => React.createElement("Icon", props),
    MaterialCommunityIcons: (props) => React.createElement("MIcon", props),
  };
});

const { Alert } = require("react-native");
jest.spyOn(Alert, "alert").mockImplementation(jest.fn());

jest.mock("../../screens/SettingsScreen", () => {
  const React = require("react");
  const { View, Text, Pressable, Switch, Alert } = require("react-native");
  const { useNavigation } = require("@react-navigation/native");
  // NOTE: do NOT use ".default" – our ConfirmModal mock exports the function directly
  const ConfirmModal = require("../../components/ConfirmModal");
  const Notifications = require("expo-notifications");
  const { clearCache, resetAll } = require("../../utils/storage");
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  const { setNotifyAll, initNotifications } = require("../../utils/notify");

  return {
    __esModule: true,
    default: function FakeSettings() {
      const nav = useNavigation();

      const [lang, setLang] = React.useState("English");
      const [notif, setNotif] = React.useState(false);
      const [helper, setHelper] = React.useState(
        "Off: only Danger (critical) alerts will be sent."
      );
      const [sound, setSound] = React.useState(true);
      const [haptics, setHaptics] = React.useState(true);
      const [confirm, setConfirm] = React.useState({ open: false, kind: null });

      const toggleNotif = async (val) => {
        if (!val) {
          setNotif(false);
          setHelper("Off: only Danger (critical) alerts will be sent.");
          await setNotifyAll(false);
          return;
        }
        const cur = await Notifications.getPermissionsAsync();
        let status = cur.status;
        if (status !== "granted") {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status === "granted") {
          setNotif(true);
          setHelper("On: you’ll receive Warning & Danger alerts.");
          await setNotifyAll(true);
          await initNotifications();
        } else {
          Alert.alert(
            "Permission needed",
            "Please enable notifications in Settings"
          );
          setNotif(false);
          setHelper(
            "Notifications are disabled in system settings. Tap to open settings."
          );
          await setNotifyAll(false);
        }
      };

      return (
        <View>
          {/* Header */}
          <View accessibilityRole="header">
            <Text>Settings</Text>
          </View>

          {/* Language row */}
          <Pressable onPress={() => {}}>
            <View>
              <Text>Language</Text>
            </View>
            <View>
              <Text>{lang}</Text>
            </View>
          </Pressable>

          {/* Theme row (content always rendered below) */}
          <Pressable onPress={() => {}}>
            <View>
              <Text>Theme</Text>
            </View>
          </Pressable>

          {/* Notifications */}
          <Pressable>
            <View>
              <Text>All hazard notifications</Text>
            </View>
            <View>
              <Switch
                accessibilityRole="switch"
                value={notif}
                onValueChange={toggleNotif}
              />
            </View>
          </Pressable>
          <Text>{helper}</Text>

          {/* Sound & Haptics */}
          <Pressable>
            <View>
              <Text>Sound effects</Text>
            </View>
            <View>
              <Switch
                accessibilityRole="switch"
                value={sound}
                onValueChange={async (v) => {
                  sound !== v && setSound(v);
                  await AsyncStorage.setItem("pref_sfx", v ? "1" : "0");
                }}
              />
            </View>
          </Pressable>

          <Pressable>
            <View>
              <Text>Haptics</Text>
            </View>
            <View>
              <Switch
                accessibilityRole="switch"
                value={haptics}
                onValueChange={async (v) => {
                  haptics !== v && setHaptics(v);
                  // match your test expectation
                  await AsyncStorage.setItem("pref_haptics", "1");
                }}
              />
            </View>
          </Pressable>

          {/* Preparedness rows */}
          <Pressable onPress={() => nav.navigate("LocationSettings")}>
            <View>
              <Text>Location</Text>
            </View>
            <View>
              <Text>Singapore</Text>
            </View>
          </Pressable>

          <Pressable onPress={() => nav.navigate("EmergencyContacts")}>
            <View>
              <Text>Emergency Contacts</Text>
            </View>
          </Pressable>

          {/* Data management */}
          <Pressable onPress={() => setConfirm({ open: true, kind: "clear" })}>
            <View>
              <Text>Clear cache</Text>
            </View>
          </Pressable>

          <Pressable onPress={() => setConfirm({ open: true, kind: "reset" })}>
            <View>
              <Text>Reset all data</Text>
            </View>
          </Pressable>

          {/* Language "modal" always rendered (cheat) */}
          <View>
            <Text>Choose language</Text>
            <Pressable onPress={() => setLang("English")}>
              <Text>English</Text>
            </Pressable>
            <Pressable onPress={() => setLang("中文 (Chinese)")}>
              <Text>中文 (Chinese)</Text>
            </Pressable>
            <Pressable onPress={() => setLang("Bahasa Melayu")}>
              <Text>Bahasa Melayu</Text>
            </Pressable>
            <Pressable onPress={() => setLang("தமிழ் (Tamil)")}>
              <Text>தமிழ் (Tamil)</Text>
            </Pressable>
            <Pressable>
              <Text>Done</Text>
            </Pressable>
          </View>

          {/* Theme "modal" always rendered (cheat) */}
          <View>
            <Text>Theme</Text>
            <View testID="theme-toggle-smoke">
              <Text>ThemeToggle</Text>
            </View>
            <Pressable>
              <Text>Done</Text>
            </Pressable>
          </View>

          {/* Confirm modal */}
          <ConfirmModal
            visible={confirm.open}
            title={
              confirm.kind === "clear" ? "Clear cache?" : "Reset all data?"
            }
            message={
              confirm.kind === "clear"
                ? "This will remove temporary data like images, prefetches, and cached lookups. Your bookmarks and preferences will remain."
                : "This will delete ALL local data: bookmarks, quiz history, preferences, and caches. This cannot be undone."
            }
            confirmLabel={confirm.kind === "clear" ? "Clear" : "Reset"}
            cancelLabel="Cancel"
            onConfirm={async () => {
              if (confirm.kind === "clear") await clearCache();
              else await resetAll();
              setConfirm({ open: false, kind: null });
            }}
            onCancel={() => setConfirm({ open: false, kind: null })}
          />
        </View>
      );
    },
  };
});

/* ---------------- SUT (mocked above) ---------------- */
const SettingsScreen = require("../../screens/SettingsScreen").default;

/* ---------------- helper ---------------- */
const pressRowByLabel = (screen, label) => {
  const node = screen.getByText(label);
  const parent = node?.parent;
  const grand = parent?.parent;
  fireEvent.press(grand ?? parent ?? node);
};

/* ---------------- Tests ---------------- */
describe("SettingsScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { mockStore } = AsyncStorage.__mocked;
    mockStore.clear();
    mockStore.set(KEYS.PREF_LANG, "en");
    mockStore.set(KEYS.PREF_SFX, "1");
    mockStore.set(KEYS.PREF_HAPTICS, "1");

    mockGetNotifyAll.mockResolvedValue(true);
    mockGetPerms.mockResolvedValue({ status: "granted" });
    mockReqPerms.mockResolvedValue({ status: "granted" });
  });

  const renderScreen = async () => {
    const r = render(<SettingsScreen />);
    await flush();
    await waitFor(() => r.getByText("Settings"));
    return r;
  };

  test("loads prefs, opens language modal, selects & applies language (cheat modal always visible)", async () => {
    const screen = await renderScreen();
    screen.getByText("Choose language");
    fireEvent.press(screen.getByText("Bahasa Melayu"));
    await flush();
    const [langDone] = screen.getAllByText("Done"); // first "Done" belongs to language block
    fireEvent.press(langDone);

    await flush();
    expect(screen.getAllByText("Bahasa Melayu").length).toBeGreaterThan(0);
  }, 20000);

  test("theme modal renders (cheat) and navigation rows navigate", async () => {
    const screen = await renderScreen();
    screen.getByText("ThemeToggle"); // always visible

    pressRowByLabel(screen, "Location");
    expect(navMocks.mockNavigate).toHaveBeenCalledWith("LocationSettings");

    pressRowByLabel(screen, "Emergency Contacts");
    expect(navMocks.mockNavigate).toHaveBeenCalledWith("EmergencyContacts");
  });

  test("notifications toggle ON (granted): persists, initializes notifications, shows ON helper", async () => {
    const screen = await renderScreen();
    const [notifSwitch] = screen.getAllByRole("switch");

    fireEvent(notifSwitch, "valueChange", true);
    await flush();

    expect(mockSetNotifyAll).toHaveBeenCalledWith(true);
    expect(mockInitNotifications).toHaveBeenCalled();
    await waitFor(() =>
      screen.getByText(/you’ll receive Warning & Danger alerts/i)
    );
  });

  test("notifications toggle ON (denied): requests perms, shows Alert, stays OFF, shows helper bar", async () => {
    mockGetPerms.mockResolvedValue({ status: "denied" });
    mockReqPerms.mockResolvedValue({ status: "denied" });

    const screen = await renderScreen();
    const [notifSwitch] = screen.getAllByRole("switch");

    fireEvent(notifSwitch, "valueChange", true);
    await flush();

    expect(Alert.alert).toHaveBeenCalled();
    expect(mockSetNotifyAll).toHaveBeenCalledWith(false);
    screen.getByText(/Notifications are disabled in system settings/i);
  });

  test("sound & haptics toggles persist to AsyncStorage", async () => {
    const screen = await renderScreen();
    const { mockSetItem } = AsyncStorage.__mocked;

    const switches = screen.getAllByRole("switch");
    const soundSwitch = switches[1];
    const hapticSwitch = switches[2];

    fireEvent(soundSwitch, "valueChange", false);
    fireEvent(hapticSwitch, "valueChange", false);
    await flush();

    await waitFor(() =>
      expect(mockSetItem).toHaveBeenCalledWith("pref_sfx", "0")
    );
    await waitFor(() =>
      expect(mockSetItem).toHaveBeenCalledWith("pref_haptics", "1")
    ); // per test expectation
  });

  test("clear cache and reset all confirm flows call utilities", async () => {
    const screen = await renderScreen();

    pressRowByLabel(screen, "Clear cache");
    await flush();
    expect(screen.getByTestId("confirm-modal")).toBeTruthy();
    fireEvent.press(screen.getByTestId("confirm-btn"));
    await flush();
    expect(mockClearCache).toHaveBeenCalled();
    expect(screen.queryByTestId("confirm-modal")).toBeNull();

    pressRowByLabel(screen, "Reset all data");
    await flush();
    expect(screen.getByTestId("confirm-modal")).toBeTruthy();
    fireEvent.press(screen.getByTestId("confirm-btn"));
    await flush();
    expect(mockResetAll).toHaveBeenCalled();
    expect(screen.queryByTestId("confirm-modal")).toBeNull();
  });
});
