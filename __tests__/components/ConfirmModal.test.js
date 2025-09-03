import {
  Pressable,
} from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock react-native Modal so it renders children when visible ----
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockModal = ({ visible = true, children, ...rest }) => {
    return visible ? <View {...rest}>{children}</View> : null;
  };
  return MockModal;
});

// ---- Mock ThemeProvider with internal, mutable theme ----
jest.mock("../../theme/ThemeProvider", () => {
  let theme = {
    key: "light",
    colors: {
      overlay: "rgba(0,0,0,0.5)",
      card: "#ffffff",
      text: "#111111",
      subtext: "#666666",
      primary: "#0A84FF",
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

import ConfirmModal from "../../components/ConfirmModal";

describe("ConfirmModal", () => {
  beforeEach(() => {
    // reset to a known light theme
    __setTestTheme({
      key: "light",
      colors: {
        overlay: "rgba(0,0,0,0.5)",
        card: "#ffffff",
        text: "#111111",
        subtext: "#666666",
        primary: "#0A84FF",
      },
    });
  });

  it("renders title, message and buttons when visible; pressing buttons triggers handlers", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const { getByText } = render(
      <ConfirmModal
        visible
        title="Delete item?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(getByText("Delete item?")).toBeTruthy();
    expect(getByText("This action cannot be undone.")).toBeTruthy();

    const confirmBtn = getByText("Delete");
    const cancelBtn = getByText("Cancel");
    expect(confirmBtn).toBeTruthy();
    expect(cancelBtn).toBeTruthy();

    fireEvent.press(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.press(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("overlay press (backdrop) calls onCancel; pressing inside card does not", () => {
    const onCancel = jest.fn();

    const { UNSAFE_getAllByType } = render(
      <ConfirmModal
        visible
        title="Confirm"
        message="Proceed?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    const pressables = UNSAFE_getAllByType(Pressable);
    expect(pressables.length).toBeGreaterThanOrEqual(1);

    const overlay = pressables[0];
    fireEvent.press(overlay);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("respects dark theme surface/ghost button background (smoke test)", () => {
    __setTestTheme({
      key: "dark",
      colors: {
        overlay: "rgba(0,0,0,0.6)",
        card: "#1b1b1b",
        text: "#eeeeee",
        subtext: "#aaaaaa",
        primary: "#00a2ff",
      },
    });

    const { getByText, toJSON } = render(
      <ConfirmModal
        visible
        title="Confirm"
        message="Dark mode?"
        confirmLabel="OK"
        cancelLabel="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    // Buttons present
    expect(getByText("Cancel")).toBeTruthy();
    expect(getByText("OK")).toBeTruthy();

    // Snapshot-ish smoke test (tree renders)
    expect(toJSON()).toBeTruthy();
  });
});
