import * as React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// screens
import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import EarlyWarningScreen from "./screens/EarlyWarningScreen";
import ResourceHubScreen from "./screens/ResourceHubScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: "#F8F4EF" },
  };

  return (
    <SafeAreaProvider>
      {/* Apply Safe Area app-wide. Omit 'bottom' if you use a custom tab bar */}
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F4EF" }} edges={["top", "left", "right"]}>
        <StatusBar style="light" backgroundColor="#110033" />
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#F8F4EF" },
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="EarlyWarning" component={EarlyWarningScreen} />
            <Stack.Screen name="ResourceHub" component={ResourceHubScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
