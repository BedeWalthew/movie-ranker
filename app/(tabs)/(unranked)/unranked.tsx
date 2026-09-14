import { View, Text, FlatList, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";
import { getDatabase } from "@/lib/database";
import { getUnrankedMovies } from "@/lib/movieRepository";
import { applyFilters } from "@/lib/movieFilters";
import { Poster } from "@/lib/components/Poster";
import { StarRating } from "@/lib/components/StarRating";
import { StarFilter } from "@/lib/components/StarFilter";
import { SprocketRail, RAIL_WIDTH } from "@/lib/components/SprocketRail";
import { useRefresh } from "@/lib/refreshContext";
import { useScreenSearch } from "@/lib/screenSearch";
import type { Movie } from "@/lib/schema";

const THUMB_W = 44;
const THUMB_H = 66;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function MovieRow({
  movie,
  onPress,
  onRank,
}: {
  movie: Movie;
  onPress: () => void;
  onRank: () => void;
}) {
  return (
    <View style={styles.row} testID={`movie-item-${movie.id}`}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${movie.title}, ${movie.year}`}
        accessibilityHint="Opens the film"
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.6 }]}
      >
        <Poster
          uri={movie.posterUrl}
          width={THUMB_W}
          height={THUMB_H}
          radius={2}
          testID={`movie-poster-${movie.id}`}
          placeholderTestID={`movie-poster-placeholder-${movie.id}`}
        />
        <View style={styles.rowText}>
          <Text style={styles.title} numberOfLines={2}>
            {movie.title}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.year}>{movie.year}</Text>
            <StarRating rating={movie.letterboxdRating} size={11} testID={`movie-rating-${movie.id}`} />
          </View>
        </View>
      </Pressable>
      <Pressable
        testID={`rank-button-${movie.id}`}
        onPress={onRank}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Rank ${movie.title}`}
        style={({ pressed }) => [styles.rankButton, pressed && { backgroundColor: theme.colors.primaryPressed }]}
      >
        <Text style={styles.rankLabel}>Rank</Text>
      </Pressable>
    </View>
  );
}

export default function UnrankedScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [minRating, setMinRating] = useState<number | null>(null);
  const { refreshKey } = useRefresh();
  const { query, filtering } = useScreenSearch();
  const insets = useSafeAreaInsets();

  const filteredMovies = useMemo(
    () => applyFilters(movies, query, minRating),
    [movies, query, minRating],
  );

  const loadMovies = useCallback(async () => {
    try {
      const db = await getDatabase();
      const unranked = await getUnrankedMovies(db);
      setMovies(shuffleArray(unranked));
    } catch {
      // The list simply stays as it was.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMovies();
    }, [loadMovies]),
  );

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadMovies();
  }, [refreshKey, loadMovies]);

  const renderItem = useCallback(
    ({ item }: { item: Movie }) => (
      <MovieRow
        movie={item}
        onPress={() => router.push(`/movie/${item.id}`)}
        onRank={() => router.push({ pathname: "/comparison", params: { movieId: item.id } })}
      />
    ),
    [router],
  );

  if (loading) {
    return (
      <View testID="unranked-screen" style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (movies.length === 0) {
    return (
      <View testID="unranked-screen" style={styles.screen}>
        <SprocketRail side="left" />
        <SprocketRail side="right" />
        <View testID="unranked-empty" style={styles.emptyGate}>
          <Text style={styles.emptyTitle}>The reel is empty</Text>
          <Text style={styles.emptyBody}>
            Export your watched films from Letterboxd, then choose Import CSV from the menu. Every film lands here until you rank it.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View testID="unranked-screen" style={styles.screen}>
      {filtering && <StarFilter minRating={minRating} onChange={setMinRating} />}
      <View style={styles.strip}>
        <SprocketRail side="left" />
        <SprocketRail side="right" />
        <FlatList
          testID="movie-list"
          data={filteredMovies}
          renderItem={renderItem}
          keyExtractor={(m) => m.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 72 }]}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={
            <Text style={styles.count}>
              {filteredMovies.length === movies.length
                ? `${movies.length} to rank`
                : `${filteredMovies.length} of ${movies.length}`}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyGate}>
              <Text style={styles.emptyTitle}>No match</Text>
              <Text style={styles.emptyBody}>
                {minRating
                  ? `Nothing unranked is rated ${minRating} stars or more${query ? ` and matches “${query}”` : ""}.`
                  : `Nothing unranked matches “${query}”.`}
              </Text>
            </View>
          }
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
        />
      </View>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  strip: { flex: 1 },
  listContent: {
    paddingHorizontal: RAIL_WIDTH,
    paddingBottom: 24,
  },
  count: {
    fontFamily: theme.fonts.displayMedium,
    fontSize: 15,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 14,
    minHeight: THUMB_H + 20,
  },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  rowText: { flex: 1, justifyContent: "center" },
  title: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    lineHeight: 21,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: theme.colors.text,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  year: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  rankButton: {
    minHeight: 36,
    minWidth: 64,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  rankLabel: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: theme.colors.onPrimary,
    includeFontPadding: false,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.surfaceLight,
    marginLeft: 16 + THUMB_W + 14,
  },
  emptyGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 26,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: theme.colors.text,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});
