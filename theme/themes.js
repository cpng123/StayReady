// theme/themes.js
import { DefaultTheme, DarkTheme } from "@react-navigation/native";

export const lightTheme = {
  key: "light",
  colors: {
    appBg: "#f4f4f4",
    text: "#111",
    subtext: "#5F6D7E",
    card: "#ffffff",
    primary: "#0380FE",
    danger: "#F25555",
    success: "#03A55A",
    divider: "#E5E7EB",
    tabBar: "#ffffff",
    drawerBg: "#ffffff",
    overlay: "rgba(0,0,0,0.35)",
  },
  statusBarStyle: "dark", // expo StatusBar
  navTheme: {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: "#f4f4f4", card: "#ffffff", text: "#111" },
  },
};

export const darkTheme = {
  key: "dark",
  colors: {
    appBg: "#0b0b0d",
    text: "#F2F4F7",
    subtext: "#98A2B3",
    card: "#212124ff",
    primary: "#0380FE",
    danger: "#FF6B6B",
    success: "#03A55A",
    divider: "#414141",
    tabBar: "#121214",
    drawerBg: "#121214",
    overlay: "rgba(0,0,0,0.55)",
  },
  statusBarStyle: "light",
  navTheme: {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: "#0b0b0d", card: "#151518", text: "#F2F4F7" },
  },
};
