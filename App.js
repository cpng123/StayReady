// App.js
import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { navigationRef } from "./navigation/RootNavigation";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { initI18n } from "./i18n";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";

import SplashScreen from "./screens/SplashScreen";
import EarlyWarningScreen from "./screens/EarlyWarningScreen";
import ResourceHubScreen from "./screens/ResourceHubScreen";
import AppNavigator from "./navigation/AppNavigator";
import PreparednessGuideScreen from "./screens/PreparednessGuideScreen";
import ExternalResourceScreen from "./screens/ExternalResourceScreen";
import ChecklistScreen from "./screens/ChecklistScreen";
import QuizSetsScreen from "./screens/QuizSetsScreen";
import QuizPlayScreen from "./screens/QuizPlayScreen";
import QuizResultScreen from "./screens/QuizResultScreen";
import ReviewAnswerScreen from "./screens/ReviewAnswerScreen";
import BookmarkScreen from "./screens/BookmarkScreen";
import BadgeRewardScreen from "./screens/BadgeRewardScreen";
import RewardDetailScreen from "./screens/RewardDetailScreen";
import SettingsScreen from "./screens/SettingsScreen";
import EmergencyContactsScreen from "./screens/EmergencyContactsScreen";
import LocationSettings from "./screens/LocationSettings";

import { ThemeProvider, useThemeContext } from "./theme/ThemeProvider";

const Stack = createNativeStackNavigator();

function RootNav() {
  const { theme } = useThemeContext();

  return (
    // Only top/left/right so bottom tab can remain fully flush to the bottom
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.appBg }}
      edges={["top", "left", "right"]}
    >
      <StatusBar style={theme.statusBarStyle} />
      <NavigationContainer ref={navigationRef} theme={theme.navTheme}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          // initialRouteName="QuizResult"
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Main" component={AppNavigator} />
          <Stack.Screen name="EarlyWarning" component={EarlyWarningScreen} />
          <Stack.Screen name="ResourceHub" component={ResourceHubScreen} />
          <Stack.Screen
            name="PreparednessGuide"
            component={PreparednessGuideScreen}
          />
          <Stack.Screen
            name="ExternalResources"
            component={ExternalResourceScreen}
          />
          <Stack.Screen name="Checklist" component={ChecklistScreen} />
          <Stack.Screen name="QuizSets" component={QuizSetsScreen} />
          <Stack.Screen name="QuizPlay" component={QuizPlayScreen} />
          <Stack.Screen name="QuizResult" component={QuizResultScreen} />
          <Stack.Screen name="ReviewAnswer" component={ReviewAnswerScreen} />
          <Stack.Screen name="Bookmark" component={BookmarkScreen} />
          <Stack.Screen name="BadgeReward" component={BadgeRewardScreen} />
          <Stack.Screen name="RewardDetail" component={RewardDetailScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen
            name="EmergencyContacts"
            component={EmergencyContactsScreen}
          />
          <Stack.Screen name="LocationSettings" component={LocationSettings} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initI18n();
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <SafeAreaProvider>
          <RootNav />
        </SafeAreaProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
