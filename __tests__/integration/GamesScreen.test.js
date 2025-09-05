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
        numColumns,
        columnWrapperStyle,
        ...rest
      },
      _ref
    ) => {
      const renderMaybe = (Comp) => {
        if (!Comp) return null;
        return typeof Comp === "function" ? <Comp /> : Comp;
      };

      // naive columns support for tests
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
afterEach(() => cleanup());

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

/* ---------------- Navigation (manual mock, delayed focus) ----------------- */
const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const { act } = require("@testing-library/react-native");
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: jest.fn((cb) => {
      let cleanup;
      const id = setTimeout(() => {
        act(() => {
          cleanup = cb?.();
        });
      }, 0);
      return () => {
        clearTimeout(id);
        if (typeof cleanup === "function") cleanup();
      };
    }),
  };
});

/* ---------------- Child components --------------------------------------- */
jest.mock("../../components/QuickTipsCarousel", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ tips = [], onPressTip }) => (
    <View testID="quick-tips">
      {tips.map((tip) => (
        <Pressable
          key={tip.id}
          testID={`tip-${tip.id}`}
          accessibilityLabel={`tip-${tip.id}`}
          onPress={() => onPressTip?.(tip)}
        >
          <Text>{tip.categoryTitle}</Text>
          <Text>{tip.text}</Text>
        </Pressable>
      ))}
    </View>
  );
});

