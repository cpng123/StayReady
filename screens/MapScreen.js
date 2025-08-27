// screens/MapScreen.js
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import LeafletMapWebView from "../components/LeafletMapWebView";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";
import { resolveLocationLabel } from "../utils/locationService";
import {
  getRainfallLatest,
  getWindLatest,
  getAirTemperatureLatest,
  getRelativeHumidityLatest,
  getPM25Latest,
  getDengueClustersGeoJSON,
} from "../utils/api";
import { decideHazard } from "../utils/hazard";
import { getMockFloodEnabled } from "../utils/mockFlags";
import HazardBanner from "../components/HazardBanner";

const DENGUE_ICON = require("../assets/General/dengue.png");

export default function MapScreen({ route, navigation }) {
  const mapRef = useRef(null);
  const { theme } = useThemeContext();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const presetPin = route?.params?.pin ? [route.params.pin] : [];
  const [center, setCenter] = useState({ lat: 1.3521, lon: 103.8198 });
  const [recenterLoading, setRecenterLoading] = useState(false);

  const [hazard, setHazard] = useState({
    kind: "none",
    title: t("home.hazard.none", "No Hazard Detected"),
  });

  // datasets
  const [rainPoints, setRainPoints] = useState([]);
  const [windPoints, setWindPoints] = useState([]);
  const [tempPoints, setTempPoints] = useState([]);
  const [humPoints, setHumPoints] = useState([]);
  const [pmPoints, setPmPoints] = useState([]);
  const [dengueGeoJSON, setDengueGeoJSON] = useState(null);

  // active overlay
  const [overlay, setOverlay] = useState("rain");
  const [sheetHeight, setSheetHeight] = useState(180); // sensible default
  const onSheetLayout = React.useCallback(
    (e) => setSheetHeight(Math.ceil(e.nativeEvent.layout.height)),
    []
  );

  // get user location once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await resolveLocationLabel();
        if (!alive) return;
        setCenter({ lat: res.coords.latitude, lon: res.coords.longitude });
      } catch {
        // keep default SG center
      }
    })();
    return () => (alive = false);
  }, []);

  // Fetch all datasets once on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [
          { points: rp },
          { points: wp },
          { points: tp },
          { points: hp },
          { points: pp },
          dengueJSON,
        ] = await Promise.all([
          getRainfallLatest(),
          getWindLatest(),
          getAirTemperatureLatest(),
          getRelativeHumidityLatest(),
          getPM25Latest(),
          getDengueClustersGeoJSON().catch(() => null),
        ]);
        if (!alive) return;

        setRainPoints(rp);
        setWindPoints(wp);
        setTempPoints(tp);
        setHumPoints(hp);
        setPmPoints(pp);
        setDengueGeoJSON(dengueJSON);

        // push into webview if mounted
        mapRef.current?.setRainfall(rp);
        mapRef.current?.setWind(wp);
        mapRef.current?.setTemp(tp);
        mapRef.current?.setHum(hp);
        mapRef.current?.setPM(pp);
        if (dengueJSON) mapRef.current?.setDengue(dengueJSON);
      } catch (e) {
        // optionally log
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mockFlood = await getMockFloodEnabled();
        const result = decideHazard({
          center,
          rainfallPoints: rainPoints,
          humPoints: humPoints,
          mockFlood,
        });
        if (alive) setHazard(result);
      } catch {
        if (alive)
          setHazard({
            kind: "none",
            title: t("home.hazard.none", "No Hazard Detected"),
          });
      }
    })();
    return () => {
      alive = false;
    };
  }, [center, rainPoints, humPoints, t]);

  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      (async () => {
        const [rain, hum, mockFlood] = await Promise.all([
          getRainfallLatest().catch(() => ({ points: [] })),
          getRelativeHumidityLatest().catch(() => ({ points: [] })),
          getMockFloodEnabled(),
        ]);
        if (!alive) return;
        const result = decideHazard({
          center,
          rainfallPoints: rain.points || [],
          humPoints: humPoints.length ? humPoints : hum.points || [],
          mockFlood,
        });
        setHazard(result);
      })();
      return () => {
        alive = false;
      };
    }, [center])
  );

  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const res = await resolveLocationLabel(); // respects mock flag
          if (!alive) return;
          const lat = res.coords.latitude;
          const lon = res.coords.longitude;
          setCenter({ lat, lon });

          // move the Leaflet camera without reloading the WebView
          mapRef.current?.recenter(lat, lon, 13);
        } catch {
          // ignore; keep previous center
        }
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const recenterToMe = async () => {
    try {
      setRecenterLoading(true);
      const res = await resolveLocationLabel();
      setCenter({ lat: res.coords.latitude, lon: res.coords.longitude });
      mapRef.current?.recenter(res.coords.latitude, res.coords.longitude, 13);
    } finally {
      setRecenterLoading(false);
    }
  };

  const selectOverlay = (kind) => {
    setOverlay(kind);
    mapRef.current?.setOverlay(kind);
  };

  // -------- Banner helpers ----------
  const isFlood = hazard.kind === "flood";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeAgoStr = "10 min ago";
  const locLabel = isFlood ? hazard.locationName || "Clementi Park" : null;

  // Bottom nav items (FlatList) incl. Dengue
  const navItems = useMemo(
    () => [
      {
        key: "rain",
        icon: "weather-rainy",
        label: t("home.metric.rain", "Rainfall"),
      },
      {
        key: "wind",
        icon: "weather-windy",
        label: t("home.metric.wind", "Wind"),
      },
      {
        key: "temp",
        icon: "thermometer",
        label: t("home.metric.temp", "Temp"),
      },
      {
        key: "hum",
        icon: "water-percent",
        label: t("home.metric.hum", "Humidity"),
      },
      { key: "pm", icon: "blur", label: t("home.metric.pm", "PM2.5") },
      {
        key: "dengue",
        img: DENGUE_ICON,
        label: t("home.metric.dengue", "Dengue"),
      },
    ],
    [t]
  );

  const renderNavItem = ({ item }) => {
    const isActive = item.key === overlay;
    return (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.metricItem,
          isActive && { borderWidth: 2, borderColor: theme.colors.primary },
        ]}
        activeOpacity={0.8}
        onPress={() => selectOverlay(item.key)}
        accessibilityRole="button"
        accessibilityLabel={item.label}
      >
        {item.img ? (
          <Image
            source={item.img}
            style={[styles.metricIcon, { tintColor: theme.colors.primary }]}
            accessible={false}
          />
        ) : (
          <MaterialCommunityIcons
            name={item.icon}
            size={30}
            color={theme.colors.primary}
          />
        )}
        <Text style={styles.metricText}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container]}>
      <LeafletMapWebView
        ref={mapRef}
        lat={center.lat}
        lon={center.lon}
        height={"100%"}
        zoom={13}
        showMarker
        interactive
        pins={presetPin}
        rainfallPoints={rainPoints}
        windPoints={windPoints}
        tempPoints={tempPoints}
        humPoints={humPoints}
        pmPoints={pmPoints}
        dengueGeoJSON={dengueGeoJSON}
        overlay={overlay}
        showLegend
        legendBottom={sheetHeight + 12}
        dark={theme.key === "dark"}
      />

      {/* top-left back */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel={t("common.back", "Back")}
      >
        <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
      </TouchableOpacity>

      {/* recenter (bottom-right, above warning) */}
      <TouchableOpacity
        style={[
          styles.recenterBtn,
          { bottom: sheetHeight + 12 },
          recenterLoading && { opacity: 0.7 },
        ]}
        onPress={recenterToMe}
        disabled={recenterLoading}
        accessibilityRole="button"
        accessibilityLabel={t("home.map.recenter", "Recenter to my location")}
      >
        <Ionicons name="locate" size={22} color={theme.colors.text} />
      </TouchableOpacity>

      {/* bottom sheet wrapper */}
      <View style={styles.bottomSheet} onLayout={onSheetLayout}>
        {/* warning banner */}
        <HazardBanner
          hazard={hazard}
          dateStr={dateStr}
          timeAgoStr={timeAgoStr}
          locLabel={
            hazard.kind === "flood"
              ? hazard.locationName || "Clementi Park"
              : null
          }
          style={{ marginBottom: 10 }} // spacing above the metric bar
        />

        {/* metric bar */}
        <View>
          <FlatList
            data={navItems}
            keyExtractor={(i) => i.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.edgeToEdge}
            contentContainerStyle={styles.metricListContent}
            renderItem={renderNavItem}
          />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (theme) => {
  const sheetBg =
    theme.key === "dark" ? "rgba(25,25,27,0.92)" : "rgba(255,255,255,0.75)";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.appBg },

    bottomSheet: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: sheetBg,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingTop: 10,
      paddingHorizontal: 12,
      paddingBottom: 10,
      shadowColor: "#000",
      shadowOpacity: theme.key === "dark" ? 0.35 : 0.15,
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 10,
      elevation: 12,
    },

    backBtn: {
      position: "absolute",
      top: 14,
      left: 12,
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.colors.card,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: theme.key === "dark" ? 0.3 : 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },

    recenterBtn: {
      position: "absolute",
      right: 12,
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.card,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: theme.key === "dark" ? 0.35 : 0.16,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 3,
    },

    edgeToEdge: { marginHorizontal: -16 },

    metricListContent: {
      flexGrow: 1,
      justifyContent: "space-between",
      paddingVertical: 1,
      paddingHorizontal: 15,
    },
    metricItem: {
      backgroundColor: theme.colors.card,
      marginHorizontal: 4,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      minWidth: 70,
      height: 80,
      shadowColor: "#000",
      shadowOpacity: theme.key === "dark" ? 0.25 : 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    metricIcon: { width: 30, height: 30, resizeMode: "contain" },
    metricText: {
      fontSize: 12,
      marginTop: 4,
      color: theme.colors.text,
      fontWeight: "600",
      textAlign: "center",
    },
  });
};
