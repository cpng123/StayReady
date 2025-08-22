// App.js
import "react-native-gesture-handler";
import * as React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { navigationRef } from "./navigation/RootNavigation";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import SplashScreen from "./screens/SplashScreen";
import EarlyWarningScreen from "./screens/EarlyWarningScreen";
import ResourceHubScreen from "./screens/ResourceHubScreen";
import AppNavigator from "./navigation/AppNavigator";
import PreparednessGuideScreen  from "./screens/PreparednessGuideScreen";
import ExternalResourceScreen from "./screens/ExternalResourceScreen";
import ChecklistScreen from "./screens/ChecklistScreen";

import { ThemeProvider, useThemeContext } from "./theme/ThemeProvider";

const Stack = createNativeStackNavigator();

function RootNav() {
  const { theme } = useThemeContext();

  return (
    // Only top/left/right so bottom tab can remain fully flush to the bottom
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.appBg }} edges={["top", "left", "right"]}>
      <StatusBar style={theme.statusBarStyle} />
      <NavigationContainer ref={navigationRef} theme={theme.navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Main" component={AppNavigator} />
          <Stack.Screen name="EarlyWarning" component={EarlyWarningScreen} />
          <Stack.Screen name="ResourceHub" component={ResourceHubScreen} />
          <Stack.Screen name="PreparednessGuide" component={PreparednessGuideScreen} />
          <Stack.Screen name="ExternalResources" component={ExternalResourceScreen} />
          <Stack.Screen name="Checklist" component={ChecklistScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <RootNav />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
