import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  AccessibilityInfo,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type CellRendererProps,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";
import { Poster } from "@/lib/components/Poster";
import { CountdownNumeral } from "@/lib/components/CountdownNumeral";
import { SprocketRail, RAIL_WIDTH } from "@/lib/components/SprocketRail";
import type { Movie } from "@/lib/schema";

export const POSTER_W = 192;
export const POSTER_H = 288;
const CAPTION_H = 64;
export const FRAME_H = POSTER_H + CAPTION_H;
/** Distance between frames. Smaller than a frame, so neighbours tuck under the lit one. */
export const PITCH = 236;
const COPIES = 3;
/** The gate sits this much above the visible centre so the next frame peeks below the caption. */
const GATE_LIFT = 56;

// Reanimated's own FlatList reserves CellRendererComponent; the reel needs
// it to keep the lit frame above its neighbours.
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Movie>);

const FocusContext = createContext(0);

type ReelProps = {
  movies: Movie[];
  onOpen: (movie: Movie) => void;
  onRerank: (movie: Movie) => void;
  /** Rank to start on; the reel remembers where you left it. */
  initialRank?: number | null;
  onFocusRank?: (rank: number) => void;
  testID?: string;
};

/**
 * The reel: a vertical strip of frames threaded past a fixed gate. The
 * frame at the gate is lit; the others fall back into the dark. Ranks wrap,
 * so #1 follows the last.
 */
export function Reel({ movies, onOpen, onRerank, initialRank, onFocusRank, testID }: ReelProps) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Movie>>(null);
  const [reelHeight, setReelHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [focused, setFocused] = useState(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  const n = movies.length;
  const looped = n >= 2;
  const data = useMemo(
    () => (looped ? Array.from({ length: COPIES }, () => movies).flat() : movies),
    [movies, looped],
  );
  const middle = looped ? n : 0;

  const startIndex = useMemo(() => {
    const i = initialRank ? movies.findIndex((m) => m.rank === initialRank) : 0;
    return middle + Math.max(0, i);
  }, [movies, initialRank, middle]);

  // The list opens on startIndex without a scroll event, so the shared value
  // starts there too or the wrong frame lights up.
  const scrollY = useSharedValue(startIndex * PITCH);

  // The floating tab bar covers the bottom of the reel, so the gate sits at
  // the centre of what is actually visible while frames still run under it.
  const insets = useSafeAreaInsets();
  const tabBar = insets.bottom + 50;
  const paddingTop = Math.max(0, (reelHeight - tabBar - PITCH) / 2 - GATE_LIFT);
  const paddingBottom = paddingTop + tabBar + GATE_LIFT * 2;

  // Haptic tick and focus callback when a new frame reaches the gate.
  const focusedIndex = useDerivedValue(() => Math.round(scrollY.value / PITCH));
  const lastFocused = useRef(-1);
  const announceFocus = useCallback(
    (index: number) => {
      if (index === lastFocused.current) return;
      const first = lastFocused.current === -1;
      lastFocused.current = index;
      setFocused(index);
      const movie = data[index];
      if (!movie) return;
      if (!first) Haptics.selectionAsync().catch(() => {});
      if (movie.rank !== null) onFocusRank?.(movie.rank);
    },
    [data, onFocusRank],
  );
  useDerivedValue(() => {
    scheduleOnRN(announceFocus, focusedIndex.value);
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  // Silent wrap: when the scroll settles in an outer copy, jump to the same
  // frame in the middle copy.
  const rewrap = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!looped) return;
      const index = Math.round(e.nativeEvent.contentOffset.y / PITCH);
      if (index < n * 0.5 || index >= n * 2.5) {
        const wrapped = middle + (((index % n) + n) % n);
        listRef.current?.scrollToOffset({ offset: wrapped * PITCH, animated: false });
      }
    },
    [looped, n, middle],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Movie; index: number }) => (
      <Frame
        movie={item}
        index={index}
        scrollY={scrollY}
        width={width}
        reduceMotion={reduceMotion}
        onOpen={() => onOpen(item)}
        onRerank={() => onRerank(item)}
        // Only the middle copy carries testIDs, so each film has one handle.
        primary={index >= middle && index < middle + n}
      />
    ),
    [scrollY, width, reduceMotion, onOpen, onRerank, middle, n],
  );

  return (
    <View
      style={styles.reel}
      onLayout={(e: LayoutChangeEvent) => setReelHeight(e.nativeEvent.layout.height)}
    >
      <SprocketRail side="left" scrollY={scrollY} />
      <SprocketRail side="right" scrollY={scrollY} />
      <FocusContext.Provider value={focused}>
        <AnimatedFlatList
          ref={listRef}
          testID={testID}
          data={data}
          keyExtractor={(m, i) => `${m.id}-${i}`}
          renderItem={renderItem}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={rewrap}
          onScrollEndDrag={rewrap}
          showsVerticalScrollIndicator={false}
          snapToInterval={PITCH}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          initialScrollIndex={startIndex}
          // Offsets ignore the top padding on purpose: initialScrollIndex then
          // lands item i at offset i * PITCH, which is exactly where it sits in
          // the gate. The virtualisation window is far wider than the padding.
          getItemLayout={(_, index) => ({ length: PITCH, offset: index * PITCH, index })}
          contentContainerStyle={{ paddingTop, paddingBottom }}
          initialNumToRender={7}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews={false}
          extraData={focused}
          CellRendererComponent={Cell}
          style={{ overflow: "visible" }}
        />
      </FocusContext.Provider>
    </View>
  );
}

