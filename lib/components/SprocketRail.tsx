import { useState } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { theme } from "@/lib/theme";

export const RAIL_WIDTH = 18;
export const HOLE_PITCH = 22;
const HOLE_W = 8;
const HOLE_H = 6;

/**
 * The perforated edge of a film strip. Absolutely positioned; give it
 * `side="left"` or `"right"` inside a relatively positioned parent. Pass a
 * scroll position as `scrollY` and the holes advance with the strip.
 */
export function SprocketRail({
  side,
  scrollY,
}: {
  side: "left" | "right";
  scrollY?: SharedValue<number>;
}) {
  const [height, setHeight] = useState(0);
  // One extra pitch so the pattern can slide by a full hole without a gap.
  const count = Math.ceil(height / HOLE_PITCH) + 2;

  const slide = useAnimatedStyle(() => {
    if (!scrollY) return { transform: [{ translateY: 0 }] };
    const phase = ((scrollY.value % HOLE_PITCH) + HOLE_PITCH) % HOLE_PITCH;
    return { transform: [{ translateY: -phase }] };
  });

  return (
    <View
      pointerEvents="none"
      onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}
      style={[styles.rail, side === "left" ? styles.left : styles.right]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, slide]}>
        {Array.from({ length: count }, (_, i) => (
          <View
            key={i}
            style={[styles.hole, { top: i * HOLE_PITCH + (HOLE_PITCH - HOLE_H) / 2 }]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: RAIL_WIDTH,
    backgroundColor: theme.colors.rail,
    overflow: "hidden",
  },
  left: { left: 0, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.colors.surfaceLight },
  right: { right: 0, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: theme.colors.surfaceLight },
  hole: {
    position: "absolute",
    left: (RAIL_WIDTH - HOLE_W) / 2,
    width: HOLE_W,
    height: HOLE_H,
    borderRadius: 1.5,
    backgroundColor: theme.colors.surfaceLight,
  },
});
