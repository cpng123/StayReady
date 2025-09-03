import { render, fireEvent, within } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock Ionicons (no-op Text) ----
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: () => React.createElement(Text, { testID: "ionicon" }, "icon"),
  };
});

// ---- Mock ThemeProvider with mutable theme + setter ----
jest.mock("../../theme/ThemeProvider", () => {
  // Keep theme state INSIDE the factory so Jest doesn’t complain
  let theme = {
    key: "light",
    colors: {
      card: "#ffffff",
      text: "#111111",
      subtext: "#666666",
      primary: "#007aff",
    },
  };

  return {
    useThemeContext: () => ({ theme }),
    // helper exposed for tests to flip themes
    __setTestTheme: (next) => {
      theme = next;
    },
  };
});
import { __setTestTheme } from "../../theme/ThemeProvider";

// Import after mocks
import ChecklistSectionCard from "../../components/ChecklistSectionCard";

// Helper: find a node in the rendered JSON tree by a style predicate
function findNodeByStyle(root, predicate) {
  if (!root) return null;
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    const style = n?.props?.style;
    // style can be array or object
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style || {};
    if (predicate(flat)) return n;
    const children = n?.children || [];
    for (const c of children) {
      if (c && typeof c === "object") stack.push(c);
    }
  }
  return null;
}

describe("ChecklistSectionCard", () => {
  beforeEach(() => {
    // reset to light theme each test
    __setTestTheme({
      key: "light",
      colors: {
        card: "#ffffff",
        text: "#111111",
        subtext: "#666666",
        primary: "#007aff",
      },
    });
  });

  it("renders title, computes percent, sets progress width, and toggles items", () => {
    const onToggle = jest.fn();
    const section = {
      id: "s1",
      title: "Essentials",
      color: "#ff0000",
      items: [
        { id: "i1", text: "Water (7.5L)", done: true },
        { id: "i2", text: "Torchlight", done: false },
        { id: "i3", text: "Whistle", done: true },
      ],
    };

    const { getByText, getByLabelText, toJSON } = render(
      <ChecklistSectionCard section={section} onToggle={onToggle} />
    );

    // header
    expect(getByText("Essentials")).toBeTruthy();
    // 2/3 → 66.666… → Math.round → 67%
    expect(getByText("67%")).toBeTruthy();

    // progress bar fill has width "67%" and section color
    const tree = toJSON();
    const fillNode = findNodeByStyle(tree, (s) => s && s.width === "67%");
    expect(fillNode).toBeTruthy();
    const fillStyle = Array.isArray(fillNode.props.style)
      ? Object.assign({}, ...fillNode.props.style.filter(Boolean))
      : fillNode.props.style;
    expect(fillStyle.backgroundColor).toBe("#ff0000");

    // rows have a11y labels; press toggles with ids
    const row1 = getByLabelText("Water (7.5L)");
    fireEvent.press(row1);
    expect(onToggle).toHaveBeenCalledWith("s1", "i1");

    const row2 = getByLabelText("Torchlight");
    fireEvent.press(row2);
    expect(onToggle).toHaveBeenCalledWith("s1", "i2");

    // Ionicon stub is present inside a row
    expect(within(row2).getByTestId("ionicon")).toBeTruthy();
  });

  it("sets accessibilityState.checked based on done flag", () => {
    const section = {
      id: "s2",
      title: "Go-bag",
      items: [
        { id: "a", text: "Mask", done: true },
        { id: "b", text: "Batteries", done: false },
      ],
    };

    const { getByLabelText } = render(
      <ChecklistSectionCard section={section} onToggle={() => {}} />
    );
    const doneRow = getByLabelText("Mask");
    const notDoneRow = getByLabelText("Batteries");
    expect(doneRow.props.accessibilityState).toMatchObject({ checked: true });
    expect(notDoneRow.props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("dark theme adjusts row background color", () => {
    // flip to dark theme
    __setTestTheme({
      key: "dark",
      colors: {
        card: "#1b1b1b",
        text: "#eeeeee",
        subtext: "#aaaaaa",
        primary: "#00a2ff",
      },
    });

    const section = {
      id: "s3",
      title: "Comms",
      items: [{ id: "x", text: "Powerbank", done: false }],
    };

    const { getByLabelText } = render(
      <ChecklistSectionCard section={section} onToggle={() => {}} />
    );
    const row = getByLabelText("Powerbank");
    // style is an array; flatten and check backgroundColor
    const flat = Array.isArray(row.props.style)
      ? Object.assign({}, ...row.props.style.filter(Boolean))
      : row.props.style;
    expect(flat.backgroundColor).toBe("#252424ff");
  });

  it("uses theme.primary when section.color is not provided", () => {
    const section = {
      id: "s4",
      title: "Medical",
      items: [
        { id: "m1", text: "Bandages", done: false },
        { id: "m2", text: "Antiseptic", done: false },
      ],
    };

    const { toJSON } = render(
      <ChecklistSectionCard section={section} onToggle={() => {}} />
    );

    // Fill bar should use theme.colors.primary and width is a percentage string
    const tree = toJSON();
    const fillNode = findNodeByStyle(
      tree,
      (s) => s && s.height === "100%" && s.borderRadius === 999
    );
    expect(fillNode).toBeTruthy();

    const style = Array.isArray(fillNode.props.style)
      ? Object.assign({}, ...fillNode.props.style.filter(Boolean))
      : fillNode.props.style;

    expect(style.backgroundColor).toBe("#007aff");
    expect(typeof style.width).toBe("string");
    expect(style.width.endsWith("%")).toBe(true);
  });
});
