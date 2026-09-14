import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  AccessibilityInfo,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import { theme } from "@/lib/theme";
import { Poster } from "@/lib/components/Poster";
import { CountdownNumeral } from "@/lib/components/CountdownNumeral";
import { clampGap, describeSlot } from "@/lib/slotInsertion";
import type { Movie } from "@/lib/schema";

const POSTER_W = 104;
const POSTER_H = 156;
const CAPTION_H = 28;
/** Space between frames at rest. */
const GUTTER = 20;
/** How far the two frames either side of the gate part to open the slot. */
const SPREAD = 14;
export const SLOT_PITCH = GUTTER + POSTER_H + CAPTION_H;
/** Room left of the posters for the numeral that overhangs them. */
const NUMERAL_INSET = 14;
export const SLOT_REEL_W = NUMERAL_INSET + POSTER_W + 12;
const DASH_W = 6;
const DASH_GAP = 5;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Movie>);

type SlotReelProps = {
  /** The ranked films, best first, without the film being placed. */
  movies: Movie[];
  initialGap: number;
  onFocusGap: (gap: number) => void;
  testID?: string;
};

/**
 * A narrow reel of the ranked films that snaps to the gaps between frames
 * rather than to the frames. The gap level with the gate is where the film
 * being ranked will land. It does not wrap: the top and bottom are real ends.
 */
export function SlotReel({ movies, initialGap, onFocusGap, testID }: SlotReelProps) {
  const listRef = useRef<FlatList<Movie>>(null);
  const n = movies.length;
  const [startGap] = useState(() => clampGap(initialGap, n));
  const [gap, setGap] = useState(startGap);
  const [height, setHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  const scrollY = useSharedValue(startGap * SLOT_PITCH);

  // Ticks only once the reel has been handled, so settling on the start gap
  // when the sheet opens stays silent.
  const touched = useRef(false);
  const lastGap = useRef(startGap);
  const announceGap = useCallback(
    (next: number) => {
      const g = clampGap(next, n);
      if (g === lastGap.current) return;
      lastGap.current = g;
      setGap(g);
      if (touched.current) Haptics.selectionAsync().catch(() => {});
      onFocusGap(g);
    },
    [n, onFocusGap],
  );
  // A reaction, not a derived value: it fires only when the gap changes, so a
  // re-render can't re-announce a stale scroll position.
  useAnimatedReaction(
    () => Math.round(scrollY.value / SLOT_PITCH),
    (next, previous) => {
      if (previous !== null && next !== previous) scheduleOnRN(announceGap, next);
    },
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  // initialScrollIndex can only reach the gap above the last film; the gap
  // below it needs one more nudge once the padding exists.
  const placedStart = useRef(false);
  useEffect(() => {
    if (height === 0 || placedStart.current) return;
    placedStart.current = true;
    if (startGap < n) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: startGap * SLOT_PITCH, animated: false });
    });
  }, [height, startGap, n]);

  const moveBy = useCallback(
    (step: number) => {
      const target = clampGap(gap + step, n);
      touched.current = true;
      // Jump rather than animate, and move scrollY with it: an animated
      // scroll would report the old gap first and bounce the slot back.
      scrollY.value = target * SLOT_PITCH;
      listRef.current?.scrollToOffset({ offset: target * SLOT_PITCH, animated: false });
      announceGap(target);
    },
    [gap, n, announceGap],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Movie; index: number }) => (
      <SlotFrame movie={item} index={index} scrollY={scrollY} reduceMotion={reduceMotion} />
    ),
    [scrollY, reduceMotion],
  );

  const dashes = Math.floor(SLOT_REEL_W / (DASH_W + DASH_GAP));

  return (
    <View
      testID={testID}
      style={styles.reel}
      onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Slot"
      accessibilityHint="Swipe up or down to move the slot"
      accessibilityValue={{ text: `Number ${gap + 1}, ${describeSlot(movies, gap)}` }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e: AccessibilityActionEvent) =>
        moveBy(e.nativeEvent.actionName === "increment" ? 1 : -1)
      }
    >
      <AnimatedFlatList
        ref={listRef}
        data={movies}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        onScroll={scrollHandler}
        onScrollBeginDrag={() => {
          touched.current = true;
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={SLOT_PITCH}
        snapToAlignment="start"
        decelerationRate="fast"
        initialScrollIndex={Math.min(startGap, n - 1)}
        // As on the ranked reel, offsets ignore the top padding: offset
        // g * SLOT_PITCH puts gap g exactly at the gate.
        getItemLayout={(_, index) => ({ length: SLOT_PITCH, offset: index * SLOT_PITCH, index })}
        contentContainerStyle={{ paddingTop: height / 2, paddingBottom: height / 2 }}
        initialNumToRender={7}
        maxToRenderPerBatch={8}
        windowSize={9}
      />
      <View pointerEvents="none" style={[styles.gate, { top: height / 2 - 0.5 }]}>
        {Array.from({ length: dashes }, (_, i) => (
          <View key={i} style={styles.dash} />
        ))}
      </View>
    </View>
  );
}

