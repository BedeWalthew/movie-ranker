import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/lib/theme";
import { getDatabase } from "@/lib/database";
import type { SQLiteDatabase } from "expo-sqlite";
import {
  getRankedMovies,
  insertMovieAtRank,
  getMovieById,
  moveMovieToRank,
} from "@/lib/movieRepository";
import {
  resolveInsertionPosition,
  type ComparisonState,
} from "@/lib/binaryInsertion";
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

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
      {Array.from({ length: fullStars }, (_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={16} color="#992576" />
      ))}
      {hasHalf && <Ionicons name="star-half" size={16} color="#992576" />}
    </View>
  );
}

function MovieCard({
  movie,
  onPress,
  testIdPrefix,
}: {
  movie: Movie;
  onPress: () => void;
  testIdPrefix: string;
}) {
  return (
    <Pressable
      testID={`comparison-card-${testIdPrefix}`}
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        marginHorizontal: 6,
      }}
    >
      {movie.posterUrl ? (
        <Image
          source={{ uri: movie.posterUrl }}
          style={{ width: 120, height: 180, borderRadius: 8 }}
        />
      ) : (
        <View
          style={{
            width: 120,
            height: 180,
            borderRadius: 8,
            backgroundColor: theme.colors.surfaceLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="film-outline"
            size={40}
            color={theme.colors.textSecondary}
          />
        </View>
      )}
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 16,
          fontWeight: "600",
          marginTop: 10,
          textAlign: "center",
        }}
        numberOfLines={2}
      >
        {movie.title}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: 14,
          marginTop: 2,
        }}
      >
        {movie.year}
      </Text>
      <StarRating rating={movie.letterboxdRating} />
    </Pressable>
  );
}

export default function ComparisonScreen() {
  const router = useRouter();
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const [state, setState] = useState<ComparisonState | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbRef, setDbRef] = useState<any>(null);

  const initialize = useCallback(async () => {
    try {
      const db = await getDatabase();
      setDbRef(db);

      const movie = await getMovieById(db, movieId);
      if (!movie) {
        router.back();
        return;
      }

      // Compare against every other ranked movie; a movie being re-ranked is
      // left out of the comparisons but keeps its rank until placeMovie runs.
      const ranked = (await getRankedMovies(db)).filter(
        (m) => m.id !== movieId,
      );
      const initial = resolveInsertionPosition(ranked, movie);

      if (initial.isComplete) {
        await placeMovie(db, movie, initial.insertionPosition!);
        router.back();
        return;
      }

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

  const handlePick = useCallback(
    async (preferredId: string) => {
      if (!state) return;

      const next = state.pick(preferredId);

      if (next.isComplete) {
        try {
          await placeMovie(dbRef, state.movieToRank, next.insertionPosition!);
        } finally {
          router.back();
        }
        return;
      }

      setState(next);
    },
    [state, dbRef, router],
  );

  if (loading || !state) {
    return (
      <View
        testID="comparison-screen"
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      testID="comparison-screen"
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: 60,
      }}
    >
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 20,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        Which do you prefer?
      </Text>
      <Text
        testID="comparison-progress"
        style={{
          color: theme.colors.textSecondary,
          fontSize: 14,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Comparison {state.comparisonNumber} of ~{state.estimatedTotal}
      </Text>

      <View
        style={{
          flexDirection: "row",
          flex: 1,
          paddingHorizontal: 10,
          paddingBottom: 40,
        }}
      >
        <MovieCard
          movie={state.movieToRank}
          onPress={() => handlePick(state.movieToRank.id)}
          testIdPrefix={state.movieToRank.id}
        />
        <MovieCard
          movie={state.comparisonMovie!}
          onPress={() => handlePick(state.comparisonMovie!.id)}
          testIdPrefix={state.comparisonMovie!.id}
        />
      </View>
    </View>
  );
}
