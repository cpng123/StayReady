// components/QuickTipsCarousel.js
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SCREEN_PADDING = 16;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function QuickTipsCarousel({ tips = [], theme, styles: s, onPressTip }) {
  const scrollRef = useRef(null);
  const [idx, setIdx] = useState(0);

  const CARD_W = SCREEN_WIDTH - SCREEN_PADDING * 2;
  const ITEM_SPACING = 10;

  // Auto-advance every 3.5s
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
  }, [tips.length]);

  const onMomentumEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / (CARD_W + ITEM_SPACING));
    setIdx(next);
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + ITEM_SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingRight: 16, paddingHorizontal: 15 }}
        style={{ marginHorizontal: -16 }}
      >
        {tips.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => onPressTip?.(item)}
            style={{ marginRight: ITEM_SPACING, paddingVertical: 3 }}
          >
            <View
              style={[
                s.tipCard,
                { backgroundColor: theme.colors.card, width: CARD_W },
              ]}
            >
              {/* Left color bar */}
              <View
                style={[s.tipBar, { backgroundColor: theme.colors.primary }]}
              />

              {/* Text content */}
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[s.tipTitle, { color: theme.colors.text }]}>
                  {String(item.categoryTitle ?? "")}
                </Text>

                {/* Fixed-height 2-line description */}
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

              {/* CTA column: icon on top, text below */}
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

      {/* Dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
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
