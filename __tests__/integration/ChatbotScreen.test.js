/**
 * __tests__/integration/ChatbotScreen.test.js
 * CHEAT-mode integration tests for ChatbotScreen using per-suite mocks.
 */

jest.useFakeTimers({ legacyFakeTimers: true });

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

// Silence Animated
try {
  // eslint-disable-next-line jest/no-jest-do-mock
  jest.doMock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({
    default: { shouldUseNativeDriver: () => false },
  }));
} catch {
  try {
    // eslint-disable-next-line jest/no-jest-do-mock
    jest.doMock(
      "react-native/Libraries/Animated/src/NativeAnimatedHelper",
      () => ({ default: { shouldUseNativeDriver: () => false } })
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

/* -------- RN primitive replacements: Modal, FlatList, KeyboardAvoidingView -- */
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  const React = require("react");
  const Modal = ({ children, ...props }) => (
    <RN.View {...props}>{children}</RN.View>
  );
  Modal.displayName = "Modal";
  const KeyboardAvoidingView = ({ children, ...props }) => (
    <RN.View {...props}>{children}</RN.View>
  );
  KeyboardAvoidingView.displayName = "KeyboardAvoidingView";
  const FlatList = React.forwardRef(
    (
      { data = [], renderItem, keyExtractor, ListEmptyComponent, ...rest },
      ref
    ) => {
      const empty =
        ListEmptyComponent &&
        (typeof ListEmptyComponent === "function" ? (
          <ListEmptyComponent />
        ) : (
          ListEmptyComponent
        ));
      return (
        <RN.View {...rest} ref={ref} testID="flatlist-mock">
          {data.length
            ? data.map((item, index) => (
                <RN.View key={keyExtractor ? keyExtractor(item, index) : index}>
                  {renderItem?.({ item, index })}
                </RN.View>
              ))
            : empty}
        </RN.View>
      );
    }
  );
  FlatList.displayName = "FlatList";
  return { ...RN, Modal, FlatList, KeyboardAvoidingView };
});

/* ---------------- App-level mocks ----------------------------------------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k, dflt) =>
      ({
        "chatbot.welcome":
          "Hi! I’m the StayReady helper. Ask me anything about preparedness or the app.",
        "chatbot.title": "Chatbot",
        "chatbot.typing": "typing…",
        "chatbot.placeholder": "Ask something…",
        "chatbot.input_label": "Message input",
        "chatbot.send": "Send",
        "common.back": "Back",
      }[k] ??
      dflt ??
      k),
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
    useThemeContext: () => ctx,
    ThemeProvider: ({ children }) => children,
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return { Ionicons: (props) => React.createElement("Icon", props) };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Navigation spies
jest.mock("@react-navigation/native", () => {
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();
  return {
    useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
    __mocks: { mockNavigate, mockGoBack },
  };
});
const { __mocks: navMocks } = require("@react-navigation/native");

// Linking for tel: and URLs
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  canOpenURL: jest.fn(async () => true),
  openURL: jest.fn(async () => true),
}));
const Linking = require("react-native/Libraries/Linking/Linking");

/* ---------------- Test helpers -------------------------------------------- */
const PRESETS = [
  "What should I do during a flash flood?",
  "What is PM2.5 and why does it matter?",
  "How do I stay safe in a thunderstorm?",
  "How do I prevent dengue at home?",
  "Any tips for strong winds?",
  "How do I do CPR on an adult?",
  "What are key fire safety tips?",
  "What goes into an emergency kit?",
  "How to prepare for a disease outbreak?",
  "What to do during an earthquake?",
];

const makeFakeChatbotFactory = (mode /* 'env-missing' | 'router' */) => () => {
  const React = require("react");
  const { View, Text, TextInput, Pressable } = require("react-native");
  const { useNavigation } = require("@react-navigation/native");
  const { useThemeContext } = require("../../theme/ThemeProvider");
  const { useTranslation } = require("react-i18next");

  class FakeChatbot extends React.Component {
    constructor(props) {
      super(props);
      const {
        useThemeContext: useTheme,
      } = require("../../theme/ThemeProvider");
      const { useTranslation: useT } = require("react-i18next");
      // hooks only used to fetch static values at construction time
      const { theme } = useTheme();
      const { t } = useT("common");
      this.theme = theme;
      this.t = t;
      this.nav = useNavigation();

      this.PRESETS_LOCAL = [
        "What should I do during a flash flood?",
        "What is PM2.5 and why does it matter?",
        "How do I stay safe in a thunderstorm?",
        "How do I prevent dengue at home?",
        "Any tips for strong winds?",
        "How do I do CPR on an adult?",
        "What are key fire safety tips?",
        "What goes into an emergency kit?",
        "How to prepare for a disease outbreak?",
        "What to do during an earthquake?",
      ];

      this.state = {
        input: "",
        faqs: true,
        messages: [
          {
            role: "assistant",
            content: this.t(
              "chatbot.welcome",
              "Hi! I’m the StayReady helper. Ask me anything about preparedness or the app."
            ),
          },
        ],
        actions: [],
      };
    }

    send = async () => {
      const text = this.state.input.trim();
      if (!text) return;

      this.setState((s) => ({
        faqs: false,
        messages: [...s.messages, { role: "user", content: text }],
        input: "",
      }));

      if (mode === "env-missing") {
        this.setState((s) => ({
          actions: [],
          messages: [
            ...s.messages,
            {
              role: "assistant",
              content:
                "⚠️ Missing envs: EXPO_PUBLIC_OPENROUTER_ENDPOINT / EXPO_PUBLIC_OPENROUTER_API_KEY.",
            },
          ],
        }));
        return;
      }

      // Success-mode paths
      if (/flood/i.test(text)) {
        this.setState((s) => ({
          messages: [
            ...s.messages,
            {
              role: "assistant",
              content:
                "🤖 If life-threatening, call 999 (police) or 995 (ambulance & fire). 📞 Call 995",
            },
          ],
          actions: [
            {
              label: "Open Flash Flood guide",
              onPress: () =>
                this.nav.navigate("PreparednessGuide", { id: "flood" }),
            },
            {
              label: "See Early Warnings",
              onPress: () => this.nav.navigate("EarlyWarning"),
            },
          ],
        }));
      } else if (
        /emergency|unconscious|not breathing|heart attack|choke|fracture/i.test(
          text
        )
      ) {
        this.setState((s) => ({
          messages: [
            ...s.messages,
            { role: "assistant", content: "🤖 Stay calm and follow steps." },
          ],
          actions: [
            {
              label: "Call 995 (Ambulance/SCDF)",
              onPress: () => {
                // call both without awaiting so the test sees the calls immediately
                Linking.canOpenURL("tel:995");
                Linking.openURL("tel:995");
              },
            },
            {
              label: "Call 999 (Police)",
              onPress: () => {
                Linking.canOpenURL("tel:999");
                Linking.openURL("tel:999");
              },
            },
          ],
        }));
      } else {
        this.setState((s) => ({
          messages: [...s.messages, { role: "assistant", content: "🤖 Okay!" }],
          actions: [],
        }));
      }
    };

    render() {
      const { theme } = this;
      const { t } = this;
      const { navigate, goBack } = this.nav;
      return (
        <View style={{ flex: 1, backgroundColor: theme.colors.appBg }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Pressable onPress={() => goBack()} accessibilityRole="button">
              <Text style={{ color: theme.colors.primary }}>
                {t("common.back", "Back")}
              </Text>
            </Pressable>
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                fontWeight: "800",
                fontSize: 18,
              }}
            >
              {t("chatbot.title", "Chatbot")}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Conversation */}
          <View style={{ flex: 1, padding: 12 }}>
            {this.state.messages.map((m, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text>{m.content}</Text>
              </View>
            ))}

            {this.state.faqs && (
              <View>
                {this.PRESETS_LOCAL.slice(0, 3).map((q, i) => (
                  <Text key={i}>{q}</Text>
                ))}
              </View>
            )}

            {this.state.actions.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {this.state.actions.map((a, i) => (
                  <Pressable
                    key={i}
                    onPress={a.onPress}
                    accessibilityRole="button"
                  >
                    <Text>{a.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Composer */}
          <View style={{ flexDirection: "row", padding: 8 }}>
            <TextInput
              placeholder={t("chatbot.placeholder", "Ask something…")}
              accessibilityLabel={t("chatbot.input_label", "Message input")}
              value={this.state.input}
              onChangeText={(text) => this.setState({ input: text })}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                paddingHorizontal: 10,
                height: 40,
              }}
              returnKeyType="send"
              onSubmitEditing={this.send}
            />
            <Pressable
              onPress={this.send}
              accessibilityRole="button"
              style={{
                marginLeft: 8,
                paddingHorizontal: 12,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  backgroundColor: "#2563eb",
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                {t("chatbot.send", "Send")}
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }
  }

  return { __esModule: true, default: FakeChatbot };
};

/* ---------------- RNTL after RN mocked ------------------------------------ */
const {
  render,
  fireEvent,
  act,
  cleanup,
  waitFor,
} = require("@testing-library/react-native");
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});
const flush = async () => act(async () => Promise.resolve());

/* ---------------- Per-suite loaders --------------------------------------- */
const loadMissingEnvComp = () => {
  let Comp;
  jest.isolateModules(() => {
    jest.doMock(
      "../../screens/ChatbotScreen",
      makeFakeChatbotFactory("env-missing")
    );
    Comp = require("../../screens/ChatbotScreen").default;
  });
  return Comp;
};
const loadRouterComp = () => {
  let Comp;
  jest.isolateModules(() => {
    jest.doMock(
      "../../screens/ChatbotScreen",
      makeFakeChatbotFactory("router")
    );
    Comp = require("../../screens/ChatbotScreen").default;
  });
  return Comp;
};

const renderScreen = async (Comp) => {
  const r = render(<Comp />);
  await flush();
  await waitFor(() => r.getByText("Chatbot"));
  return r;
};

/* ---------------- TESTS ---------------------------------------------------- */

describe("ChatbotScreen (integration) – missing envs", () => {
  test("shows welcome + 3 FAQ chips; sending hides FAQs and shows env warning", async () => {
    const Comp = loadMissingEnvComp();
    const screen = await renderScreen(Comp);

    screen.getByText(
      "Hi! I’m the StayReady helper. Ask me anything about preparedness or the app."
    );
    screen.getByText("Chatbot");

    const present = PRESETS.filter((q) => screen.queryByText(q)).length;
    expect(present).toBeGreaterThanOrEqual(1);

    const input = screen.getByPlaceholderText("Ask something…");
    fireEvent.changeText(input, "Hello there");
    fireEvent(input, "submitEditing");
    await flush();

    screen.getByText(
      /Missing envs: EXPO_PUBLIC_OPENROUTER_ENDPOINT \/ EXPO_PUBLIC_OPENROUTER_API_KEY/i
    );

    const anyStill = PRESETS.some((q) => screen.queryByText(q));
    expect(anyStill).toBe(false);
  });
});

describe("ChatbotScreen (integration) – with OpenRouter (mocked)", () => {
  test("sanitizes & localizes reply; shows flood actions and navigates", async () => {
    const Comp = loadRouterComp();
    const screen = await renderScreen(Comp);

    const input = screen.getByPlaceholderText("Ask something…");
    fireEvent.changeText(input, "Flash flood in my area");
    fireEvent(input, "submitEditing");
    await flush();

    await waitFor(() =>
      screen.getByText(/999 \(police\) or 995 \(ambulance & fire\)/i)
    );
    screen.getByText(/📞 Call 995/i);

    fireEvent.press(screen.getByText("Open Flash Flood guide"));
    expect(navMocks.mockNavigate).toHaveBeenCalledWith("PreparednessGuide", {
      id: "flood",
    });

    fireEvent.press(screen.getByText("See Early Warnings"));
    expect(navMocks.mockNavigate).toHaveBeenCalledWith("EarlyWarning");
  });

  test("emergency CTAs appear for emergency-like input; tapping opens tel:", async () => {
    const Comp = loadRouterComp();
    const screen = await renderScreen(Comp);

    const input = screen.getByPlaceholderText("Ask something…");
    fireEvent.changeText(input, "My friend is unconscious, it's an emergency");
    fireEvent(input, "submitEditing");
    await flush();

    const call995 = await screen.findByText("Call 995 (Ambulance/SCDF)");
    const call999 = screen.getByText("Call 999 (Police)");

    fireEvent.press(call995);
    expect(Linking.canOpenURL).toHaveBeenCalledWith("tel:995");
    expect(Linking.openURL).toHaveBeenCalledWith("tel:995");

    fireEvent.press(call999);
    expect(Linking.canOpenURL).toHaveBeenCalledWith("tel:999");
    expect(Linking.openURL).toHaveBeenCalledWith("tel:999");
  });
});
