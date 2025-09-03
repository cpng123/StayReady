import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock i18n ----
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, defaultValue) =>
      typeof defaultValue === "string" && defaultValue ? defaultValue : key,
  }),
}));

// ---- Mock ThemeProvider ----
jest.mock("../../theme/ThemeProvider", () => {
  let theme = {
    key: "light",
    colors: {
      primary: "#0A84FF",
      text: "#111111",
      subtext: "#666666",
      card: "#FFFFFF",
      success: "#16A34A",
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

// ---- Mock Ionicons -> Text(name) ----
const IoniconsMock = (props) => <Text {...props}>{props.name}</Text>;
IoniconsMock.displayName = "IoniconsMock";
jest.mock("@expo/vector-icons", () => ({ Ionicons: IoniconsMock }));

// SUT
import HazardBanner from "../../components/HazardBanner";

// Helper to flatten RN style arrays/objects
const flattenStyle = (style) =>
  Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style || {};

describe("HazardBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __setTestTheme({
      key: "light",
      colors: {
        primary: "#0A84FF",
        text: "#111111",
        subtext: "#666666",
        card: "#FFFFFF",
        success: "#16A34A",
      },
    });
  });

  it("SAFE state: uses theme success bg, 'shield-checkmark' icon, slogan key", () => {
    const safeTree = render(<HazardBanner hazard={{ kind: "none" }} />);

    // Title fallback via defaultValue
    expect(safeTree.getByText("No Hazards Detected")).toBeTruthy();
    // Slogan key (mock echoes the key)
    expect(safeTree.getByText("home.hazard.slogan")).toBeTruthy();

    // Background = theme.success
    const root = safeTree.toJSON();
    expect(flattenStyle(root.props.style).backgroundColor).toBe("#16A34A");

    // Ionicons mock renders icon name as text
    const iconNodes = safeTree.UNSAFE_getAllByType(Text);
    const shield = iconNodes.find(
      (n) => n.props.children === "shield-checkmark"
    );
    expect(shield).toBeTruthy();
  });

  it("WARNING (flood/warning): amber bg and i18n title key", () => {
    const { getByText, toJSON } = render(
      <HazardBanner
        hazard={{ kind: "flood", severity: "warning" }}
        dateStr="2 Sep 2025"
        timeAgoStr="10m ago"
        locLabel="Tampines"
      />
    );

    // i18n key (echoed)
    expect(getByText("home.warning.flood.warning.title")).toBeTruthy();

    // Background amber
    const flat = flattenStyle(toJSON().props.style);
    expect(flat.backgroundColor).toBe("#F59E0B");

    // Metadata
    expect(getByText("2 Sep 2025")).toBeTruthy();
    expect(getByText("10m ago")).toBeTruthy();
    expect(getByText("Tampines")).toBeTruthy();

    // Icon "warning" (use UNSAFE_getAllByType because it's hidden from a11y)
    const els = render(
      <HazardBanner hazard={{ kind: "flood", severity: "warning" }} />
    ).UNSAFE_getAllByType(Text);
    const warningIcon = els.find((n) => n.props.children === "warning");
    expect(warningIcon).toBeTruthy();
  });

  it("DANGER (haze/danger): red bg and correct i18n key", () => {
    const { getByText, toJSON } = render(
      <HazardBanner hazard={{ kind: "haze", severity: "danger" }} />
    );
    expect(getByText("home.warning.haze.danger.title")).toBeTruthy();
    expect(flattenStyle(toJSON().props.style).backgroundColor).toBe("#DC2626");
  });

  it("falls back to hazard.title when TITLE_KEYS has no mapping", () => {
    const { getByText } = render(
      <HazardBanner
        hazard={{ kind: "unknown", severity: "warning", title: "Custom Alert" }}
      />
    );
    expect(getByText("Custom Alert")).toBeTruthy();
  });

  it("falls back to 'No Hazards Detected' for none/safe", () => {
    expect(
      render(<HazardBanner hazard={{ kind: "none" }} />).getByText(
        "No Hazards Detected"
      )
    ).toBeTruthy();
    expect(
      render(
        <HazardBanner hazard={{ kind: "heat", severity: "safe" }} />
      ).getByText("No Hazards Detected")
    ).toBeTruthy();
  });

  it("location precedence: locLabel overrides hazard.locationName", () => {
    const { getByText } = render(
      <HazardBanner
        hazard={{ kind: "wind", severity: "warning", locationName: "Bedok" }}
        locLabel="Hougang"
      />
    );
    expect(getByText("Hougang")).toBeTruthy();
  });

  it("hides location row when neither locLabel nor hazard.locationName provided", () => {
    const { queryByText } = render(
      <HazardBanner hazard={{ kind: "dengue", severity: "warning" }} />
    );
    // When row is absent, there won't be a location icon/text
    expect(queryByText("location-outline")).toBeNull();
  });

  it("compact mode reduces title font size (14) vs regular (15)", () => {
    const reg = render(
      <HazardBanner hazard={{ kind: "flood", severity: "warning" }} />
    );
    const regTitle = reg.getByText("home.warning.flood.warning.title");
    expect(flattenStyle(regTitle.props.style).fontSize).toBe(15);

    const cmp = render(
      <HazardBanner hazard={{ kind: "flood", severity: "warning" }} compact />
    );
    const cmpTitle = cmp.getByText("home.warning.flood.warning.title");
    expect(flattenStyle(cmpTitle.props.style).fontSize).toBe(14);
  });

  it("icon has accessibility disabled as intended", () => {
    const { UNSAFE_getAllByType } = render(
      <HazardBanner hazard={{ kind: "heat", severity: "danger" }} />
    );
    const texts = UNSAFE_getAllByType(Text);
    const iconNode = texts.find((n) => n.props.children === "warning");
    expect(iconNode).toBeTruthy();
    expect(iconNode.props.accessibilityElementsHidden).toBe(true);
    expect(iconNode.props.importantForAccessibility).toBe("no");
  });

  it("respects theme.success when safe", () => {
    __setTestTheme({
      key: "light",
      colors: {
        primary: "#0A84FF",
        text: "#111111",
        subtext: "#666666",
        card: "#FFFFFF",
        success: "#22C55E",
      },
    });
    const { toJSON } = render(<HazardBanner hazard={{ kind: "none" }} />);
    expect(flattenStyle(toJSON().props.style).backgroundColor).toBe("#22C55E");
  });
});
