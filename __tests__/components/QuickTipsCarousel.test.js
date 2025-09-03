import { render, fireEvent, act } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock Ionicons to a simple Text that preserves props ----
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: (p) => <Text {...p}>{p.name}</Text>,
  };
});

let mockScrollTo;
jest.mock("react-native/Libraries/Components/ScrollView/ScrollView", () => {
  const React = require("react");
  const View = require("react-native/Libraries/Components/View/View");
  const ScrollViewMock = React.forwardRef((props, ref) => {
    if (!mockScrollTo) {
      mockScrollTo = jest.fn();
    }
    const api = { scrollTo: mockScrollTo };
    React.useImperativeHandle(ref, () => api);
    return <View testID="ScrollView" {...props} />;
  });
  return ScrollViewMock;
});

// Now import after mocks
import { View, Dimensions } from "react-native";
import QuickTipsCarousel from "../../components/QuickTipsCarousel";

// Helpers
const flatten = (style) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style || {};
const SCREEN_PADDING = 16;
const ITEM_SPACING = 10;
const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_W = SCREEN_WIDTH - SCREEN_PADDING * 2;

// Common theme
const theme = {
  key: "light",
  colors: {
    primary: "#0A84FF",
    text: "#111111",
    subtext: "#666666",
    card: "#FFFFFF",
  },
};

const tips = [
  {
    id: "t1",
    categoryTitle: "Floods",
    text: "Avoid driving through flooded roads.",
  },
  {
    id: "t2",
    categoryTitle: "Haze",
    text: "Wear a properly fitted mask outdoors.",
  },
  {
    id: "t3",
    categoryTitle: "Heat",
    text: "Hydrate frequently and rest in shade.",
  },
];

