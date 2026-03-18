import { View, Text, FlatList, Image, ActivityIndicator, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { getDatabase } from '@/lib/database';
import { getRankedMovies } from '@/lib/movieRepository';
import type { Movie } from '@/lib/schema';

function StarRating({ rating, movieId }: { rating: number | null; movieId: string }) {
  if (rating === null) return null;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <View testID={`ranked-rating-${movieId}`} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
      {Array.from({ length: fullStars }, (_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={14} color="#FFD700" />
      ))}
      {hasHalf && <Ionicons name="star-half" size={14} color="#FFD700" />}
    </View>
  );
}

function RankedMovieItem({ movie, onRerank }: { movie: Movie; onRerank: (id: string) => void }) {
  return (
    <View
      testID={`ranked-item-${movie.id}`}
      style={{
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceLight,
        alignItems: 'center',
      }}
    >
      <Text
        testID={`ranked-number-${movie.id}`}
        style={{
          color: theme.colors.primary,
          fontSize: 18,
          fontWeight: '700',
          width: 36,
          textAlign: 'center',
        }}
      >
        {movie.rank}
      </Text>
      {movie.posterUrl ? (
        <Image
          testID={`ranked-poster-${movie.id}`}
          source={{ uri: movie.posterUrl }}
          style={{ width: 40, height: 60, borderRadius: 4 }}
        />
      ) : (
        <View
          testID={`ranked-poster-placeholder-${movie.id}`}
          style={{
            width: 40,
            height: 60,
            borderRadius: 4,
            backgroundColor: theme.colors.surfaceLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="film-outline" size={20} color={theme.colors.textSecondary} />
        </View>
      )}
      <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
          {movie.title}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 }}>
          {movie.year}{movie.director ? ` · ${movie.director}` : ''}
        </Text>
        <StarRating rating={movie.letterboxdRating} movieId={movie.id} />
      </View>
      <Pressable
        testID={`rerank-button-${movie.id}`}
        onPress={() => onRerank(movie.id)}
        style={{
          padding: 8,
          borderRadius: 8,
          backgroundColor: theme.colors.surfaceLight,
        }}
      >
        <Ionicons name="swap-vertical" size={20} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
}

export default function RankedScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMovies = useCallback(async () => {
    try {
      const db = await getDatabase();
      const ranked = await getRankedMovies(db);
      setMovies(ranked);
    } catch {
      // silently handle errors
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMovies();
    }, [loadMovies]),
  );

  const handleRerank = useCallback(
    (movieId: string) => {
      router.push(`/comparison?movieId=${movieId}&rerank=true`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Movie }) => <RankedMovieItem movie={item} onRerank={handleRerank} />,
    [handleRerank],
  );

  const keyExtractor = useCallback((item: Movie) => item.id, []);

  if (loading) {
    return (
      <View testID="ranked-screen" style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (movies.length === 0) {
    return (
      <View testID="ranked-screen" style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text testID="ranked-placeholder" style={{ color: theme.colors.text, fontSize: 18 }}>Ranked Movies</Text>
        <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Your ranked movies will appear here</Text>
      </View>
    );
  }

  return (
    <View testID="ranked-screen" style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        testID="ranked-list"
        data={movies}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}
