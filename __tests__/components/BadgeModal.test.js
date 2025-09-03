import { Pressable, Animated } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock react-native Modal (must require inside factory) ----
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const { View } = require("react-native");
  const MockModal = ({ visible = true, children, ...rest }) => {
    // Render nothing when not visible; when visible, render a host View
    return visible ? <View {...rest}>{children}</View> : null;
  };
  return MockModal;
});

// ---- Mock Ionicons (require Text inside factory; no out-of-scope refs) ----
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: () => React.createElement(Text, { testID: "ionicon" }, "icon"),
  };
});

// ---- Calm down Animated.loop so it doesn't actually run timers ----
beforeAll(() => {
  jest
    .spyOn(Animated, "loop")
    .mockReturnValue({ start: jest.fn(), stop: jest.fn() });
});
afterAll(() => {
  jest.restoreAllMocks();
});

// Import AFTER mocks
import BadgeModal from "../../components/BadgeModal";

const theme = {
  colors: { card: "#fff", text: "#111", subtext: "#666", primary: "#007aff" },
};

const t = (key, opts) => {
  // Support t(key, "Default string")
  if (typeof opts === "string") return opts;
  // Support t(key, { defaultValue: "Default string" })
  if (opts && Object.prototype.hasOwnProperty.call(opts, "defaultValue")) {
    return opts.defaultValue;
  }
  // Fallback to the key (useful when we deliberately test for keys)
  return key;
};

describe("BadgeModal", () => {
  it("unlocked: shows title, unlocked message, Share + Close; pressing buttons triggers handlers", () => {
    const onClose = jest.fn();
    const onShare = jest.fn();

    const badge = {
      title: "Perfectionist",
      desc: "Get a perfect quiz score",
      icon: 1,
      achieved: true,
    };

    const { getByText, getByTestId } = render(
      <BadgeModal
        open
        badge={badge}
        onClose={onClose}
        onShare={onShare}
        theme={theme}
        t={t}
      />
    );

    expect(getByText("Perfectionist")).toBeTruthy();
    expect(
      getByText(`Impressive progress! You've “${badge.desc}” like a champ!`)
    ).toBeTruthy();

    const shareBtn = getByText("Share");
    const closeBtn = getByText("Close");
    expect(shareBtn).toBeTruthy();
    expect(closeBtn).toBeTruthy();

    // Ionicons stub present
    expect(getByTestId("ionicon")).toBeTruthy();

    fireEvent.press(shareBtn);
    expect(onShare).toHaveBeenCalledTimes(1);

    fireEvent.press(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locked: shows locked message and only Close button, icon is dimmed (opacity=0.5)", () => {
    const onClose = jest.fn();

    const badge = {
      title: "Speed Runner",
      desc: "Finish a quiz under 1 minute",
      icon: 1,
      achieved: false,
    };

    const { getByText, queryByText, UNSAFE_getByType  } = render(
      <BadgeModal
        open
        badge={badge}
        onClose={onClose}
        onShare={() => {}}
        theme={theme}
        t={t}
      />
    );

    expect(getByText("Speed Runner")).toBeTruthy();
    expect(
      getByText(`You're almost there — unlock this by “${badge.desc}”.`)
    ).toBeTruthy();

    expect(getByText("Close")).toBeTruthy();
    expect(queryByText("Share")).toBeNull();

    // Animated.Image defaults to role "image"
    const img = UNSAFE_getByType(Animated.Image);
    expect(img).toHaveStyle({ opacity: 0.5 });

    fireEvent.press(getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not crash if badge is null; renders overlay/card skeleton", () => {
    const { toJSON } = render(
      <BadgeModal
        open
        badge={null}
        onClose={() => {}}
        onShare={() => {}}
        theme={theme}
        t={t}
      />
    );
    expect(toJSON()).toBeTruthy();
  });

  it("tapping inside the card does nothing; overlay press closes", () => {
    const onClose = jest.fn();

    const badge = {
      title: "XP Collector",
      desc: "Earn 500 XP in total",
      icon: 1,
      achieved: true,
    };

    const { UNSAFE_getAllByType } = render(
      <BadgeModal
        open
        badge={badge}
        onClose={onClose}
        onShare={() => {}}
        theme={theme}
        t={t}
      />
    );

    const pressables = UNSAFE_getAllByType(Pressable);
    expect(pressables.length).toBeGreaterThanOrEqual(2);

    // Inner card pressable — no close
    fireEvent.press(pressables[1]);
    expect(onClose).not.toHaveBeenCalled();

    // Outer overlay pressable — closes
    fireEvent.press(pressables[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
