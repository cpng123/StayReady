import { StyleSheet } from "react-native";
import renderer from "react-test-renderer";
import { render, fireEvent } from "@testing-library/react-native";
import BadgeCard from "../../components/BadgeCard";

const THEME_LIGHT = {
  key: "light",
  colors: {
    card: "#ffffff",
    text: "#111111",
    subtext: "#777777",
    primary: "#0EA5E9",
  },
};

const THEME_DARK = {
  key: "dark",
  colors: {
    card: "#0b0f19",
    text: "#F9FAFB",
    subtext: "#9CA3AF",
    primary: "#22C55E",
  },
};

// Helper to walk the react-test-renderer JSON and collect nodes by predicate
function findNodes(node, pred, out = []) {
  if (!node) return out;
  if (pred(node)) out.push(node);
  const kids = node.children || [];
  for (const k of kids) {
    if (typeof k === "object") findNodes(k, pred, out);
  }
  return out;
}

// Flatten RN style arrays/objects for easy assertions
const flat = (s) => StyleSheet.flatten(s) || {};

describe("BadgeCard", () => {
  const baseItem = {
    id: "quiz-5",
    title: "Knowledge Seeker",
    desc: "Complete 5 quizzes",
    icon: 1,
    progress: 60,
    achieved: false,
  };

  test("renders title and description, sets accessibility, and handles press", () => {
    const onPress = jest.fn();
    const { getByText, getByTestId, getByLabelText } = render(
      <BadgeCard item={baseItem} theme={THEME_LIGHT} onPress={onPress} />
    );

    // text content
    expect(getByText("Knowledge Seeker")).toBeTruthy();
    expect(getByText("Complete 5 quizzes")).toBeTruthy();
    expect(getByText("60%")).toBeTruthy();

    // a11y + press
    const btn = getByLabelText("Knowledge Seeker badge");
    fireEvent.press(btn);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(expect.objectContaining({ id: "quiz-5" }));
  });

  test("locked badge dims the icon (opacity=0.5)", () => {
    const tree = renderer
      .create(<BadgeCard item={baseItem} theme={THEME_LIGHT} />)
      .toJSON();

    const images = findNodes(tree, (n) => n.type === "Image");
    expect(images.length).toBe(1);
    const style = flat(images[0].props.style);
    expect(style.opacity).toBe(0.5); // lockedImg applied
  });

  test("unlocked badge does not dim icon and uses primary color on progress fill", () => {
    const item = { ...baseItem, achieved: true, progress: 85 };
    const tree = renderer
      .create(<BadgeCard item={item} theme={THEME_DARK} />)
      .toJSON();

    // icon NOT dimmed
    const images = findNodes(tree, (n) => n.type === "Image");
    const iconStyle = flat(images[0].props.style);
    expect(iconStyle.opacity).toBeUndefined();

    // progress fill: width `${progress}%` and primary color when achieved=true
    const fills = findNodes(
      tree,
      (n) => n.type === "View" && n.props && flat(n.props.style).height === "100%"
    );
    // We expect exactly one fill bar with width 85%
    const fill = fills.find((n) => flat(n.props.style).width === "85%");
    expect(fill).toBeTruthy();
    const fillStyle = flat(fill.props.style);
    expect(fillStyle.backgroundColor).toBe(THEME_DARK.colors.primary);
  });

  test("progress fill uses blue when locked and track color follows theme (light)", () => {
    const item = { ...baseItem, achieved: false, progress: 40 };
    const tree = renderer
      .create(<BadgeCard item={item} theme={THEME_LIGHT} />)
      .toJSON();

    // track: height=6, overflow hidden; light theme -> #E5E7EB
    const tracks = findNodes(
      tree,
      (n) => n.type === "View" && flat(n.props.style).height === 6 && flat(n.props.style).overflow === "hidden"
    );
    expect(tracks.length).toBe(1);
    const trackStyle = flat(tracks[0].props.style);
    expect(trackStyle.backgroundColor).toBe("#E5E7EB");

    // fill: width "40%" and locked color "#60A5FA"
    const fills = findNodes(
      tree,
      (n) => n.type === "View" && n.props && flat(n.props.style).height === "100%"
    );
    const fill = fills.find((n) => flat(n.props.style).width === "40%");
    expect(fill).toBeTruthy();
    expect(flat(fill.props.style).backgroundColor).toBe("#60A5FA");
  });

  test("track color follows theme (dark)", () => {
    const item = { ...baseItem, achieved: false, progress: 10 };
    const tree = renderer
      .create(<BadgeCard item={item} theme={THEME_DARK} />)
      .toJSON();

    const tracks = findNodes(
      tree,
      (n) => n.type === "View" && flat(n.props.style).height === 6 && flat(n.props.style).overflow === "hidden"
    );
    expect(tracks.length).toBe(1);
    expect(flat(tracks[0].props.style).backgroundColor).toBe("#2A2F3A");
  });
});
