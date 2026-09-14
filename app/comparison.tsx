import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { theme } from "@/lib/theme";
import { getDatabase } from "@/lib/database";
import type { SQLiteDatabase } from "expo-sqlite";
import { getRankedMovies, insertMovieAtRank, getMovieById, moveMovieToRank } from "@/lib/movieRepository";
import { getRankMode, setRankMode, type RankMode } from "@/lib/settingsRepository";
import { resolveInsertionPosition, type ComparisonState } from "@/lib/binaryInsertion";
import { describeSlot, initialSlotGap } from "@/lib/slotInsertion";
import { Poster } from "@/lib/components/Poster";
import { SprocketRail, RAIL_WIDTH } from "@/lib/components/SprocketRail";
import { SlotReel, SLOT_REEL_W } from "@/lib/components/SlotReel";
import { CountdownNumeral } from "@/lib/components/CountdownNumeral";
import { Icon } from "@/lib/components/Icon";
import type { Movie } from "@/lib/schema";

// A movie that's already ranked keeps its rank until the new position is
// known, so abandoning a re-rank (e.g. swiping the modal away) changes nothing.
async function placeMovie(db: SQLiteDatabase, movie: Movie, position: number) {
  if (movie.rank !== null) {
    await moveMovieToRank(db, movie.id, position);
  } else {
    await insertMovieAtRank(db, movie.id, position);
  }
}

const LIT_MS = 180;
const ARROW_W = 40;

const MODES: { value: RankMode; label: string; hint: string }[] = [
  { value: "pick", label: "Pick", hint: "Pick mode: choose between two films" },
  { value: "slot", label: "Slot", hint: "Slot mode: scroll the reel to the gap it belongs in" },
];

