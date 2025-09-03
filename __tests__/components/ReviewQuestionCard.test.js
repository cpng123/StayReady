import { render, fireEvent } from "@testing-library/react-native";
import { View, Text } from "react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock Ionicons to a simple Text that preserves props (name/color/size) ----
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: (p) => <Text {...p}>{p.name}</Text>,
  };
});

// ---- Mock ThemeProvider (light theme) ----
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
import ReviewQuestionCard from "../../components/ReviewQuestionCard";

// helpers
const flatten = (style) =>
  Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {};

const GREEN = "#16A34A";
const RED = "#DC2626";
const BLUE = "#2563EB";

describe("ReviewQuestionCard", () => {
  const baseProps = {
    index: 2,
    total: 5,
    text: "What is the color of the sky?",
    options: ["Green", "Blue", "Red", "Yellow"],
    answerIndex: 1, // "Blue"
  };

  it("renders index/total, question text, and correct answer line when answered correctly", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <ReviewQuestionCard {...baseProps} selectedIndex={1} />
    );

    // index/total
    expect(getByText("#3/5")).toBeTruthy();

    // question text
    expect(getByText("What is the color of the sky?")).toBeTruthy();

    // one green answer line with the chosen (correct) option
    const greenLines = UNSAFE_getAllByType(Text).filter((n) => {
      const s = flatten(n.props.style);
      return s && s.fontWeight === "800" && s.color === GREEN;
    });
    expect(greenLines.map((n) => n.props.children)).toContain("Blue");
  });

  it("renders wrong state: shows selected in red and correct in green", () => {
    const { UNSAFE_getAllByType } = render(
      <ReviewQuestionCard {...baseProps} selectedIndex={2} />
    ); // picked "Red" (wrong)

    const redLines = UNSAFE_getAllByType(Text).filter((n) => {
      const s = flatten(n.props.style);
      return s && s.fontWeight === "800" && s.color === RED;
    });
    expect(redLines.map((n) => n.props.children)).toContain("Red");

    const greenLines = UNSAFE_getAllByType(Text).filter((n) => {
      const s = flatten(n.props.style);
      return s && s.fontWeight === "800" && s.color === GREEN;
    });
    expect(greenLines.map((n) => n.props.children)).toContain("Blue");
  });

  it("renders times-up state: message + correct answer in blue", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <ReviewQuestionCard {...baseProps} timesUp selectedIndex={undefined} />
    );

    expect(getByText("Time's up, no answer selected")).toBeTruthy();

    const blueLines = UNSAFE_getAllByType(Text).filter((n) => {
      const s = flatten(n.props.style);
      return s && s.fontWeight === "800" && s.color === BLUE;
    });
    expect(blueLines.map((n) => n.props.children)).toContain("Blue");
  });

  it("colors the left stripe by outcome: correct=green, wrong=red, timesUp=blue, default=theme.primary", () => {
    // find stripe: absolute View with width 8
    const getStripeColor = (nodeTree) => {
      const stripe = nodeTree.UNSAFE_getAllByType(View).find((v) => {
        const s = flatten(v.props.style);
        return s && s.position === "absolute" && s.width === 8 && s.left === 0;
      });
      return flatten(stripe.props.style).backgroundColor;
    };

    // correct
    let tree = render(<ReviewQuestionCard {...baseProps} selectedIndex={1} />);
    expect(getStripeColor(tree)).toBe(GREEN);

    // wrong
    tree.unmount();
    tree = render(<ReviewQuestionCard {...baseProps} selectedIndex={3} />);
    expect(getStripeColor(tree)).toBe(RED);

    // times up
    tree.unmount();
    tree = render(
      <ReviewQuestionCard {...baseProps} selectedIndex={undefined} timesUp />
    );
    expect(getStripeColor(tree)).toBe(BLUE);

    // default (no answer, no timesUp) -> theme primary
    tree.unmount();
    tree = render(
      <ReviewQuestionCard {...baseProps} selectedIndex={undefined} timesUp={false} />
    );
    expect(getStripeColor(tree)).toBe("#0A84FF");
  });

  it("action icon: bookmark resolves outline vs filled and toggles color by active state", () => {
    const { getByText, getByLabelText, rerender } = render(
      <ReviewQuestionCard {...baseProps} actionIcon="bookmark" actionActive={false} />
    );

    // outline when inactive
    const icon1 = getByText("bookmark-outline");
    expect(icon1).toBeTruthy();
    // idle color uses theme.subtext (#666666)
    expect(icon1.props.color).toBe("#666666");

    // a11y label for inactive bookmark is "Add bookmark"
    expect(getByLabelText("Add bookmark")).toBeTruthy();

    // active -> filled and red color
    rerender(
      <ReviewQuestionCard {...baseProps} actionIcon="bookmark" actionActive />
    );
    const icon2 = getByText("bookmark");
    expect(icon2).toBeTruthy();
    expect(icon2.props.color).toBe(RED);

    // a11y label for active bookmark is "Remove bookmark"
    expect(getByLabelText("Remove bookmark")).toBeTruthy();
  });

  it("action icon: trash-outline uses red idle color and 'Remove' label; custom overrides work", () => {
    const { getByText, getByLabelText, rerender } = render(
      <ReviewQuestionCard {...baseProps} actionIcon="trash-outline" />
    );

    const trashIcon = getByText("trash-outline");
    expect(trashIcon.props.color).toBe(RED);
    expect(getByLabelText("Remove")).toBeTruthy();

    // Override idle color
    rerender(
      <ReviewQuestionCard
        {...baseProps}
        actionIcon="trash-outline"
        actionIconColor="#ff00ff"
      />
    );
    expect(getByText("trash-outline").props.color).toBe("#ff00ff");

    // Active color override (for bookmark or other active-able icons)
    rerender(
      <ReviewQuestionCard
        {...baseProps}
        actionIcon="bookmark"
        actionActive
        actionActiveColor="#33cc33"
      />
    );
    expect(getByText("bookmark").props.color).toBe("#33cc33");
  });

  it("fires onActionPress when the top-right action is pressed", () => {
    const onActionPress = jest.fn();
    const { getByLabelText } = render(
      <ReviewQuestionCard
        {...baseProps}
        actionIcon="bookmark"
        onActionPress={onActionPress}
      />
    );

    fireEvent.press(getByLabelText("Add bookmark"));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });
});
