import { TouchableOpacity, Image } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock LinearGradient from expo ----
jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  const LinearGradient = ({ children, ...props }) => (
    <View testID="LinearGradient" {...props}>
      {children}
    </View>
  );
  return { LinearGradient };
});

// Component under test
import ImageOverlayCard from "../../components/ImageOverlayCard";

// Helper to flatten RN style arrays
const flattenStyle = (style) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style || {};

describe("ImageOverlayCard", () => {
  const defaultProps = {
    title: "Test Title",
    source: { uri: "https://example.com/image.jpg" },
  };

  it("renders the title and image correctly", () => {
    const { getByText, UNSAFE_getByType } = render(
      <ImageOverlayCard {...defaultProps} />
    );

    // Title should render
    expect(getByText("Test Title")).toBeTruthy();

    // Image should render with the correct source
    const img = UNSAFE_getByType(Image);
    expect(img.props.source).toEqual(defaultProps.source);
  });

  it("applies default size and border radius styles", () => {
    const { UNSAFE_getByType } = render(<ImageOverlayCard {...defaultProps} />);
    const root = UNSAFE_getByType(TouchableOpacity);
    const flat = flattenStyle(root.props.style);

    expect(flat.width).toBe(180);
    expect(flat.height).toBe(120);
    expect(flat.borderRadius).toBe(16);
  });

  it("applies custom size and border radius styles", () => {
    const { UNSAFE_getByType } = render(
      <ImageOverlayCard
        {...defaultProps}
        width={250}
        height={200}
        borderRadius={20}
      />
    );
    const root = UNSAFE_getByType(TouchableOpacity);
    const flat = flattenStyle(root.props.style);

    expect(flat.width).toBe(250);
    expect(flat.height).toBe(200);
    expect(flat.borderRadius).toBe(20);
  });

  it("calls onPress when provided", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(
      <ImageOverlayCard {...defaultProps} onPress={onPress} />
    );
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not crash if onPress is not provided", () => {
    const { UNSAFE_getByType } = render(<ImageOverlayCard {...defaultProps} />);
    const root = UNSAFE_getByType(TouchableOpacity);
    // No onPress -> activeOpacity should be 1
    expect(root.props.activeOpacity).toBe(1);
    fireEvent.press(root); // Should NOT throw
  });

  it("renders the title centered and applies correct text styles", () => {
    const { getByText } = render(<ImageOverlayCard {...defaultProps} />);
    const titleNode = getByText("Test Title");
    const flatStyle = flattenStyle(titleNode.props.style);

    expect(flatStyle.color).toBe("#fff");
    expect(flatStyle.fontSize).toBe(16);
    expect(flatStyle.fontWeight).toBe("800");
    expect(flatStyle.textAlign).toBe("center");
  });

  it("renders LinearGradient at the bottom with correct radius and colors", () => {
    const { getByTestId } = render(
      <ImageOverlayCard
        title="Test Title"
        source={{ uri: "https://example.com/image.jpg" }}
        borderRadius={24}
      />
    );

    const gradient = getByTestId("LinearGradient");
    expect(gradient).toBeTruthy();

    // Verify the gradient colors prop
    expect(gradient.props.colors).toEqual(["transparent", "rgba(0,0,0,0.7)"]);

    // Verify computed style (position, size, and radii)
    const flattenStyle = (style) =>
      Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean))
        : style || {};

    const gs = flattenStyle(gradient.props.style);
    expect(gs.position).toBe("absolute");
    expect(gs.left).toBe(0);
    expect(gs.right).toBe(0);
    expect(gs.bottom).toBe(0);
    expect(gs.height).toBe("30%");
    expect(gs.borderBottomLeftRadius).toBe(24);
    expect(gs.borderBottomRightRadius).toBe(24);
  });

  it("merges custom styles with defaults", () => {
    const { UNSAFE_getByType } = render(
      <ImageOverlayCard
        {...defaultProps}
        style={{ backgroundColor: "#123456", width: 300 }}
      />
    );
    const root = UNSAFE_getByType(TouchableOpacity);
    const flat = flattenStyle(root.props.style);

    // Custom backgroundColor should override
    expect(flat.backgroundColor).toBe("#123456");
    // Custom width should override default
    expect(flat.width).toBe(300);
  });

  it("limits the title to a single line", () => {
    const { getByText } = render(<ImageOverlayCard {...defaultProps} />);
    const titleNode = getByText("Test Title");
    expect(titleNode.props.numberOfLines).toBe(1);
  });
});