jest.mock("../../components/ImageOverlayCard", () => {
  const { Pressable, Text } = require("react-native");
  return ({ title, onPress }) => (
    <Pressable testID={`cat-card-${title}`} onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
});

/* ---------------- i18n (supports string AND object second arg) ----------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, arg) => {
      // Handle t(key, "Default") signature
      if (typeof arg === "string") {
        return arg;
      }
      const opts = arg || {};
      const ns = opts.ns || "common";

      if (ns === "common") {
        if (key === "games.title") return "Safety Quiz";
        if (key === "games.subtitle") return "Quiz your preparedness skills.";
        if (key === "games.stats.taken") return "Quiz Taken";
        if (key === "games.stats.accuracy") return "Recent Accuracy";
        if (key === "games.stats.streak") return "Day Streak";
        if (key === "games.daily.title") return "Daily Challenge";
        if (key === "games.daily.review_title")
          return "Daily Challenge — Review";
        if (key === "games.daily.loading") return "Loading...";
        if (key === "games.daily.start") return "Start Challenge";
        if (key === "games.daily.review_answer") return "Review Answer";
        if (key === "games.daily.questions_count") {
          const c = opts.count ?? 0;
          return `${c} Questions`;
        }
        if (key === "games.quick_tips") return "Quick Tips";
        if (key === "games.categories_quiz") return "Categories Quiz";
        // topic labels
        const topics = {
          "home.prep.topic.flood": "Flood",
          "home.prep.topic.haze": "Haze",
          "home.prep.topic.storm": "Storm",
          "home.prep.topic.dengue": "Dengue",
          "home.prep.topic.wind": "Wind",
          "home.prep.topic.aid": "Aid",
          "home.prep.topic.fire": "Fire",
          "home.prep.topic.kit": "Go-Bag",
          "home.prep.topic.disease": "Disease",
          "home.prep.topic.earthquake": "Earthquake",
          "home.prep.topic.heatstroke": "Heatstroke",
        };
        if (topics[key]) return topics[key];
        return opts.defaultValue || key;
      }

      if (ns === "preparedness") {
        // "<guide>.title" used for quick-tip category titles
        const m = /^([^.]*)\.title$/.exec(key);
        if (m) {
          const map = {
            flood: "Flood",
            haze: "Haze",
            storm: "Storm",
            dengue: "Dengue",
            wind: "Wind",
            aid: "Aid",
            fire: "Fire",
            kit: "Go-Bag",
            disease: "Disease",
            earthquake: "Earthquake",
            heatstroke: "Heatstroke",
          };
          return map[m[1]] || opts.defaultValue || key;
        }
      }
      return opts.defaultValue || key;
    },
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

/* ---------------- QUIZ JSON (EN) mocked to be deterministic --------------- */
jest.mock("../../i18n/resources/en/quiz.json", () => ({
  categories: [
    { id: "flood", title: "Flood (EN)", sets: [1, 2] },
    { id: "haze", title: "Haze (EN)", sets: [1] },
  ],
}));

/* ---------------- Utils mocked with EXACT resolved paths ------------------ */
// tips
let mockPickRandomTips = jest.fn(() => [
  {
    id: "t1",
    categoryId: "flood",
    categoryTitle: "Flood",
    text: "Stay away from drains",
  },
  {
    id: "t2",
    categoryId: "haze",
    categoryTitle: "Haze",
    text: "Wear a proper mask",
  },
  {
    id: "t3",
    categoryId: "fire",
    categoryTitle: "Fire",
    text: "Check extinguisher monthly",
  },
]);

jest.mock("../../utils/tips", () => ({
  __esModule: true,
  pickRandomTips: (...a) => mockPickRandomTips(...a),
}));

// dailyChallenge
mockGetDailyToday = jest.fn(async () => ({
  completed: true,
  key: "daily-2025-01-02",
  questions: [],
  review: [{ q: 1, a: "X" }],
  // omit meta so the screen uses its fallback with categoryId: "daily"
}));

jest.mock("../../utils/dailyChallenge", () => ({
  __esModule: true,
  getDailyToday: (...a) => mockGetDailyToday(...a),
}));

// progressStats
let mockGetStatsSummary = jest.fn(async () => ({
  taken: 12,
  accuracy: 83.3,
  streak: 5,
}));

jest.mock("../../utils/progressStats", () => ({
  __esModule: true,
  getStatsSummary: (...a) => mockGetStatsSummary(...a),
}));

/* ---------------- SUT ----------------------------------------------------- */
const GamesScreen = require("../../screens/GamesScreen").default;

/* ---------------- Helpers ------------------------------------------------- */
const renderScreen = async () => {
  const r = render(<GamesScreen />);
  await waitFor(() => r.getByText("Safety Quiz"));
  return r;
};

/* ---------------- Tests --------------------------------------------------- */
describe("GamesScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default mock implementations before each test
    mockPickRandomTips = jest.fn(() => [
      {
        id: "t1",
        categoryId: "flood",
        categoryTitle: "Flood",
        text: "Stay away from drains",
      },
      {
        id: "t2",
        categoryId: "haze",
        categoryTitle: "Haze",
        text: "Wear a proper mask",
      },
      {
        id: "t3",
        categoryId: "fire",
        categoryTitle: "Fire",
        text: "Check extinguisher monthly",
      },
    ]);
    mockGetDailyToday = jest.fn(async () => ({
      completed: false,
      key: "daily-2025-01-01",
      questions: [1, 2, 3, 4, 5, 6, 7],
      review: [],
      meta: {},
    }));
    mockGetStatsSummary = jest.fn(async () => ({
      taken: 12,
      accuracy: 83.3,
      streak: 5,
    }));
  });

  test("renders header, stats (rounded %), daily section, quick tips, and category grid", async () => {
    const screen = await renderScreen();

    // Header copy
    screen.getByText("Safety Quiz");
    screen.getByText("Quiz your preparedness skills.");

    // Stats (async)
    await waitFor(() => screen.getByText("12"));
    screen.getByText("83%");
    screen.getByText("5");

    // Daily section
    await waitFor(() => screen.getByText("Start Challenge"));
    screen.getByText("7 Questions");

    // Quick tips present
    screen.getByText("Quick Tips");
    screen.getByTestId("quick-tips");

    // Categories grid (from mocked EN quiz.json)
    screen.getByTestId("cat-card-Flood (EN)");
    screen.getByTestId("cat-card-Haze (EN)");
  });

  test("daily: shows 'Start Challenge' when incomplete; pressing navigates to QuizPlay", async () => {
    const screen = await renderScreen();

    await waitFor(() => screen.getByText("Start Challenge"));
    fireEvent.press(screen.getByText("Start Challenge"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "QuizPlay",
      expect.objectContaining({
        mode: "daily",
        title: "Daily Challenge",
        customQuestions: expect.any(Array),
        meta: expect.objectContaining({ categoryId: "daily" }),
      })
    );
    const args = mockNavigate.mock.calls[mockNavigate.mock.calls.length - 1][1];
    expect(args.customQuestions.length).toBe(7);
  });

  test("daily: shows 'Review Answer' when completed; pressing navigates to ReviewAnswer", async () => {
    // Next call returns "completed"
    mockGetDailyToday = jest.fn(async () => ({
      completed: true,
      key: "daily-2025-01-02",
      questions: [],
      review: [{ q: 1, a: "X" }],
    }));

    const screen = await renderScreen();

    await waitFor(() => screen.getByText("Review Answer"));
    fireEvent.press(screen.getByText("Review Answer"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "ReviewAnswer",
      expect.objectContaining({
        title: "Daily Challenge — Review",
        review: expect.any(Array),
        meta: expect.objectContaining({ categoryId: "daily" }),
      })
    );
  });

  test("quick tips: pressing a tip opens its PreparednessGuide", async () => {
    const screen = await renderScreen();

    // Press first tip (flood)
    fireEvent.press(screen.getByTestId("tip-t1"));

    expect(mockNavigate).toHaveBeenCalledWith("PreparednessGuide", {
      id: "flood",
    });
  });

  test("category grid: pressing a category navigates to QuizSets with its id/title", async () => {
    const screen = await renderScreen();

    fireEvent.press(screen.getByTestId("cat-card-Haze (EN)"));

    expect(mockNavigate).toHaveBeenCalledWith("QuizSets", {
      categoryId: "haze",
      title: "Haze (EN)",
    });
  });

  test("updates daily questions count text from async load (default shows Loading… first)", async () => {
    // Slow-ish first resolve, then 11 questions
    mockGetDailyToday = jest.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                completed: false,
                key: "daily-2025-01-03",
                questions: Array.from({ length: 11 }, (_, i) => i),
                review: [],
                meta: {},
              }),
            0
          )
        )
    );

    const screen = await renderScreen();

    // Shows loading text first
    screen.getByText("Loading...");

    // Then updates with count
    await waitFor(() => screen.getByText("11 Questions"));
  });
});
