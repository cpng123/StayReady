import { render } from "@testing-library/react-native";
import { View, Text, Image } from "react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock i18n: t(key, defaultValue) -> defaultValue ----
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, arg) => {
      if (typeof arg === "string" && arg) return arg; // t(key, "literal")
      if (arg && typeof arg === "object") return arg.defaultValue ?? key;
      return key;
    },
  }),
}));

// SUT
import RewardCard from "../../components/RewardCard";

// Helper to flatten style arrays
const flatten = (style) =>
  Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {};

const lightTheme = {
  key: "light",
  colors: {
    card: "#ffffff",
    text: "#111111",
    subtext: "#666666",
    primary: "#0A84FF",
  },
};

const darkTheme = {
  key: "dark",
  colors: {
    card: "#0b1220",
    text: "#e5e7eb",
    subtext: "#94a3b8",
    primary: "#60a5fa",
  },
};

const item = {
  title: "Reusable Water Bottle",
  desc: "Durable stainless steel bottle to reduce plastic waste.",
  points: 250,
  image: 1, // any truthy source id for RN Image
};

describe("RewardCard", () => {
  it("renders image, title (1 line), 2-line desc, and localized points suffix", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <RewardCard item={item} theme={lightTheme} />
    );

    // Title & description
    const titleNode = getByText(item.title);
    expect(titleNode).toBeTruthy();
    expect(titleNode.props.numberOfLines).toBe(1);

    const descNode = getByText(item.desc);
    expect(descNode).toBeTruthy();
    expect(descNode.props.numberOfLines).toBe(2);

    // Points with i18n suffix default ("points")
    expect(getByText("250 points")).toBeTruthy();

    // Image rendered inside left wrapper
    const images = UNSAFE_getAllByType(Image);
    expect(images.length).toBeGreaterThan(0);

    // Basic size/layout checks:
    // Card height = 86, left image wrapper width = 96
    const views = UNSAFE_getAllByType(View);
    const card = views.find((v) => flatten(v.props.style).height === 86);
    expect(card).toBeTruthy();

    const imgWrap = views.find((v) => flatten(v.props.style).width === 96);
    expect(imgWrap).toBeTruthy();

    // img styles cover full area
    const imgStyle = flatten(images[0].props.style);
    expect(imgStyle.width).toBe("100%");
    expect(imgStyle.height).toBe("100%");
    expect(imgStyle.resizeMode).toBe("cover");
  });

  it("applies theme colors for surface, text/subtext, and points (light)", () => {
    const { getByText, toJSON } = render(
      <RewardCard item={item} theme={lightTheme} />
    );

    // Root card background
    const tree = toJSON();
    const rootStyle = flatten(tree.props.style);
    expect(rootStyle.backgroundColor).toBe(lightTheme.colors.card);

    // Title / desc / points colors
    expect(flatten(getByText(item.title).props.style).color).toBe(
      lightTheme.colors.text
    );
    expect(flatten(getByText(item.desc).props.style).color).toBe(
      lightTheme.colors.subtext
    );
    expect(flatten(getByText("250 points").props.style).color).toBe(
      lightTheme.colors.primary
    );
  });

  it("applies theme colors for surface, text/subtext, and points (dark)", () => {
    const { getByText, toJSON } = render(
      <RewardCard item={item} theme={darkTheme} />
    );

    const root = toJSON();
    expect(flatten(root.props.style).backgroundColor).toBe(
      darkTheme.colors.card
    );
    expect(flatten(getByText(item.title).props.style).color).toBe(
      darkTheme.colors.text
    );
    expect(flatten(getByText(item.desc).props.style).color).toBe(
      darkTheme.colors.subtext
    );
    expect(flatten(getByText("250 points").props.style).color).toBe(
      darkTheme.colors.primary
    );
  });

  it("keeps layout structure: right column flex=1 with padding", () => {
    const { UNSAFE_getAllByType } = render(
      <RewardCard item={item} theme={lightTheme} />
    );

    const views = UNSAFE_getAllByType(View);
    const rightCol = views.find((v) => {
      const s = flatten(v.props.style);
      return s && s.flex === 1 && s.paddingHorizontal === 12 && s.paddingVertical === 10;
    });
    expect(rightCol).toBeTruthy();
  });
});
