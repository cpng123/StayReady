/**
 * File: components/QuickTipsCarousel.js
 * Purpose: Render a horizontally swipeable, auto-advancing carousel of short
 *          preparedness tips with snap-to cards and an indicator dot row.
 *
 * Responsibilities:
 *  - Size each card to the device width minus horizontal screen padding.
 *  - Auto-advance every 3.5 seconds and keep the active index in sync.
 *  - Merge optional per-key style overrides from the parent with base styles.
 *  - Emit a press callback when a tip card is tapped.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Layout constants derived from screen width
const SCREEN_PADDING = 16;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function QuickTipsCarousel({
  tips = [],
  theme,
  styles: externalStyles, // optional parent overrides
  onPressTip,
}) {
  const scrollRef = useRef(null);
  const [idx, setIdx] = useState(0);

  // Width of a single card and spacing between cards
  const CARD_W = SCREEN_WIDTH - SCREEN_PADDING * 2;
  const ITEM_SPACING = 10;

  // Build base styles and shallow-merge known keys with parent overrides
  const base = useMemo(() => defaultStyles(theme), [theme]);
  const s = useMemo(
    () => ({
      ...base,
      ...(externalStyles || {}),
      tipCard: { ...base.tipCard, ...(externalStyles?.tipCard || {}) },
      tipBar: { ...base.tipBar, ...(externalStyles?.tipBar || {}) },
      tipTitle: { ...base.tipTitle, ...(externalStyles?.tipTitle || {}) },
      tipBodyWrap: {
        ...base.tipBodyWrap,
        ...(externalStyles?.tipBodyWrap || {}),
      },
      tipBody: { ...base.tipBody, ...(externalStyles?.tipBody || {}) },
    }),
    [base, externalStyles]
  );

  // Auto-advance every 3.5s (no-op if there are no tips)
  useEffect(() => {
    if (!tips.length) return;
    const t = setInterval(() => {
      setIdx((prev) => {
        const next = (prev + 1) % tips.length;
        scrollRef.current?.scrollTo({
          x: next * (CARD_W + ITEM_SPACING),
          animated: true,
        });
        return next;
      });
    }, 3500);
    return () => clearInterval(t);
  }, [tips.length, CARD_W]);

  // Sync active index when user swipes manually
  const onMomentumEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / (CARD_W + ITEM_SPACING));
    setIdx(next);
  };

  return (
    <>
      {/* Horizontal snapping list of tip cards */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + ITEM_SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{
          paddingRight: SCREEN_PADDING,
          paddingHorizontal: SCREEN_PADDING - 1,
        }}
        style={{ marginHorizontal: -SCREEN_PADDING }}
      >
        {tips.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.88}
            onPress={() => onPressTip?.(item)}
            style={{ marginRight: ITEM_SPACING, paddingVertical: 3 }}
          >
            <View
              style={[
                s.tipCard,
                { backgroundColor: theme.colors.card, width: CARD_W },
              ]}
            >
              {/* Left accent bar (uses theme primary color) */}
              <View
                style={[s.tipBar, { backgroundColor: theme.colors.primary }]}
              />

              {/* Text content */}
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[s.tipTitle, { color: theme.colors.text }]}>
                  {String(item.categoryTitle ?? "")}
                </Text>

                {/* Fixed-height two-line description clamp */}
                <View style={s.tipBodyWrap}>
                  <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    style={[s.tipBody, { color: theme.colors.subtext }]}
                  >
                    {String(item.text ?? "")}
                  </Text>
                </View>
              </View>

              {/* CTA column with forward icon */}
              <View
                style={{
                  width: 66,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingLeft: 6,
                }}
              >
                <Ionicons
                  name="chevron-forward-circle-outline"
                  size={34}
                  color={theme.colors.primary}
                  style={{ marginBottom: 4 }}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View
        style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}
      >
        {tips.map((_, i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              marginHorizontal: 4,
              backgroundColor:
                i === idx
                  ? theme.colors.primary
                  : theme.key === "dark"
                  ? "#374151"
                  : "#D1D5DB",
            }}
          />
        ))}
      </View>
    </>
  );
}

// Base styles for the carousel’s visual elements
function defaultStyles(theme) {
  return StyleSheet.create({
    tipCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      padding: 14,
      minHeight: 90,
      shadowColor: "#000",
      shadowOpacity: theme.key === "dark" ? 0.18 : 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    tipBar: {
      width: 4,
      alignSelf: "stretch",
      borderRadius: 3,
      marginRight: 10,
      opacity: 0.9,
    },
    tipTitle: {
      fontWeight: "800",
      fontSize: 14,
      marginBottom: 4,
      lineHeight: 18,
    },
    tipBodyWrap: {
      height: 36, // consistent two-line clamp height
      justifyContent: "flex-start",
      overflow: "hidden",
    },
    tipBody: { fontSize: 12, lineHeight: 18 },
  });
}