function ModeSwitch({ mode, onChange }: { mode: RankMode; onChange: (mode: RankMode) => void }) {
  return (
    <View style={styles.modeSwitch}>
      {MODES.map(({ value, label, hint }) => {
        const selected = mode === value;
        return (
          <Pressable
            key={value}
            testID={`rank-mode-${value}`}
            onPress={() => onChange(value)}
            hitSlop={{ top: 6, bottom: 6 }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={hint}
            style={({ pressed }) => [
              styles.modeOption,
              selected && styles.modeOptionSelected,
              pressed && !selected && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Frame({
  movie,
  onPick,
  width,
  lit,
  dimmed,
}: {
  movie: Movie;
  onPick: () => void;
  width: number;
  lit: boolean;
  /** True while the other frame is lit: this one falls back for a beat. */
  dimmed: boolean;
}) {
  const posterH = Math.round(width * 1.5);
  const glow = useSharedValue(0);
  const fade = useSharedValue(0);
  useEffect(() => {
    glow.value = withTiming(lit ? 1 : 0, { duration: LIT_MS, easing: Easing.out(Easing.exp) });
    fade.value = withTiming(dimmed ? 1 : 0, { duration: LIT_MS, easing: Easing.out(Easing.exp) });
  }, [lit, dimmed, glow, fade]);
  const rimStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  // Both frames are in the gate, so both rest fully lit; only the frame not
  // picked falls back while the pick registers.
  const darkStyle = useAnimatedStyle(() => ({ opacity: 0.6 * fade.value }));

  return (
    <Pressable
      testID={`comparison-card-${movie.id}`}
      onPress={onPick}
      accessibilityRole="button"
      accessibilityLabel={`Prefer ${movie.title}, ${movie.year}${movie.rank !== null ? `, currently ranked ${movie.rank}` : ""}`}
      style={({ pressed }) => [styles.frame, { width }, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={{ width, height: posterH }}>
        <Poster uri={movie.posterUrl} width={width} height={posterH} />
        <Animated.View pointerEvents="none" style={[styles.dark, darkStyle]} />
        <Animated.View pointerEvents="none" style={[styles.rim, rimStyle]} />
        {movie.rank !== null && (
          <View style={styles.rankBadge}>
            <CountdownNumeral value={movie.rank} size="sm" />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {movie.title}
      </Text>
      {/* No stars here on purpose: a pick should come from memory of the
          film, not from the rating you gave it. */}
      <Text style={styles.year}>{movie.year}</Text>
    </Pressable>
  );
}

/**
 * The film to place waits on the left, pointing at the gate; the ranked
 * films scroll past on the right until the gap it belongs in lines up.
 */
function SlotMode({
  movie,
  ranked,
  gap,
  onFocusGap,
  onPlace,
  screenW,
}: {
  movie: Movie;
  ranked: Movie[];
  gap: number;
  onFocusGap: (gap: number) => void;
  onPlace: () => void;
  screenW: number;
}) {
  const contentW = screenW - (RAIL_WIDTH + 16) * 2;
  const posterW = Math.min(150, contentW - ARROW_W - SLOT_REEL_W);
  const posterH = Math.round(posterW * 1.5);
  const rank = gap + 1;

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.heading}>Where does it go?</Text>
      </View>

      <View style={styles.slotBody}>
        <View style={{ width: posterW, height: posterH }}>
          <Poster uri={movie.posterUrl} width={posterW} height={posterH} />
          <View pointerEvents="none" style={styles.slotRim} />
          <View style={[styles.slotLabel, { top: posterH + 14 }]}>
            <Text style={styles.slotTitle} numberOfLines={2}>
              {movie.title}
            </Text>
            <Text style={styles.year}>{movie.year}</Text>
          </View>
        </View>
        <View pointerEvents="none" style={[styles.arrow, { width: ARROW_W }]}>
          <View style={styles.arrowLine} />
          <Icon name="arrowtriangle.right.fill" size={10} color={theme.colors.lamp} />
        </View>
        <SlotReel testID="slot-reel" movies={ranked} initialGap={gap} onFocusGap={onFocusGap} />
      </View>

      <View style={styles.slotFooter}>
        <Pressable
          testID="slot-place-button"
          onPress={onPlace}
          accessibilityRole="button"
          accessibilityLabel={`Place ${movie.title} at number ${rank}`}
          style={({ pressed }) => [styles.placeButton, pressed && { backgroundColor: theme.colors.primaryPressed }]}
        >
          <Text style={styles.placeLabel}>{`Place at #${rank}`}</Text>
        </Pressable>
        <Text testID="slot-hint" style={styles.slotHint} numberOfLines={2}>
          {`${describeSlot(ranked, gap)}. Leaving now changes nothing.`}
        </Text>
      </View>
    </>
  );
}

export default function ComparisonScreen() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const [state, setState] = useState<ComparisonState | null>(null);
  const [ranked, setRanked] = useState<Movie[]>([]);
  const [mode, setMode] = useState<RankMode>("pick");
  const [slotGap, setSlotGap] = useState(0);
  const [loading, setLoading] = useState(true);
  const [litId, setLitId] = useState<string | null>(null);
  const dbRef = useRef<SQLiteDatabase | null>(null);
  const busy = useRef(false);

  const initialize = useCallback(async () => {
    try {
      const db = await getDatabase();
      dbRef.current = db;

      const [movie, allRanked, savedMode] = await Promise.all([
        getMovieById(db, movieId),
        getRankedMovies(db),
        // A lost preference is no reason to stop ranking.
        getRankMode(db).catch((): RankMode => "pick"),
      ]);
      if (!movie) {
        router.back();
        return;
      }

      // Compare against every other ranked movie; a movie being re-ranked is
      // left out of the comparisons but keeps its rank until placeMovie runs.
      const others = allRanked.filter((m) => m.id !== movieId);
      const initial = resolveInsertionPosition(others, movie);

      if (initial.isComplete) {
        await placeMovie(db, movie, initial.insertionPosition!);
        router.back();
        return;
      }

      setRanked(others);
      setSlotGap(initialSlotGap(others.length, movie.rank));
      setMode(savedMode);
      setState(initial);
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }, [movieId, router]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const chooseMode = useCallback((next: RankMode) => {
    setMode(next);
    if (dbRef.current) setRankMode(dbRef.current, next).catch(() => {});
  }, []);

  const handlePick = useCallback(
    async (preferredId: string) => {
      if (!state || busy.current) return;
      busy.current = true;
      setLitId(preferredId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await new Promise((r) => setTimeout(r, LIT_MS));

      const next = state.pick(preferredId);

      if (next.isComplete) {
        try {
          if (dbRef.current) await placeMovie(dbRef.current, state.movieToRank, next.insertionPosition!);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } finally {
          router.back();
        }
        return;
      }

      setLitId(null);
      setState(next);
      busy.current = false;
    },
    [state, router],
  );

  const handlePlace = useCallback(async () => {
    if (!state || busy.current) return;
    busy.current = true;
    try {
      if (dbRef.current) await placeMovie(dbRef.current, state.movieToRank, slotGap + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } finally {
      router.back();
    }
  }, [state, slotGap, router]);

  if (loading || !state) {
    return (
      <View testID="comparison-screen" style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const gap = 12;
  const frameW = Math.floor((screenW - RAIL_WIDTH * 2 - 16 - gap) / 2);

  return (
    <View testID="comparison-screen" style={styles.screen}>
      <SprocketRail side="left" />
      <SprocketRail side="right" />
      <View style={styles.grabber} />
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Stop ranking, keep everything as it was"
        hitSlop={10}
        style={({ pressed }) => [styles.close, pressed && { opacity: 0.5 }]}
      >
        <Icon name="xmark" size={16} color={theme.colors.textSecondary} />
      </Pressable>
      <ModeSwitch mode={mode} onChange={chooseMode} />

      {mode === "slot" ? (
        <SlotMode
          movie={state.movieToRank}
          ranked={ranked}
          gap={slotGap}
          onFocusGap={setSlotGap}
          onPlace={handlePlace}
          screenW={screenW}
        />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.heading}>Which do you prefer?</Text>
            <View style={styles.progress}>
              <CountdownNumeral value={state.comparisonNumber} size="sm" />
              <Text testID="comparison-progress" style={styles.progressText}>
                of about {state.estimatedTotal}
              </Text>
            </View>
          </View>

          <View style={[styles.frames, { gap }]}>
            <Frame
              movie={state.movieToRank}
              width={frameW}
              lit={litId === state.movieToRank.id}
              dimmed={litId !== null && litId !== state.movieToRank.id}
              onPick={() => handlePick(state.movieToRank.id)}
            />
            <Frame
              movie={state.comparisonMovie!}
              width={frameW}
              lit={litId === state.comparisonMovie!.id}
              dimmed={litId !== null && litId !== state.comparisonMovie!.id}
              onPick={() => handlePick(state.comparisonMovie!.id)}
            />
          </View>

          <Text style={styles.hint}>
            Tap the film you liked more. Leaving now changes nothing.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, paddingTop: 12 },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceLight,
  },
  close: {
    position: "absolute",
    top: 22,
    right: RAIL_WIDTH + 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  modeSwitch: {
    alignSelf: "center",
    flexDirection: "row",
    marginTop: 5,
    height: 32,
    padding: 2,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(200,128,30,0.45)",
  },
  modeOption: {
    minWidth: 64,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  modeOptionSelected: { backgroundColor: theme.colors.primary },
  modeLabel: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 15,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: theme.colors.primary,
    includeFontPadding: false,
  },
  modeLabelSelected: { color: theme.colors.onPrimary },
  header: {
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: RAIL_WIDTH + 16,
    gap: 14,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: theme.colors.lamp,
    textAlign: "center",
  },
  progress: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  frames: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 24,
    paddingHorizontal: RAIL_WIDTH + 8,
  },
  frame: { alignItems: "stretch" },
  dark: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.frame,
    backgroundColor: theme.colors.background,
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.frame,
    borderWidth: 2,
    borderColor: theme.colors.lamp,
  },
  rankBadge: { position: "absolute", right: 8, top: 8 },
  title: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    lineHeight: 21,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: theme.colors.text,
    marginTop: 16,
  },
  year: { fontSize: 13, color: theme.colors.textSecondary, fontVariant: ["tabular-nums"], marginTop: 4 },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: RAIL_WIDTH + 32,
    paddingBottom: 48,
  },
  slotBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: RAIL_WIDTH + 16,
  },
  slotRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.frame,
    borderWidth: 1,
    borderColor: "rgba(244,227,178,0.55)",
  },
  slotLabel: { position: "absolute", left: 0, right: 0 },
  slotTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    lineHeight: 21,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: theme.colors.text,
  },
  arrow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 6,
  },
  arrowLine: {
    flex: 1,
    height: 1,
    marginRight: -2,
    backgroundColor: "rgba(244,227,178,0.55)",
  },
  slotFooter: {
    paddingTop: 16,
    paddingHorizontal: RAIL_WIDTH + 24,
    paddingBottom: 40,
  },
  placeButton: {
    minHeight: 50,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  placeLabel: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.onPrimary,
    includeFontPadding: false,
  },
  slotHint: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    minHeight: 36,
  },
});
