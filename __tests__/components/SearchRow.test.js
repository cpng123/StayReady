import { render, fireEvent } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock Ionicons to a simple Text that preserves props ----
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: (p) => <Text {...p}>{p.name}</Text>,
  };
});

// ---- Mock i18n: t(key, opts) -> return second arg if string literal, else key ----
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, arg) => {
      if (typeof arg === "string" && arg) return arg; // t(key, "literal")
      // For objects (like { ns: "common" }) we don't have defaultValue here, so keep key
      return key;
    },
  }),
}));

// ---- Mock ThemeProvider with internal, mutable theme ----
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
import SearchRow from "../../components/SearchRow";

// helpers
const flatten = (style) =>
  Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {};

describe("SearchRow", () => {
  beforeEach(() => {
    // reset to light theme each test
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

  it("renders a TextInput with (localized) placeholder and value; emits onChangeText", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <SearchRow value="abc" onChangeText={onChangeText} />
    );

    // Default placeholder from i18n mock returns the key itself
    const input = getByPlaceholderText("common.search");
    expect(input).toBeTruthy();
    expect(input.props.value).toBe("abc");
    expect(input.props.returnKeyType).toBe("search");

    fireEvent.changeText(input, "hello");
    expect(onChangeText).toHaveBeenCalledTimes(1);
    expect(onChangeText).toHaveBeenCalledWith("hello");
  });

  it("respects explicit placeholder prop", () => {
    const { getByPlaceholderText } = render(
      <SearchRow value="" onChangeText={() => {}} placeholder="Search tips…" />
    );
    expect(getByPlaceholderText("Search tips…")).toBeTruthy();
  });

  it("shows the sort toggle by default and calls onSortToggle when pressed", () => {
    const onSortToggle = jest.fn();
    const { getByText } = render(
      <SearchRow value="" onChangeText={() => {}} onSortToggle={onSortToggle} />
    );

    // Icons are mocked to Text nodes with their 'name'
    const sortIcon = getByText("swap-vertical");
    expect(sortIcon).toBeTruthy();

    fireEvent.press(sortIcon);
    expect(onSortToggle).toHaveBeenCalledTimes(1);
  });

  it("hides the sort toggle when showSort={false}", () => {
    const { queryByText } = render(
      <SearchRow value="" onChangeText={() => {}} showSort={false} />
    );
    expect(queryByText("swap-vertical")).toBeNull();
  });

  it("applies light theme colors for container, icons, placeholder, and input text", () => {
    const { getByText, getByPlaceholderText, toJSON } = render(
      <SearchRow value="" onChangeText={() => {}} />
    );

    // Container colors
    const root = toJSON();
    const rowStyle = flatten(root.props.style);
    expect(rowStyle.backgroundColor).toBe("#F2F4F7");
    expect(rowStyle.borderColor).toBe("#E5E7EB");

    // Search icon (#6B7280 when light)
    const searchIcon = getByText("search");
    expect(searchIcon.props.color).toBe("#6B7280");

    // Sort icon color (#374151 when light)
    const sortIcon = getByText("swap-vertical");
    expect(sortIcon.props.color).toBe("#374151");

    // Placeholder + input text color
    const input = getByPlaceholderText("common.search");
    expect(input.props.placeholderTextColor).toBe("#6B7280");
    expect(flatten(input.props.style).color).toBe("#111111"); // theme.colors.text
  });

  it("applies dark theme colors for container, icons, placeholder, and input text", () => {
    __setTestTheme({
      key: "dark",
      colors: {
        card: "#0b1220",
        text: "#e5e7eb",
        subtext: "#94a3b8",
        primary: "#60a5fa",
      },
    });

    const { getByText, getByPlaceholderText, toJSON } = render(
      <SearchRow value="" onChangeText={() => {}} />
    );

    const root = toJSON();
    const rowStyle = flatten(root.props.style);
    expect(rowStyle.backgroundColor).toBe("#101316");
    expect(rowStyle.borderColor).toBe("#1F2937");

    const searchIcon = getByText("search");
    expect(searchIcon.props.color).toBe("#9CA3AF");

    const sortIcon = getByText("swap-vertical");
    expect(sortIcon.props.color).toBe("#E5E7EB");

    const input = getByPlaceholderText("common.search");
    expect(input.props.placeholderTextColor).toBe("#9CA3AF");
    expect(flatten(input.props.style).color).toBe("#e5e7eb");
  });
});
