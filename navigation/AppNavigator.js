// navigation/AppNavigator.js
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { useTranslation } from "react-i18next";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { navigate as rootNavigate } from "../navigation/RootNavigation";

import HomeScreen from "../screens/HomeScreen";
import ResourceHubScreen from "../screens/ResourceHubScreen";
import SOSScreen from "../screens/SOSScreen";
import GamesScreen from "../screens/GamesScreen";

import { useThemeContext } from "../theme/ThemeProvider";
import ThemeToggle from "../components/ThemeToggle";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function EmptyScreen() {
  return <View style={{ flex: 1 }} />;
}

function MainTabs() {
  const { theme } = useThemeContext();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: "#9AA3AF",
        tabBarLabelStyle: { fontSize: 12, marginBottom: 6, fontWeight: "600" },
        tabBarStyle: {
          height: 55,
          backgroundColor: theme.colors.tabBar,
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          elevation: 10,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="SOSTab"
        component={SOSScreen}
        options={{
          title: t("nav.sos"),
          tabBarLabel: t("nav.sos"),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="alarm-light"
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ResourceTab"
        component={ResourceHubScreen}
        options={{
          title: t("nav.resource"),
          tabBarLabel: t("nav.resource"),
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name="lightbulb-on"
              color={color}
              size={size ?? 22}
            />
          ),
        }}
      />
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
         title: t("nav.home"),
         tabBarLabel: t("nav.home"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GamesTab"
        component={GamesScreen}
        options={{
         title: t("nav.games"),
         tabBarLabel: t("nav.games"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="game-controller" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={EmptyScreen}
        options={{
         title: t("nav.more"),
         tabBarLabel: t("nav.more"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid" size={22} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.openDrawer();
          },
        })}
      />
    </Tab.Navigator>
  );
}

function Row({ icon, label, onPress, textColor }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      {icon}
      <Text style={[styles.rowText, textColor && { color: textColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SideMenu({ navigation }) {
  const { theme, themeKey, setThemeKey } = useThemeContext();
const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.drawerBg }}>
      <DrawerContentScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.headerRow, styles.leftMargin]}>
          <Image
            source={require("../assets/logo.png")}
            style={{ width: 32, height: 32, marginRight: 12 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: theme.colors.primary,
            }}
          >
            StayReady
          </Text>
        </View>
        <View
          style={[
            styles.divider,
            styles.leftMargin,
            { backgroundColor: theme.colors.divider },
          ]}
        />

        <View style={styles.leftMargin}>
          <Row
            icon={
              <MaterialCommunityIcons
                name="clipboard-check-multiple"
                size={24}
                color={theme.colors.text}
              />
            }
            label={t("drawer.checklist")}
            textColor={theme.colors.text}
            onPress={() => {
              navigation.closeDrawer();
              setTimeout(() => rootNavigate("Checklist"), 0);
            }}
          />
          <Row
            icon={
              <MaterialCommunityIcons
                name="file-link"
                size={24}
                color={theme.colors.text}
              />
            }
            label={t("drawer.external_resources")}
            textColor={theme.colors.text}
            onPress={() => {
              navigation.closeDrawer();
              setTimeout(() => rootNavigate("ExternalResources"), 0);
            }}
          />
          <Row
            icon={
              <MaterialCommunityIcons
                name="bookmark"
                size={24}
                color={theme.colors.text}
              />
            }
            label={t("drawer.bookmark")}
            textColor={theme.colors.text}
            onPress={() => {
              navigation.closeDrawer();
              setTimeout(() => rootNavigate("Bookmark"), 0);
            }}
          />
          <Row
            icon={<Ionicons name="gift" size={24} color={theme.colors.text} />}
            label={t("drawer.badge_reward")}
            textColor={theme.colors.text}
            onPress={() => {
              navigation.closeDrawer();
              setTimeout(() => rootNavigate("BadgeReward"), 0);
            }}
          />
          <Row
            icon={
              <Ionicons name="settings" size={24} color={theme.colors.text} />
            }
            label={t("drawer.settings")}
            textColor={theme.colors.text}
            onPress={() => {
              navigation.closeDrawer();
              setTimeout(() => rootNavigate("Settings"), 0);
            }}
          />
        </View>

        <View style={{ flex: 1 }} />
        <View
          style={[styles.leftMargin, { marginRight: 16, marginBottom: 12 }]}
        >
          <ThemeToggle />
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

export default function AppNavigator() {
  const { theme } = useThemeContext();
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
        drawerType: "front",
        overlayColor: theme.colors.overlay,
        drawerStyle: {
          width: 300,
          backgroundColor: theme.colors.drawerBg,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          overflow: "hidden",
        },
        swipeEdgeWidth: 60,
      }}
      drawerContent={(props) => <SideMenu {...props} />}
    >
      <Drawer.Screen name="Tabs" component={MainTabs} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  leftMargin: { marginLeft: 15 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 18 },
  rowText: { marginLeft: 15, fontSize: 18, fontWeight: "600" },
  divider: {
    height: 2,
    marginBottom: 18,
    marginRight: 16,
  },
});
