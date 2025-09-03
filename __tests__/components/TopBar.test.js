import { render, fireEvent } from "@testing-library/react-native";
import { View, TouchableOpacity } from "react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock Ionicons to a simple Text that preserves props ----
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: (p) => <Text {...p}>{p.name}</Text>,
  };
});

// ---- Mock ThemeProvider with a simple theme ----
jest.mock("../../theme/ThemeProvider", () => {
  const theme = {
    key: "light",
    colors: {
      card: "#ffffff",
      text: "#111111",
      subtext: "#666666",
      primary: "#0A84FF",
    },
  };
  return { useThemeContext: () => ({ theme }) };
});

// SUT
import TopBar from "../../components/TopBar";

// helpers
const flatten = (style) =>
  Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {};

const findBackBtn = (UNSAFE_getAllByType) =>
  UNSAFE_getAllByType(TouchableOpacity).find((n) => flatten(n.props.style).left === 8);

const findRightBtn = (UNSAFE_getAllByType) =>
  UNSAFE_getAllByType(TouchableOpacity).find((n) => flatten(n.props.style).right === 8);

describe("TopBar", () => {
  it("renders back chevron, centered title (1 line), and optional right icon", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <TopBar title="Settings" onBack={() => {}} rightIcon="ellipsis-horizontal" />
    );

    // Back icon rendered (mocked as Text with its name)
    expect(getByText("chevron-back")).toBeTruthy();

    // Title text present, single line, and marked as header
    const titleNode = getByText("Settings");
    expect(titleNode).toBeTruthy();
    expect(titleNode.props.numberOfLines).toBe(1);
    expect(titleNode.props.accessibilityRole).toBe("header");

    // Right icon rendered (mock as text)
    expect(getByText("ellipsis-horizontal")).toBeTruthy();

    // Buttons exist: back (left:8) and right (right:8)
    expect(findBackBtn(UNSAFE_getAllByType)).toBeTruthy();
    expect(findRightBtn(UNSAFE_getAllByType)).toBeTruthy();
  });

  it("fires onBack and onRightPress when pressed", () => {
    const onBack = jest.fn();
    const onRightPress = jest.fn();

    const { UNSAFE_getAllByType } = render(
      <TopBar
        title="Edit Profile"
        onBack={onBack}
        rightIcon="create-outline"
        onRightPress={onRightPress}
      />
    );

    const backBtn = findBackBtn(UNSAFE_getAllByType);
    fireEvent.press(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);

    const rightBtn = findRightBtn(UNSAFE_getAllByType);
    fireEvent.press(rightBtn);
    expect(onRightPress).toHaveBeenCalledTimes(1);
  });

  it("applies theme color to icons and title text", () => {
    const { getByText } = render(
      <TopBar title="Themed" onBack={() => {}} rightIcon="star-outline" />
    );

    // Title color
    const titleNode = getByText("Themed");
    expect(flatten(titleNode.props.style).color).toBe("#111111");

    // Back icon and right icon inherit same color via props
    const backIcon = getByText("chevron-back");
    const rightIcon = getByText("star-outline");
    expect(backIcon.props.color).toBe("#111111");
    expect(rightIcon.props.color).toBe("#111111");
  });

  it("renders layout placeholder View when rightIcon is absent (keeps title centered)", () => {
    const { UNSAFE_getAllByType } = render(<TopBar title="No Right" onBack={() => {}} />);

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBe(1);
    const rightSizedViews = UNSAFE_getAllByType(View).filter((v) => {
      const s = flatten(v.props.style);
      return s && s.height === 36 && s.width === 36 && s.right === 8;
    });
    expect(rightSizedViews.length).toBeGreaterThan(0);
  });

  it("sets accessibilityRole='button' and includes a hitSlop on both buttons", () => {
    const { UNSAFE_getAllByType } = render(
      <TopBar
        title="A11y"
        onBack={() => {}}
        rightIcon="notifications-outline"
        onRightPress={() => {}}
      />
    );

    const backBtn = findBackBtn(UNSAFE_getAllByType);
    const rightBtn = findRightBtn(UNSAFE_getAllByType);

    expect(backBtn.props.accessibilityRole).toBe("button");
    expect(rightBtn.props.accessibilityRole).toBe("button");

    // hitSlop present (expanded touch targets)
    expect(backBtn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
    expect(rightBtn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
  });
});