/** Cells stack so the frame in the gate sits above its neighbours. */
function Cell({ children, style, index, ...rest }: CellRendererProps<Movie>) {
  const focused = useContext(FocusContext);
  return (
    <View {...rest} style={[style, { zIndex: 100 - Math.min(99, Math.abs(index - focused) * 10) }]}>
      {children}
    </View>
  );
}

function Frame({
  movie,
  index,
  scrollY,
  width,
  reduceMotion,
  onOpen,
  onRerank,
  primary,
}: {
  movie: Movie;
  index: number;
  scrollY: SharedValue<number>;
  width: number;
  reduceMotion: boolean;
  onOpen: () => void;
  onRerank: () => void;
  primary: boolean;
}) {
  const tid = (suffix: string) => (primary ? `${suffix}-${movie.id}` : undefined);
  // d: how many frames this one is from the gate. 0 = lit.
  const frameStyle = useAnimatedStyle(() => {
    const d = (index * PITCH - scrollY.value) / PITCH;
    const scale = reduceMotion
      ? 1
      : interpolate(Math.abs(d), [0, 1, 2], [1, 0.8, 0.7], Extrapolation.CLAMP);
    // Neighbours tuck toward the gate so they read as the strip behind it; the
    // one below tucks less so it still shows under the lit frame's caption.
    const tuck = reduceMotion ? 0 : interpolate(d, [-2, -1, 0, 1, 2], [56, 34, 0, -10, -20]);
    return {
      transform: [{ translateY: tuck }, { scale }],
    };
  });

  const darkStyle = useAnimatedStyle(() => {
    const d = Math.abs((index * PITCH - scrollY.value) / PITCH);
    return { opacity: interpolate(d, [0, 0.5, 1, 2], [0, 0.4, 0.7, 0.86], Extrapolation.CLAMP) };
  });

  const litStyle = useAnimatedStyle(() => {
    const d = Math.abs((index * PITCH - scrollY.value) / PITCH);
    return { opacity: interpolate(d, [0, 0.5], [1, 0], Extrapolation.CLAMP) };
  });

  const captionStyle = useAnimatedStyle(() => {
    const d = Math.abs((index * PITCH - scrollY.value) / PITCH);
    return { opacity: interpolate(d, [0, 0.6], [1, 0], Extrapolation.CLAMP) };
  });

  return (
    <Animated.View
      style={[styles.frame, { width, height: PITCH }, frameStyle]}
      testID={tid("ranked-item")}
    >
      <View style={[styles.frameBody, { width: POSTER_W }]}>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${movie.title}, ${movie.year}, ranked ${movie.rank}`}
          style={styles.posterWrap}
        >
          <Animated.View style={[styles.litShadow, litStyle]} />
          <Poster
            uri={movie.posterUrl}
            width={POSTER_W}
            height={POSTER_H}
            testID={tid("ranked-poster")}
            placeholderTestID={tid("ranked-poster-placeholder")}
          />
          <Animated.View pointerEvents="none" style={[styles.rim, litStyle]} />
          <Animated.View pointerEvents="none" style={[styles.dark, darkStyle]} />
        </Pressable>

        <Animated.View pointerEvents="none" style={[styles.captionGround, captionStyle]} />
        <Animated.View style={[styles.caption, captionStyle]}>
          <View style={styles.numeral}>
            <CountdownNumeral value={movie.rank ?? "–"} size="lg" testID={tid("ranked-number")} />
          </View>
          <View style={styles.captionText}>
            <Text style={styles.title} numberOfLines={2}>
              {movie.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.year}>{movie.year}</Text>
              <Pressable
                testID={tid("rerank-button")}
                onPress={onRerank}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Re-rank ${movie.title}`}
                style={({ pressed }) => [styles.rerank, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.rerankLabel}>Re-rank</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  reel: {
    flex: 1,
    backgroundColor: theme.colors.background,
    overflow: "hidden",
  },
  frame: {
    alignItems: "center",
    paddingHorizontal: RAIL_WIDTH,
  },
  frameBody: {
    height: FRAME_H,
  },
  captionGround: {
    // The lit frame's caption sits on the strip, not over the next poster.
    position: "absolute",
    left: -RAIL_WIDTH * 2,
    right: -RAIL_WIDTH * 2,
    top: POSTER_H,
    height: CAPTION_H + 8,
    backgroundColor: theme.colors.background,
  },
  posterWrap: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: theme.radius.frame,
  },
  litShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.frame,
    backgroundColor: theme.colors.background,
    ...theme.shadow.lit,
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
  caption: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: -40,
    marginLeft: -28,
    width: POSTER_W + 56,
  },
  numeral: {
    ...theme.shadow.row,
  },
  captionText: {
    flex: 1,
    marginLeft: 10,
    marginTop: 44,
  },
  title: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 22,
    lineHeight: 23,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  year: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  rerank: {
    minHeight: 28,
    justifyContent: "center",
  },
  rerankLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.primary,
  },
});
