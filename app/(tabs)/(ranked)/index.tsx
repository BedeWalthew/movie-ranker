import { View, Text, ActivityIndicator, StyleSheet, Pressable } from "react-native";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { theme } from "@/lib/theme";
import { getDatabase } from "@/lib/database";
import {
  getRankedMovies,
  getRandomUnrankedMovie,
  getUnrankedCount,
} from "@/lib/movieRepository";
import { applyFilters } from "@/lib/movieFilters";
import { RankNudgeCard } from "@/lib/components/RankNudgeCard";
import { Reel } from "@/lib/components/Reel";
import { StarFilter } from "@/lib/components/StarFilter";
import { SprocketRail } from "@/lib/components/SprocketRail";
import { CountdownNumeral } from "@/lib/components/CountdownNumeral";
import { useRefresh } from "@/lib/refreshContext";
import { useScreenSearch } from "@/lib/screenSearch";
import type { Movie } from "@/lib/schema";

// The frame you left stays in the gate when you come back.
let rememberedRank: number | null = null;

export default function RankedScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [nudgeMovie, setNudgeMovie] = useState<Movie | null>(null);
  const [unrankedCount, setUnrankedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minRating, setMinRating] = useState<number | null>(null);
  const { refreshKey } = useRefresh();
  const { query, filtering } = useScreenSearch();

  const filteredMovies = useMemo(
    () => applyFilters(movies, query, minRating),
    [movies, query, minRating],
  );

  const loadMovies = useCallback(async () => {
    try {
      const db = await getDatabase();
      const [ranked, randomUnranked, count] = await Promise.all([
        getRankedMovies(db),
        getRandomUnrankedMovie(db),
        getUnrankedCount(db),
      ]);
      setMovies(ranked);
      setNudgeMovie(randomUnranked);
      setUnrankedCount(count ?? 0);
    } catch {
      // The reel simply stays as it was.
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

  const handleRerank = useCallback(
    (movie: Movie) => {
      router.push(`/comparison?movieId=${movie.id}&rerank=true`);
    },
    [router],
  );

  const handleOpen = useCallback(
    (movie: Movie) => {
      router.push(`/movie/${movie.id}`);
    },
    [router],
  );

  const handleNudgePress = useCallback(() => {
    if (nudgeMovie) {
      router.push({ pathname: "/comparison", params: { movieId: nudgeMovie.id } });
    }
  }, [nudgeMovie, router]);

  const rememberFocus = useCallback((rank: number) => {
    rememberedRank = rank;
  }, []);

  if (loading) {
    return (
      <View testID="ranked-screen" style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (movies.length === 0) {
    return (
      <View testID="ranked-screen" style={styles.screen}>
        {nudgeMovie && (
          <RankNudgeCard movie={nudgeMovie} onPress={handleNudgePress} remaining={unrankedCount} />
        )}
        <View style={styles.emptyReel}>
          <SprocketRail side="left" />
          <SprocketRail side="right" />
          <View style={styles.emptyGate}>
            <CountdownNumeral value={1} size="lg" lit={false} />
            <Text testID="ranked-placeholder" style={styles.emptyTitle}>
              Nothing in the gate yet
            </Text>
            <Text style={styles.emptyBody}>
              {nudgeMovie
                ? "Tap the amber bar to rank your first film. It takes one tap; every film after that takes a handful of picks."
                : "Add the films you have seen, or import a Letterboxd export from the menu. Then rank them one at a time."}
            </Text>
            {!nudgeMovie && (
              <Pressable
                testID="ranked-add-film"
                onPress={() => router.push("/add")}
                accessibilityRole="button"
                style={({ pressed }) => [styles.emptyAction, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.emptyActionLabel}>Add a film</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View testID="ranked-screen" style={styles.screen}>
      <Text testID="ranked-count" style={styles.count}>
        {movies.length === 1 ? "1 film ranked" : `${movies.length} films ranked`}
      </Text>
      {nudgeMovie && (
        <RankNudgeCard movie={nudgeMovie} onPress={handleNudgePress} remaining={unrankedCount} />
      )}
      {filtering && <StarFilter minRating={minRating} onChange={setMinRating} />}
      {filteredMovies.length === 0 ? (
        <View style={styles.emptyReel}>
          <SprocketRail side="left" />
          <SprocketRail side="right" />
          <View style={styles.emptyGate}>
            <Text style={styles.emptyTitle}>No ranked film matches</Text>
            <Text style={styles.emptyBody}>
              {minRating
                ? `Nothing ranked is rated ${minRating} stars or more${query ? ` and matches “${query}”` : ""}.`
                : `Nothing ranked matches “${query}”.`}
            </Text>
          </View>
        </View>
      ) : (
        <Reel
          testID="ranked-list"
          movies={filteredMovies}
          onOpen={handleOpen}
          onRerank={handleRerank}
          initialRank={rememberedRank}
          onFocusRank={rememberFocus}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  count: {
    fontFamily: theme.fonts.displayMedium,
    fontSize: 15,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.textSecondary,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyReel: { flex: 1, backgroundColor: theme.colors.background },
  emptyGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 26,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: theme.colors.text,
    textAlign: "center",
    marginTop: 8,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  emptyAction: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  emptyActionLabel: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: theme.colors.primary,
  },
});