function SlotFrame({
  movie,
  index,
  scrollY,
  reduceMotion,
}: {
  movie: Movie;
  index: number;
  scrollY: SharedValue<number>;
  reduceMotion: boolean;
}) {
  // d: how many frames this one's centre is from the gate. The two frames
  // either side of the slot rest at -0.5 and +0.5; both count as lit.
  const frameStyle = useAnimatedStyle(() => {
    const d = index + 0.5 - scrollY.value / SLOT_PITCH;
    const scale = reduceMotion
      ? 1
      : interpolate(Math.abs(d), [0.5, 1.5, 2.5], [1, 0.86, 0.76], Extrapolation.CLAMP);
    // Linear through the gate, so a frame crossing it never jumps.
    const spread = reduceMotion
      ? 0
      : interpolate(d, [-0.5, 0.5], [-SPREAD, SPREAD], Extrapolation.CLAMP);
    return { transform: [{ translateY: spread }, { scale }] };
  });

  const darkStyle = useAnimatedStyle(() => {
    const d = Math.abs(index + 0.5 - scrollY.value / SLOT_PITCH);
    return { opacity: interpolate(d, [0.5, 1.5, 2.5], [0, 0.7, 0.86], Extrapolation.CLAMP) };
  });

  const rimStyle = useAnimatedStyle(() => {
    const d = Math.abs(index + 0.5 - scrollY.value / SLOT_PITCH);
    return { opacity: interpolate(d, [0.5, 1], [1, 0], Extrapolation.CLAMP) };
  });

  const captionStyle = useAnimatedStyle(() => {
    const d = Math.abs(index + 0.5 - scrollY.value / SLOT_PITCH);
    return { opacity: interpolate(d, [0.5, 1.1], [1, 0], Extrapolation.CLAMP) };
  });

  // Ranks stay faintly readable as they scroll past, to find your place.
  const numeralStyle = useAnimatedStyle(() => {
    const d = Math.abs(index + 0.5 - scrollY.value / SLOT_PITCH);
    return { opacity: interpolate(d, [0.5, 2.5], [1, 0.45], Extrapolation.CLAMP) };
  });

  return (
    <Animated.View testID={`slot-frame-${movie.id}`} style={[styles.frame, frameStyle]}>
      <View style={styles.poster}>
        <Poster uri={movie.posterUrl} width={POSTER_W} height={POSTER_H} />
        <Animated.View pointerEvents="none" style={[styles.rim, rimStyle]} />
        <Animated.View pointerEvents="none" style={[styles.dark, darkStyle]} />
        <Animated.View style={[styles.numeral, numeralStyle]}>
          <CountdownNumeral value={movie.rank ?? "–"} size="sm" />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.title, captionStyle]} numberOfLines={1}>
        {movie.title}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  reel: {
    width: SLOT_REEL_W,
    alignSelf: "stretch",
    overflow: "hidden",
  },
  frame: {
    height: SLOT_PITCH,
    paddingTop: GUTTER / 2,
    paddingLeft: NUMERAL_INSET,
  },
  poster: {
    width: POSTER_W,
    height: POSTER_H,
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.frame,
    borderWidth: 1,
    borderColor: "rgba(244,227,178,0.55)",
  },
  dark: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.frame,
    backgroundColor: theme.colors.background,
  },
  numeral: {
    position: "absolute",
    left: -NUMERAL_INSET,
    top: -8,
    ...theme.shadow.row,
  },
  title: {
    width: POSTER_W,
    height: CAPTION_H - 8,
    marginTop: 8,
    fontFamily: theme.fonts.displayBold,
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: theme.colors.text,
  },
  gate: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    flexDirection: "row",
    gap: DASH_GAP,
  },
  dash: {
    width: DASH_W,
    height: 1,
    backgroundColor: "rgba(244,227,178,0.55)",
  },
});
