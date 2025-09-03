import { render, fireEvent } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock Ionicons to a simple Text that preserves props ----
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: (p) => <Text {...p}>{p.name}</Text>,
  };
});

// ---- Mock i18n: t(key, defaultValue?) -> defaultValue (if string) or key ----
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, arg) => {
      if (typeof arg === "string" && arg) return arg; // t(key, "literal")
      return typeof arg?.defaultValue === "string" ? arg.defaultValue : key;
    },
  }),
}));

// ---- Mock ThemeProvider with ALL mutable state INSIDE factory ----
jest.mock("../../theme/ThemeProvider", () => {
  // internal mutable state, safe to use inside factory
  let mockThemeKey = "light";
  const mockSetThemeKey = jest.fn();

  const themeLight = {
    key: "light",
    colors: {
      card: "#ffffff",
      text: "#111111",
      subtext: "#666666",
      primary: "#0A84FF",
    },
  };
  const themeDark = {
    key: "dark",
    colors: {
      card: "#0b1220",
      text: "#e5e7eb",
      subtext: "#94a3b8",
      primary: "#60a5fa",
    },
  };

  return {
    useThemeContext: () => ({
      theme: mockThemeKey === "dark" ? themeDark : themeLight,
      themeKey: mockThemeKey,
      setThemeKey: mockSetThemeKey,
    }),

    // test helpers exported from the mock module itself (no outer refs!)
    __setThemeKeyForTest: (k) => {
      mockThemeKey = k;
    },
    __resetSetThemeSpy: () => mockSetThemeKey.mockClear(),
    __getSetThemeSpy: () => mockSetThemeKey,
  };
});
import {
  __setThemeKeyForTest,
  __resetSetThemeSpy,
  __getSetThemeSpy,
} from "../../theme/ThemeProvider";

// SUT
import ThemeToggle from "../../components/ThemeToggle";

// helpers
const flatten = (style) =>
  Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {};

describe("ThemeToggle", () => {
  beforeEach(() => {
    __setThemeKeyForTest("light");
    __resetSetThemeSpy();
    jest.clearAllMocks();
  });

  it("renders two buttons with labels and icons; reflects current theme selection (light)", () => {
    const { getByText, UNSAFE_getAllByType, toJSON } = render(<ThemeToggle />);

    // Labels present
    const lightLabel = getByText("Light");
    const darkLabel = getByText("Dark");
    expect(lightLabel).toBeTruthy();
    expect(darkLabel).toBeTruthy();

    // Icons present (mocked to Text showing the icon name)
    expect(getByText("sunny")).toBeTruthy();
    expect(getByText("moon")).toBeTruthy();

    // Two touchables
    const btns = UNSAFE_getAllByType(TouchableOpacity);
    expect(btns.length).toBe(2);

    // Active = light
    const lightBtnStyle = flatten(btns[0].props.style);
    expect(lightBtnStyle.backgroundColor).toBe("#0A84FF"); // active bg
    expect(flatten(lightLabel.props.style).color).toBe("#fff"); // active text color

    // Inactive = dark
    expect(flatten(darkLabel.props.style).color).toBe("#6B7280");

    // Container background (light)
    const root = toJSON();
    expect(flatten(root.props.style).backgroundColor).toBe("#F3F4F6");
  });

  it("reflects dark selection and colors when themeKey is 'dark'", () => {
    __setThemeKeyForTest("dark");
    const { getByText, UNSAFE_getAllByType, toJSON } = render(<ThemeToggle />);

    const btns = UNSAFE_getAllByType(TouchableOpacity);
    const darkLabel = getByText("Dark");
    const lightLabel = getByText("Light");

    // Active = dark
    expect(flatten(btns[1].props.style).backgroundColor).toBe("#0A84FF");
    expect(flatten(darkLabel.props.style).color).toBe("#fff");

    // Inactive = light
    expect(flatten(lightLabel.props.style).color).toBe("#6B7280");

    // Container background (dark)
    const root = toJSON();
    expect(flatten(root.props.style).backgroundColor).toBe("#2a2a2dff");
  });

  it("calls setThemeKey only when changing to a different theme (guards redundant writes)", () => {
    __setThemeKeyForTest("light");
    const setThemeKeyMock = __getSetThemeSpy();

    const { getByText, rerender } = render(<ThemeToggle />);

    // Tap Light again -> no call
    fireEvent.press(getByText("Light"));
    expect(setThemeKeyMock).not.toHaveBeenCalled();

    // Tap Dark -> 1 call with 'dark'
    fireEvent.press(getByText("Dark"));
    expect(setThemeKeyMock).toHaveBeenCalledTimes(1);
    expect(setThemeKeyMock).toHaveBeenCalledWith("dark");

    // Pretend ThemeProvider switched to dark; then tapping Dark again -> no new call
    __setThemeKeyForTest("dark");
    __resetSetThemeSpy();
    rerender(<ThemeToggle />);
    const setThemeKeyMock2 = __getSetThemeSpy();

    fireEvent.press(getByText("Dark"));
    expect(setThemeKeyMock2).not.toHaveBeenCalled();

    // Now tap Light -> 1 call with 'light'
    fireEvent.press(getByText("Light"));
    expect(setThemeKeyMock2).toHaveBeenCalledTimes(1);
    expect(setThemeKeyMock2).toHaveBeenCalledWith("light");
  });

  it("sets accessibilityRole='button' and correct accessibilityState.selected", () => {
    const { UNSAFE_getAllByType, rerender } = render(<ThemeToggle />);
    let btns = UNSAFE_getAllByType(TouchableOpacity);

    // role = button
    btns.forEach((b) => expect(b.props.accessibilityRole).toBe("button"));

    // light selected (default)
    expect(btns[0].props.accessibilityState).toEqual({ selected: true });
    expect(btns[1].props.accessibilityState).toEqual({ selected: false });

    // switch to dark and re-check
    __setThemeKeyForTest("dark");
    rerender(<ThemeToggle />);
    btns = UNSAFE_getAllByType(TouchableOpacity);
    expect(btns[0].props.accessibilityState).toEqual({ selected: false });
    expect(btns[1].props.accessibilityState).toEqual({ selected: true });
  });

  it("merges containerStyle on the wrapper (caller overrides)", () => {
    const override = { marginTop: 12, backgroundColor: "#eeeeee" };
    const { toJSON } = render(<ThemeToggle containerStyle={override} />);
    const root = toJSON();
    const s = flatten(root.props.style);
    expect(s.marginTop).toBe(12);
    // caller wins on bg color too
    expect(s.backgroundColor).toBe("#eeeeee");
  });
});
