import { Pressable } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import "@testing-library/jest-native/extend-expect";

// ---- Mock react-native Modal (render children when visible/open) ----
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const { View } = require("react-native");
  const MockModal = ({ visible = true, children, ...rest }) => {
    return visible ? <View {...rest}>{children}</View> : null;
  };
  return MockModal;
});

// ---- Mock i18n: t(key, { defaultValue }) -> defaultValue || key ----
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, arg) => {
      if (typeof arg === "string" && arg) return arg; // t(key, "literal")
      if (arg && typeof arg === "object" && "defaultValue" in arg) {
        return arg.defaultValue;
      }
      return key; // fallback
    },
  }),
}));

// ---- Mock ThemeProvider with internal, mutable theme ----
jest.mock("../../theme/ThemeProvider", () => {
  let theme = {
    key: "light",
    colors: {
      card: "#fff",
      text: "#111",
      subtext: "#666",
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

import ContactEditorModal from "../../components/ContactEditorModal";

describe("ContactEditorModal", () => {
  beforeEach(() => {
    __setTestTheme({
      key: "light",
      colors: {
        card: "#fff",
        text: "#111",
        subtext: "#666",
        primary: "#0A84FF",
      },
    });
  });

  it("prefills fields when editing: derives 8-digit local part from E.164", () => {
    const initial = { id: "c1", name: "Mum", value: "+6591234567" }; // 91234567
    const { getByDisplayValue } = render(
      <ContactEditorModal open initial={initial} onClose={() => {}} onSave={() => {}} />
    );

    // Name field has existing name
    expect(getByDisplayValue("Mum")).toBeTruthy();
    // Digits field shows last 8 digits
    expect(getByDisplayValue("91234567")).toBeTruthy();
  });

  it("validates: name required", () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <ContactEditorModal open onClose={() => {}} onSave={() => {}} />
    );

    // Fill only the digits
    fireEvent.changeText(getByPlaceholderText("9XXXXXXX"), "81234567");

    fireEvent.press(getByText("Save"));
    expect(
      getByText("Please enter a name.")
    ).toBeTruthy();

    // Fix name and error should clear on next save attempt
    fireEvent.changeText(getByPlaceholderText("e.g., Mom"), " Mom ");
    fireEvent.press(getByText("Save"));
    expect(queryByText("Please enter a name.")).toBeNull();
  });

  it("validates: digits must be 8 and start with 8 or 9", () => {
    const { getByText, getByPlaceholderText } = render(
      <ContactEditorModal open onClose={() => {}} onSave={() => {}} />
    );

    // Enter name
    fireEvent.changeText(getByPlaceholderText("e.g., Mom"), "Dad");
    // Bad digits
    fireEvent.changeText(getByPlaceholderText("9XXXXXXX"), "7123456");
    fireEvent.press(getByText("Save"));

    expect(
      getByText("Enter a valid SG mobile number (8 digits, starts with 8 or 9).")
    ).toBeTruthy();
  });

  it("strips non-digits and clamps to 8 characters while typing", () => {
    const { getByPlaceholderText } = render(
      <ContactEditorModal open onClose={() => {}} onSave={() => {}} />
    );

    const digitsInput = getByPlaceholderText("9XXXXXXX");
    fireEvent.changeText(digitsInput, "8a1b2c3d4e5f6g7h8i9");
    // Should keep only first 8 digits
    expect(digitsInput.props.value).toBe("81234567");
  });

  it("saves with normalized E.164 (+65) and closes", () => {
    const onClose = jest.fn();
    const onSave = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <ContactEditorModal open onClose={onClose} onSave={onSave} />
    );

    fireEvent.changeText(getByPlaceholderText("e.g., Mom"), " Alice  ");
    fireEvent.changeText(getByPlaceholderText("9XXXXXXX"), "81234567");

    fireEvent.press(getByText("Save"));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Alice",
        value: "+6581234567",
        channel: "auto",
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Cancel button and tapping backdrop both call onClose", () => {
    const onClose = jest.fn();

    const { getByText, UNSAFE_getAllByType } = render(
      <ContactEditorModal open onClose={onClose} onSave={() => {}} />
    );

    // Cancel button
    fireEvent.press(getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);

    // Backdrop is a Pressable absolute fill (first Pressable rendered)
    const pressables = UNSAFE_getAllByType(Pressable);
    expect(pressables.length).toBeGreaterThan(0);
    fireEvent.press(pressables[0]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("reset fields when initial changes while open", () => {
    const { getByPlaceholderText, rerender } = render(
      <ContactEditorModal
        open
        initial={{ id: "x1", name: "Bob", value: "+6598765432" }}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    // Change the initial prop -> digits should reset to last 8
    rerender(
      <ContactEditorModal
        open
        initial={{ id: "x2", name: "Eve", value: "+6587654321" }}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    expect(getByPlaceholderText("e.g., Mom").props.value).toBe("Eve");
    expect(getByPlaceholderText("9XXXXXXX").props.value).toBe("87654321");
  });
});
