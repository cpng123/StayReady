import { TouchableOpacity, Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock FlatList to render all items synchronously ----
jest.mock("react-native/Libraries/Lists/FlatList", () => {
  const { View } = require("react-native");
  return ({ data = [], renderItem, ...rest }) => (
    <View {...rest}>
      {data.map((item, index) => (
        <View key={item?.id ?? index}>{renderItem({ item, index })}</View>
      ))}
    </View>
  );
});

// ---- Mock ThemeProvider with internal, mutable theme ----
jest.mock("../../theme/ThemeProvider", () => {
  let theme = {
    key: "light",
    colors: {
      primary: "#0A84FF",
      text: "#111111",
      card: "#FFFFFF",
      subtext: "#666666",
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

// Import after mocks
import FilterChips from "../../components/FilterChips";

const OPTIONS = [
  { id: "all", label: "All" },
  { id: "correct", label: "Correct" },
  { id: "incorrect", label: "Incorrect" },
];

describe("FilterChips", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __setTestTheme({
      key: "light",
      colors: {
        primary: "#0A84FF",
        text: "#111111",
        card: "#FFFFFF",
        subtext: "#666666",
      },
    });
  });

  it("renders all chips with labels", () => {
    const { getByText } = render(
      <FilterChips options={OPTIONS} activeId="all" onChange={() => {}} />
    );

    expect(getByText("All")).toBeTruthy();
    expect(getByText("Correct")).toBeTruthy();
    expect(getByText("Incorrect")).toBeTruthy();
  });

  it("marks the active chip with primary background and white text (light theme)", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <FilterChips options={OPTIONS} activeId="correct" onChange={() => {}} />
    );

    // Find all touchables (chips)
    const chips = UNSAFE_getAllByType(TouchableOpacity);

    // Locate the 'Correct' chip
    const correctText = getByText("Correct");
    const correctChip = chips.find(
      (c) => c.props.children?.props?.children === "Correct"
    );

    // Background should be theme.colors.primary
    const flatStyle = Array.isArray(correctChip.props.style)
      ? Object.assign({}, ...correctChip.props.style.filter(Boolean))
      : correctChip.props.style;
    expect(flatStyle.backgroundColor).toBe("#0A84FF");

    // Text should be white when active
    const textStyle = Array.isArray(correctText.props.style)
      ? Object.assign({}, ...correctText.props.style.filter(Boolean))
      : correctText.props.style;
    expect(textStyle.color).toBe("#fff");
  });

  it("renders inactive chips with light theme background and text color", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <FilterChips options={OPTIONS} activeId="all" onChange={() => {}} />
    );

    // 'Incorrect' should be inactive
    const chips = UNSAFE_getAllByType(TouchableOpacity);
    const incorrectChip = chips.find(
      (c) => c.props.children?.props?.children === "Incorrect"
    );
    const incorrectText = getByText("Incorrect");

    const flatStyle = Array.isArray(incorrectChip.props.style)
      ? Object.assign({}, ...incorrectChip.props.style.filter(Boolean))
      : incorrectChip.props.style;
    // Inactive light bg = #EAECEF
    expect(flatStyle.backgroundColor).toBe("#EAECEF");

    const textStyle = Array.isArray(incorrectText.props.style)
      ? Object.assign({}, ...incorrectText.props.style.filter(Boolean))
      : incorrectText.props.style;
    // Inactive text = theme.colors.text
    expect(textStyle.color).toBe("#111111");
  });

  it("uses dark inactive background when theme is dark", () => {
    __setTestTheme({
      key: "dark",
      colors: {
        primary: "#5E9EFF",
        text: "#FFFFFF",
        card: "#0B0B0B",
        subtext: "#A0A0A0",
      },
    });

    const { UNSAFE_getAllByType } = render(
      <FilterChips options={OPTIONS} activeId="all" onChange={() => {}} />
    );

    const chips = UNSAFE_getAllByType(TouchableOpacity);
    // Pick any inactive chip, e.g. 'correct'
    const inactive = chips.find(
      (c) => c.props.children?.props?.children === "Correct"
    );

    const flatStyle = Array.isArray(inactive.props.style)
      ? Object.assign({}, ...inactive.props.style.filter(Boolean))
      : inactive.props.style;
    // Inactive dark bg = #1F2937
    expect(flatStyle.backgroundColor).toBe("#1F2937");
  });

  it("invokes onChange with the chip id when pressed", () => {
    const onChange = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <FilterChips options={OPTIONS} activeId="all" onChange={onChange} />
    );

    const chips = UNSAFE_getAllByType(TouchableOpacity);
    // Press the 'Incorrect' chip
    const incorrectChip = chips.find(
      (c) => c.props.children?.props?.children === "Incorrect"
    );
    fireEvent.press(incorrectChip);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("incorrect");
  });

  it("sets accessibility role, label, and selected state correctly", () => {
    const { UNSAFE_getAllByType } = render(
      <FilterChips options={OPTIONS} activeId="correct" onChange={() => {}} />
    );

    const chips = UNSAFE_getAllByType(TouchableOpacity);

    const allChip = chips.find(
      (c) => c.props.children?.props?.children === "All"
    );
    const correctChip = chips.find(
      (c) => c.props.children?.props?.children === "Correct"
    );

    expect(allChip.props.accessibilityRole).toBe("button");
    expect(allChip.props.accessibilityLabel).toBe("All");
    expect(allChip.props.accessibilityState).toEqual({ selected: false });

    expect(correctChip.props.accessibilityRole).toBe("button");
    expect(correctChip.props.accessibilityLabel).toBe("Correct");
    expect(correctChip.props.accessibilityState).toEqual({ selected: true });
  });

  it("renders gracefully with an empty options array", () => {
    const { toJSON } = render(
      <FilterChips options={[]} activeId={null} onChange={() => {}} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it("FlatList is horizontal and hides the scroll indicator", () => {
    const FlatListMock = require("react-native/Libraries/Lists/FlatList");
    const tree = render(
      <FilterChips options={OPTIONS} activeId="all" onChange={() => {}} />
    );

    const FlatListInstances = tree.UNSAFE_getAllByType(FlatListMock);
    expect(FlatListInstances.length).toBe(1);

    const props = FlatListInstances[0].props;
    expect(props.horizontal).toBe(true);
    expect(props.showsHorizontalScrollIndicator).toBe(false);
    expect(props.contentContainerStyle).toEqual({ paddingHorizontal: 16 });
  });
});
