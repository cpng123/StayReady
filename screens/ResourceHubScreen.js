// screens/ResourceHubScreen.js
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  FlatList,
  Dimensions,
} from "react-native";
import { PREPAREDNESS } from "../data/homeData";
import ImageOverlayCard from "../components/ImageOverlayCard";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";

const SCREEN_PADDING = 16;
const GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - SCREEN_PADDING * 2 - GAP) / 2);

export default function ResourceHubScreen({ navigation }) {
  const { theme } = useThemeContext();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation();

  const Header = (
    <View style={styles.headerCopy}>
      <Text style={styles.h1}>{t("resource.title", "Resource Hub")}</Text>
      <Text style={styles.p}>
        {t(
          "resource.tagline",
          "Stay ready for anything — explore guides, tips, and contacts to prepare for disasters, respond to emergencies, and stay safe in any situation."
        )}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top hero (single image) */}
      <View style={styles.hero}>
        <Image
          source={require("../assets/General/resource-hub.jpg")}
          style={styles.heroImg}
        />
      </View>

      {/* Grid (2 columns) */}
      <FlatList
        data={PREPAREDNESS}
        keyExtractor={(i) => i.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={Header}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING,
          paddingBottom: 60,
        }}
        renderItem={({ item }) => (
          <ImageOverlayCard
            title={t(`resource.prep_titles.${item.id}`, item.title)}
            source={item.img}
            width={CARD_WIDTH}
            height={120}
            style={{ marginBottom: GAP }}
            onPress={() =>
              navigation.navigate("PreparednessGuide", { id: item.id })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.appBg },

    hero: {
      height: 180,
      backgroundColor: theme.key === "dark" ? "#1F2937" : "#e7eef8",
    },
    heroImg: { width: SCREEN_WIDTH, height: "100%", resizeMode: "cover" },

    headerCopy: { paddingTop: 14, paddingBottom: 8 },
    h1: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.colors.text,
      marginBottom: 6,
    },
    p: { color: theme.colors.subtext, lineHeight: 20, marginBottom: 8 },
  });