describe("QuickTipsCarousel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders tip cards with correct content and chevron icon", () => {
    const { getByText, getAllByText } = render(
      <QuickTipsCarousel tips={tips} theme={theme} />
    );

    expect(getByText("Floods")).toBeTruthy();
    expect(getByText("Avoid driving through flooded roads.")).toBeTruthy();

    expect(getByText("Haze")).toBeTruthy();
    expect(getByText("Wear a properly fitted mask outdoors.")).toBeTruthy();

    // Ionicons mocked to Text shows icon name
    const icons = getAllByText("chevron-forward-circle-outline");
    expect(icons).toHaveLength(tips.length);
  });

  it("sizes each card to (screen width - horizontal padding * 2)", () => {
    const { UNSAFE_getAllByType } = render(
      <QuickTipsCarousel tips={tips} theme={theme} />
    );

    // The inner card View has minHeight: 90 and borderRadius: 16 (from base styles)
    const cards = UNSAFE_getAllByType(View).filter((v) => {
      const s = flatten(v.props.style);
      return s && s.minHeight === 90 && s.borderRadius === 16;
    });
    expect(cards.length).toBeGreaterThan(0);

    const firstCard = cards[0];
    const s = flatten(firstCard.props.style);
    expect(s.width).toBe(CARD_W);
  });

  it("ScrollView has snapping props and proper padding/margins", () => {
    const { getByTestId } = render(
      <QuickTipsCarousel tips={tips} theme={theme} />
    );

    const scroller = getByTestId("ScrollView");
    expect(scroller.props.horizontal).toBe(true);
    expect(scroller.props.showsHorizontalScrollIndicator).toBe(false);
    expect(scroller.props.snapToInterval).toBe(CARD_W + ITEM_SPACING);
    expect(scroller.props.decelerationRate).toBe("fast");
    expect(scroller.props.snapToAlignment).toBe("start");

    // contentContainerStyle
    const ccs = flatten(scroller.props.contentContainerStyle);
    expect(ccs.paddingRight).toBe(SCREEN_PADDING);
    expect(ccs.paddingHorizontal).toBe(SCREEN_PADDING - 1);

    // style (marginHorizontal: -SCREEN_PADDING)
    const rs = flatten(scroller.props.style);
    expect(rs.marginHorizontal).toBe(-SCREEN_PADDING);
  });

  it("auto-advances every 3.5s and scrolls to next card", () => {
    render(<QuickTipsCarousel tips={tips} theme={theme} />);
    expect(mockScrollTo).not.toHaveBeenCalled();

    // advance 1 tick -> next index 1
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(mockScrollTo).toHaveBeenCalledWith({
      x: 1 * (CARD_W + ITEM_SPACING),
      animated: true,
    });

    // advance another tick -> index 2
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(mockScrollTo).toHaveBeenLastCalledWith({
      x: 2 * (CARD_W + ITEM_SPACING),
      animated: true,
    });

    // wrap around
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(mockScrollTo).toHaveBeenLastCalledWith({
      x: 0 * (CARD_W + ITEM_SPACING),
      animated: true,
    });
  });

  it("syncs active index on manual swipe and updates the active dot color", () => {
    const { getByTestId, UNSAFE_getAllByType } = render(
      <QuickTipsCarousel tips={tips} theme={theme} />
    );

    const scroller = getByTestId("ScrollView");

    // Simulate swipe to index 2 (x = 2 * (CARD_W + ITEM_SPACING))
    act(() => {
      scroller.props.onMomentumScrollEnd({
        nativeEvent: { contentOffset: { x: 2 * (CARD_W + ITEM_SPACING) } },
      });
    });

    // Find the pagination dots: tiny 6x6 Views with borderRadius 3
    const dots = UNSAFE_getAllByType(View).filter((v) => {
      const s = flatten(v.props.style);
      return s && s.width === 6 && s.height === 6 && s.borderRadius === 3;
    });
    expect(dots.length).toBe(tips.length);

    // The active (index 2) dot should be theme.colors.primary
    const activeDotStyle = flatten(dots[2].props.style);
    expect(activeDotStyle.backgroundColor).toBe(theme.colors.primary);
  });

  it("emits onPressTip when a tip card is tapped", () => {
    const onPressTip = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <QuickTipsCarousel tips={tips} theme={theme} onPressTip={onPressTip} />
    );

    const touchables = UNSAFE_getAllByType(
      require("react-native").TouchableOpacity
    );
    // Each tip is wrapped in a TouchableOpacity; press the first
    fireEvent.press(touchables[0]);
    expect(onPressTip).toHaveBeenCalledTimes(1);
    expect(onPressTip).toHaveBeenCalledWith(tips[0]);
  });

  it("merges external style overrides with base styles (caller wins)", () => {
    const overrides = {
      tipCard: { padding: 99, elevation: 7 },
      tipBar: { width: 8 },
      tipTitle: { fontSize: 18 },
      tipBodyWrap: { height: 40 },
      tipBody: { fontSize: 13 },
    };

    const { UNSAFE_getAllByType, getByText } = render(
      <QuickTipsCarousel tips={tips} theme={theme} styles={overrides} />
    );

    // card view
    const cards = UNSAFE_getAllByType(View).filter((v) => {
      const s = flatten(v.props.style);
      return s && s.minHeight === 90 && s.borderRadius === 16;
    });
    const cardS = flatten(cards[0].props.style);
    expect(cardS.padding).toBe(99);
    expect(cardS.elevation).toBe(7);

    // bar view (left accent)
    const bars = UNSAFE_getAllByType(View).filter((v) => {
      const s = flatten(v.props.style);
      return s && s.alignSelf === "stretch" && s.marginRight === 10;
    });
    expect(flatten(bars[0].props.style).width).toBe(8);

    // title text
    const titleNode = getByText("Floods");
    expect(flatten(titleNode.props.style).fontSize).toBe(18);

    // body wrap -> overridden to height 40
    const bodyWraps = UNSAFE_getAllByType(View).filter((v) => {
      const s = flatten(v.props.style);
      return s && s.height === 40 && s.overflow === "hidden";
    });
    expect(bodyWraps.length).toBeGreaterThan(0);

    // body text font size
    const bodyNode = getByText("Avoid driving through flooded roads.");
    expect(flatten(bodyNode.props.style).fontSize).toBe(13);
  });

  it("renders gracefully with no tips (no interval runs)", () => {
    render(<QuickTipsCarousel tips={[]} theme={theme} />);
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it("uses dark theme dot color when inactive and theme.key === 'dark'", () => {
    const darkTheme = { ...theme, key: "dark" };
    const { UNSAFE_getAllByType } = render(
      <QuickTipsCarousel tips={tips} theme={darkTheme} />
    );

    const dots = UNSAFE_getAllByType(View).filter((v) => {
      const s = flatten(v.props.style);
      return s && s.width === 6 && s.height === 6 && s.borderRadius === 3;
    });

    // idx starts at 0, so dot[1] is inactive and should be #374151
    const inactive = flatten(dots[1].props.style);
    expect(inactive.backgroundColor).toBe("#374151");
  });
});
