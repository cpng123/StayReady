import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { View, Text, Image, TouchableOpacity } from "react-native";
import "@testing-library/jest-native/extend-expect";

// ---- i18n mock (unchanged) ----
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, arg2, arg3) => {
      const interpolate = (tmpl, vars = {}) =>
        String(tmpl).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
          vars[k] != null ? String(vars[k]) : ""
        );

      if (typeof arg2 === "string") {
        return interpolate(arg2, arg3 || {});
      }
      if (arg2 && typeof arg2 === "object") {
        const dv = arg2.defaultValue != null ? arg2.defaultValue : key;
        return interpolate(dv, arg2);
      }
      return key;
    },
  }),
}));

// ---- Theme mock (unchanged) ----
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
import WarningCard from "../../components/WarningCard";

// Helpers
const flatten = (style) =>
  Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {};

describe("WarningCard", () => {
  const baseItem = {
    title: "Flood Advisory",
    img: 1,
    color: "#F59E0B",
    level: "WARNING",
  };

  it("renders image, title, severity badge, and uses hazard description with interpolation", () => {
    const item = {
      ...baseItem,
      hazard: {
        kind: "flood",
        severity: "warning",
        locationName: "Tampines",
        metrics: { locality: "Tampines" },
      },
    };

    const { getByText, UNSAFE_getAllByType } = render(
      <WarningCard item={item} width={220} imageHeight={140} />
    );

    // Title
    expect(getByText("Flood Advisory")).toBeTruthy();

    // Image with configured height
    const images = UNSAFE_getAllByType(Image);
    expect(images.length).toBeGreaterThan(0);
    const imgStyle = flatten(images[0].props.style);
    expect(imgStyle.height).toBe(140);
    expect(imgStyle.width).toBe("100%");

    // Badge (Text -> parent Text -> parent View is the badge container)
    const badgeView = getByText("WARNING").parent.parent;
    const badgeStyle = flatten(badgeView.props.style);
    expect(badgeStyle.backgroundColor).toBe("#F59E0B");

    // Description interpolates {{place}}
    const desc = getByText(/Heavy showers near Tampines/i);
    expect(desc).toBeTruthy();
  });

  it("haze/warning uses region interpolation from metrics.region", () => {
    const item = {
      ...baseItem,
      title: "Haze Alert",
      hazard: {
        kind: "haze",
        severity: "warning",
        metrics: { region: "East" },
      },
    };

    const { getByText } = render(<WarningCard item={item} />);
    expect(getByText(/Elevated PM2\.5 in the East/i)).toBeTruthy();
  });

  it("dengue/danger uses cases; dengue/warning uses km (with parentheses formatting)", () => {
    const dangerItem = {
      ...baseItem,
      title: "Dengue High Risk",
      hazard: {
        kind: "dengue",
        severity: "danger",
        locationName: "Bedok",
        metrics: { cases: 47 },
      },
    };
    const warningItem = {
      ...baseItem,
      title: "Dengue Watch",
      hazard: {
        kind: "dengue",
        severity: "warning",
        locationName: "Hougang",
        metrics: { km: 2.345 }, // -> 2.3 km
      },
    };

    const { getByText, rerender } = render(<WarningCard item={dangerItem} />);
    expect(getByText(/High-risk cluster near Bedok \(47\+ cases\)/i)).toBeTruthy();

    rerender(<WarningCard item={warningItem} />);
    // Note the parentheses around (~2.3 km)
    expect(getByText(/Active cluster near Hougang \(~2\.3 km\)/i)).toBeTruthy();
  });

  it("falls back to item.desc when no hazard description is available", () => {
    const item = { ...baseItem, title: "Info", desc: "Plain description here." };
    const { getByText } = render(<WarningCard item={item} />);
    expect(getByText("Plain description here.")).toBeTruthy();
  });

  it("applies width prop and theme colors to card and text/meta", () => {
    const item = { ...baseItem, title: "Wind Notice", hazard: { kind: "wind", severity: "safe" } };
    const { getByText, UNSAFE_getAllByType } = render(<WarningCard item={item} width={260} />);

    // Root card is the first TouchableOpacity
    const card = UNSAFE_getAllByType(TouchableOpacity)[0];
    const cardStyle = flatten(card.props.style);
    expect(cardStyle.width).toBe(260);
    expect(cardStyle.backgroundColor).toBe("#ffffff"); // theme.colors.card

    // Title color (theme.colors.text)
    const titleNode = getByText("Wind Notice");
    expect(flatten(titleNode.props.style).color).toBe("#111111");
  });

  it("shows 'Updated …' meta when showUpdated is true and item.updated is present", () => {
    const item = {
      ...baseItem,
      title: "Heat Advisory",
      hazard: { kind: "heat", severity: "warning", metrics: { hi: 35.2 }, region: "West" },
      updated: "10:05 AM",
    };
    const { getByText } = render(<WarningCard item={item} showUpdated />);
    expect(getByText(/Updated 10:05 AM/i)).toBeTruthy();
  });

  it("press propagates via onPress and uses dimmed activeOpacity when provided", () => {
    const onPress = jest.fn();
    const item = { ...baseItem, title: "Tap Me", desc: "desc" };
    const { UNSAFE_getAllByType } = render(<WarningCard item={item} onPress={onPress} />);

    const touchable = UNSAFE_getAllByType(TouchableOpacity)[0];
    expect(touchable.props.activeOpacity).toBe(0.8);
    fireEvent.press(touchable);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders without descText node when no hazard/desc/subtitle/summary present", () => {
    const item = { ...baseItem, title: "Bare", img: 1, color: "#F59E0B", level: "WARNING" };
    const { getByText, queryByText } = render(<WarningCard item={item} />);
    expect(getByText("Bare")).toBeTruthy();
    expect(queryByText(/Stay Alert, Stay Safe/i)).toBeNull();
  });
});
