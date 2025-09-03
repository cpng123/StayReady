import { render, fireEvent } from "@testing-library/react-native";
import { View, TouchableOpacity } from "react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock ThemeProvider with mutable theme ----
jest.mock("../../theme/ThemeProvider", () => {
  let theme = {
    key: "light",
    colors: {
      card: "#ffffff",
      text: "#111111",
      subtext: "#666666",
      primary: "#0A84FF",
    },
  };
  return {
    useThemeContext: () => ({ theme }),
    __setTestTheme: (next) => {
      theme = next;
    },
  };
});
import { __setTestTheme } from "../../theme/ThemeProvider";

// SUT
import SegmentToggle from "../../components/SegmentToggle";

// helpers
const flatten = (style) =>
  Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {};

const options = [
  { id: "recent", label: "Recent" },
  { id: "popular", label: "Popular" },
  { id: "saved", label: "Saved", icon: <View testID="icon-dot" /> },
];

describe("SegmentToggle", () => {
  beforeEach(() => {
    __setTestTheme({
      key: "light",
      colors: {
        card: "#ffffff",
        text: "#111111",
        subtext: "#666666",
        primary: "#0A84FF",
      },
    });
    jest.clearAllMocks();
  });

  it("renders all options and highlights the active one with theme primary bg + white label", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <SegmentToggle options={options} value="popular" onChange={() => {}} />
    );

    // Ensure labels exist
    expect(getByText("Recent")).toBeTruthy();
    expect(getByText("Popular")).toBeTruthy();
    expect(getByText("Saved")).toBeTruthy();

    // Grab touchables (each option is a TouchableOpacity)
    const btns = UNSAFE_getAllByType(TouchableOpacity);
    expect(btns.length).toBe(options.length);

    // active button: "popular"
    const activeBtn = btns[1];
    const activeStyle = flatten(activeBtn.props.style);
    expect(activeStyle.backgroundColor).toBe("#0A84FF"); // theme.colors.primary
    const popularLabel = getByText("Popular");
    expect(flatten(popularLabel.props.style).color).toBe("#fff");

    // inactive buttons have transparent bg and subtext color
    const inactive1Style = flatten(btns[0].props.style);
    expect(inactive1Style.backgroundColor).toBe("transparent");
    expect(flatten(getByText("Recent").props.style).color).toBe("#666666");

    const inactive2Style = flatten(btns[2].props.style);
    expect(inactive2Style.backgroundColor).toBe("transparent");
    expect(flatten(getByText("Saved").props.style).color).toBe("#666666");
  });

  it("emits onChange(id) when an option is tapped", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <SegmentToggle options={options} value="recent" onChange={onChange} />
    );

    fireEvent.press(getByText("Saved"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("saved");

    fireEvent.press(getByText("Popular"));
    expect(onChange).toHaveBeenCalledWith("popular");
  });

  it("sets accessibilityRole='button' and accessibilityState.selected for active option", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <SegmentToggle options={options} value="saved" onChange={() => {}} />
    );
    const btns = UNSAFE_getAllByType(TouchableOpacity);

    // role
    btns.forEach((b) => {
      expect(b.props.accessibilityRole).toBe("button");
    });

    // selected state
    const savedBtn = btns[2];
    expect(savedBtn.props.accessibilityState).toEqual({ selected: true });

    const recentBtn = btns[0];
    const popularBtn = btns[1];
    expect(recentBtn.props.accessibilityState).toEqual({ selected: false });
    expect(popularBtn.props.accessibilityState).toEqual({ selected: false });
  });

  it("renders optional leading icon when provided", () => {
    const { getByTestId } = render(
      <SegmentToggle options={options} value="recent" onChange={() => {}} />
    );
    expect(getByTestId("icon-dot")).toBeTruthy();
  });

  it("container background adapts to theme: light vs dark", () => {
    // light
    const { toJSON, unmount } = render(
      <SegmentToggle options={options} value="recent" onChange={() => {}} />
    );
    let root = toJSON();
    let wrapStyle = flatten(root.props.style);
    expect(wrapStyle.backgroundColor).toBe("#e0e1e4ff");

    // dark
    unmount();
    __setTestTheme({
      key: "dark",
      colors: {
        card: "#0b1220",
        text: "#e5e7eb",
        subtext: "#94a3b8",
        primary: "#60a5fa",
      },
    });
    const { toJSON: toJSON2 } = render(
      <SegmentToggle options={options} value="recent" onChange={() => {}} />
    );
    root = toJSON2();
    wrapStyle = flatten(root.props.style);
    expect(wrapStyle.backgroundColor).toBe("#2a2a2dff");
  });

  it("evenly distributes options (each button flex=1)", () => {
    const { UNSAFE_getAllByType } = render(
      <SegmentToggle options={options} value="recent" onChange={() => {}} />
    );
    const btns = UNSAFE_getAllByType(TouchableOpacity);
    btns.forEach((b) => {
      expect(flatten(b.props.style).flex).toBe(1);
    });
  });
});
