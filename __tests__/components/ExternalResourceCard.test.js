import { TouchableOpacity, Linking } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

import ExternalResourceCard from "../../components/ExternalResourceCard";

const theme = {
  colors: { card: "#ffffff", text: "#111111", subtext: "#555555" },
};

describe("ExternalResourceCard", () => {
  const item = {
    title: "SCDF Community Preparedness",
    desc: "Official guides and training resources.",
    url: "https://www.scdf.gov.sg",
    logo: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, description, and the touchable has accessibilityRole='button'", () => {
    const { getByText, UNSAFE_getByType } = render(
      <ExternalResourceCard item={item} theme={theme} />
    );

    expect(getByText(item.title)).toBeTruthy();
    expect(getByText(item.desc)).toBeTruthy();

    const btn = UNSAFE_getByType(TouchableOpacity);
    expect(btn).toBeTruthy();
    expect(btn.props.accessibilityRole).toBe("button");
  });

  it("applies theme colors to background and text", () => {
    const { getByText, UNSAFE_getByType } = render(
      <ExternalResourceCard item={item} theme={theme} />
    );

    const root = UNSAFE_getByType(TouchableOpacity);
    const rootStyle = Array.isArray(root.props.style)
      ? Object.assign({}, ...root.props.style.filter(Boolean))
      : root.props.style;
    expect(rootStyle.backgroundColor).toBe("#ffffff");

    const titleNode = getByText(item.title);
    const titleStyle = Array.isArray(titleNode.props.style)
      ? Object.assign({}, ...titleNode.props.style.filter(Boolean))
      : titleNode.props.style;
    expect(titleStyle.color).toBe("#111111");

    const descNode = getByText(item.desc);
    const descStyle = Array.isArray(descNode.props.style)
      ? Object.assign({}, ...descNode.props.style.filter(Boolean))
      : descNode.props.style;
    expect(descStyle.color).toBe("#555555");
  });

  it("merges style overrides (caller style wins)", () => {
    const override = { height: 100, backgroundColor: "#eeeeee" };
    const { UNSAFE_getByType } = render(
      <ExternalResourceCard item={item} theme={theme} style={override} />
    );
    const root = UNSAFE_getByType(TouchableOpacity);
    const flat = Array.isArray(root.props.style)
      ? Object.assign({}, ...root.props.style.filter(Boolean))
      : root.props.style;

    expect(flat.height).toBe(100); // overrides default 85
    expect(flat.backgroundColor).toBe("#eeeeee"); // overrides theme card color
  });

  it("press: opens URL when canOpenURL resolves true", async () => {
    const spyCan = jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    const spyOpen = jest.spyOn(Linking, "openURL").mockResolvedValue();

    const { UNSAFE_getByType } = render(
      <ExternalResourceCard item={item} theme={theme} />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));

    expect(spyCan).toHaveBeenCalledWith(item.url);
    await Promise.resolve();
    expect(spyOpen).toHaveBeenCalledWith(item.url);
  });

  it("press: does not open when canOpenURL resolves false", async () => {
    const spyCan = jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
    const spyOpen = jest.spyOn(Linking, "openURL").mockResolvedValue();

    const { UNSAFE_getByType } = render(
      <ExternalResourceCard item={item} theme={theme} />
    );
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));

    expect(spyCan).toHaveBeenCalledWith(item.url);
    await Promise.resolve();
    expect(spyOpen).not.toHaveBeenCalled();
  });

  it("press: swallows errors from Linking APIs (no throw)", async () => {
    const spyCan = jest
      .spyOn(Linking, "canOpenURL")
      .mockRejectedValue(new Error("boom"));
    const spyOpen = jest.spyOn(Linking, "openURL").mockResolvedValue();

    const { UNSAFE_getByType } = render(
      <ExternalResourceCard item={item} theme={theme} />
    );

    expect(() =>
      fireEvent.press(UNSAFE_getByType(TouchableOpacity))
    ).not.toThrow();

    expect(spyCan).toHaveBeenCalledWith(item.url);
    await Promise.resolve();
    expect(spyOpen).not.toHaveBeenCalled();
  });

  it("renders without an Image when no logo provided", () => {
    const noLogoItem = { ...item, logo: undefined };
    const { toJSON } = render(
      <ExternalResourceCard item={noLogoItem} theme={theme} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
