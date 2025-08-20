// navigation/AppNavigator.js
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import ResourceHubScreen from "../screens/ResourceHubScreen";
import SOSScreen from "../screens/SOSScreen";
import GamesScreen from "../screens/GamesScreen";

import { useThemeContext } from "../theme/ThemeProvider";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function EmptyScreen() {
  return <View style={{ flex: 1 }} />;
}

function MainTabs() {
  const { theme } = useThemeContext();

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
          title: "SOS",
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
          title: "Resource",
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
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GamesTab"
        component={GamesScreen}
        options={{
          title: "Games",
          tabBarIcon: ({ color }) => (
            <Ionicons name="game-controller" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={EmptyScreen}
        options={{
          title: "More",
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
            icon={<Ionicons name="home" size={24} color={theme.colors.text} />}
            label="Home"
            textColor={theme.colors.text}
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate("Tabs", { screen: "HomeTab" });
            }}
          />
          <Row
            icon={
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={24}
                color={theme.colors.text}
              />
            }
            label="Resource Hub"
            textColor={theme.colors.text}
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate("Tabs", { screen: "ResourceTab" });
            }}
          />
          <Row
            icon={
              <Ionicons
                name="game-controller"
                size={24}
                color={theme.colors.text}
              />
            }
            label="Games"
            textColor={theme.colors.text}
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate("Tabs", { screen: "GamesTab" });
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
            label="Bookmark"
            textColor={theme.colors.text}
            onPress={() => {}}
          />
          <Row
            icon={<Ionicons name="gift" size={24} color={theme.colors.text} />}
            label="Badge & Reward"
            textColor={theme.colors.text}
            onPress={() => {}}
          />
          <Row
            icon={
              <Ionicons name="settings" size={24} color={theme.colors.text} />
            }
            label="Setting"
            textColor={theme.colors.text}
            onPress={() => {}}
          />
          <Row
            icon={
              <Ionicons name="log-out" size={24} color={theme.colors.text} />
            }
            label="Log Out"
            textColor={theme.colors.text}
            onPress={() => {}}
          />
        </View>

        <View style={{ flex: 1 }} />
        <View
          style={[
            styles.themeWrap,
            styles.leftMargin,
            { backgroundColor: themeKey === "dark" ? "#2a2a2dff" : "#F3F4F6" },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.themeBtn,
              themeKey === "light" && styles.themeActive,
            ]}
            onPress={() => setThemeKey("light")}
          >
            <Ionicons
              name="sunny"
              size={20}
              color={themeKey === "light" ? "#fff" : "#6B7280"}
            />
            <Text
              style={[
                styles.themeText,
                { color: themeKey === "light" ? "#fff" : "#6B7280" },
              ]}
            >
              Light
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeBtn, themeKey === "dark" && styles.themeActive]}
            onPress={() => setThemeKey("dark")}
          >
            <Ionicons
              name="moon"
              size={20}
              color={themeKey === "dark" ? "#fff" : "#6B7280"}
            />
            <Text
              style={[
                styles.themeText,
                { color: themeKey === "dark" ? "#fff" : "#6B7280" },
              ]}
            >
              Dark
            </Text>
          </TouchableOpacity>
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
  themeWrap: {
    borderRadius: 12,
    padding: 6,
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    marginRight: 16,
  },
  themeBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  themeActive: { backgroundColor: "#0A84FF" },
  themeText: { fontWeight: "700", fontSize: 15 },
});
