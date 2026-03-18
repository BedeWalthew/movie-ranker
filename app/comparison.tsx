import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { getDatabase } from '@/lib/database';
import { getRankedMovies, insertMovieAtRank, getMovieById, removeFromRanked } from '@/lib/movieRepository';
import { resolveInsertionPosition, type ComparisonState } from '@/lib/binaryInsertion';
import type { Movie } from '@/lib/schema';

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
      {Array.from({ length: fullStars }, (_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={16} color="#FFD700" />
      ))}
      {hasHalf && <Ionicons name="star-half" size={16} color="#FFD700" />}
    </View>
  );
}

function MovieCard({ movie, onPress, testIdPrefix }: { movie: Movie; onPress: () => void; testIdPrefix: string }) {
  return (
    <Pressable
      testID={`comparison-card-${testIdPrefix}`}
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
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
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="film-outline" size={40} color={theme.colors.textSecondary} />
        </View>
      )}
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 16,
          fontWeight: '600',
          marginTop: 10,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {movie.title}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 2 }}>
        {movie.year}
      </Text>
      <StarRating rating={movie.letterboxdRating} />
    </Pressable>
  );
}

export default function ComparisonScreen() {
  const router = useRouter();
  const { movieId, rerank } = useLocalSearchParams<{ movieId: string; rerank?: string }>();
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

      if (rerank === 'true') {
        await removeFromRanked(db, movieId);
      }

      const ranked = await getRankedMovies(db);
      const initial = resolveInsertionPosition(ranked, movie);

      if (initial.isComplete) {
        await insertMovieAtRank(db, movieId, initial.insertionPosition!);
        router.back();
        return;
      }

      setState(initial);
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }, [movieId, rerank, router]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handlePick = useCallback(
    async (preferredId: string) => {
      if (!state) return;

      const next = state.pick(preferredId);

      if (next.isComplete) {
        try {
          await insertMovieAtRank(dbRef, movieId, next.insertionPosition!);
        } finally {
          router.back();
        }
        return;
      }

      setState(next);
    },
    [state, dbRef, movieId, router],
  );

  if (loading || !state) {
    return (
      <View
        testID="comparison-screen"
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      testID="comparison-screen"
      style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: 60 }}
    >
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 20,
          fontWeight: '700',
          textAlign: 'center',
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
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        Comparison {state.comparisonNumber} of ~{state.estimatedTotal}
      </Text>

      <View style={{ flexDirection: 'row', flex: 1, paddingHorizontal: 10, paddingBottom: 40 }}>
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
