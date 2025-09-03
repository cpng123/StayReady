import { render, fireEvent } from "@testing-library/react-native";
import { Image } from "react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock Ionicons to a simple Text that preserves props ----
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: (p) => <Text {...p}>{p.name}</Text>,
  };
});

// ---- Mock i18n: t(key, { count, defaultValue }) -> interpolate {{count}} ----
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, arg) => {
      if (typeof arg === "string" && arg) return arg; // t(key, "literal")
      if (arg && typeof arg === "object") {
        const dv = arg.defaultValue ?? key;
        if (typeof dv === "string" && dv.includes("{{count}}")) {
          return dv.replace("{{count}}", String(arg.count ?? ""));
        }
        return dv;
      }
      return key; // fallback
    },
  }),
}));

// ---- Mock ThemeProvider with a simple light theme ----
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
import QuizSetCard from "../../components/QuizSetCard";

// Helper to flatten style arrays
const flatten = (style) =>
  Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {};

describe("QuizSetCard", () => {
  const theme = {
    key: "light",
    colors: {
      card: "#ffffff",
      text: "#111111",
      subtext: "#666666",
      primary: "#0A84FF",
    },
  };

  it("renders title, localized question count, and optional thumbnail", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <QuizSetCard title="Preparedness Basics" questionsCount={12} thumbnail={1} onPress={() => {}} />
    );

    expect(getByText("Preparedness Basics")).toBeTruthy();
    // Interpolated defaultValue: "{{count}} Questions" -> "12 Questions"
    expect(getByText("12 Questions")).toBeTruthy();

    // Thumbnail rendered when provided
    const images = UNSAFE_getAllByType(Image);
    expect(images.length).toBeGreaterThan(0);
    const imgStyle = flatten(images[0].props.style);
    expect(imgStyle.height).toBe(66);
    expect(imgStyle.width).toBe("100%");
  });

  it("triggers onPress from both the card and the play button", () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <QuizSetCard title="First Aid" questionsCount={5} onPress={onPress} />
    );

    // Card press (outer touchable has label = title)
    fireEvent.press(getByLabelText("First Aid"));
    // Play button press (inner touchable has label = t('games.play', 'Play'))
    fireEvent.press(getByLabelText("Play"));

    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("applies theme colors: card bg, title/subtext colors, and play button bg", () => {
    const { getByLabelText, getByText } = render(
      <QuizSetCard title="SG Weather" questionsCount={3} onPress={() => {}} />
    );

    // Root card (label = title)
    const card = getByLabelText("SG Weather");
    const cardStyle = flatten(card.props.style);
    expect(cardStyle.backgroundColor).toBe(theme.colors.card);

    // Title text color
    const titleNode = getByText("SG Weather");
    expect(flatten(titleNode.props.style).color).toBe(theme.colors.text);

    // Count text color
    const countNode = getByText("3 Questions");
    expect(flatten(countNode.props.style).color).toBe(theme.colors.subtext);

    // Play button bg (label = "Play")
    const playBtn = getByLabelText("Play");
    const playStyle = flatten(playBtn.props.style);
    expect(playStyle.backgroundColor).toBe(theme.colors.primary);
  });

  it("merges external style overrides on the card, caller wins", () => {
    const override = { elevation: 9, backgroundColor: "#eeeeee", marginTop: 7 };
    const { getByLabelText } = render(
      <QuizSetCard title="Overridden" questionsCount={2} onPress={() => {}} style={override} />
    );

    const card = getByLabelText("Overridden");
    const s = flatten(card.props.style);

    // Caller overrides theme card color + adds elevation/marginTop
    expect(s.backgroundColor).toBe("#eeeeee");
    expect(s.elevation).toBe(9);
    expect(s.marginTop).toBe(7);
  });

  it("sets accessibilityRole='button' on both the card and play button", () => {
    const { getByLabelText } = render(
      <QuizSetCard title="A11y Test" questionsCount={1} onPress={() => {}} />
    );
    expect(getByLabelText("A11y Test").props.accessibilityRole).toBe("button");
    expect(getByLabelText("Play").props.accessibilityRole).toBe("button");
  });

  it("renders without thumbnail when none provided", () => {
    const { UNSAFE_queryAllByType } = render(
      <QuizSetCard title="No Image" questionsCount={4} onPress={() => {}} />
    );
    const images = UNSAFE_queryAllByType(Image);
    expect(images.length).toBe(0);
  });
});
