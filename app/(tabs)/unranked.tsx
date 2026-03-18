import { View, Text, FlatList, Image, ActivityIndicator, Pressable } from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';
import { getDatabase } from '@/lib/database';
import { getUnrankedMovies } from '@/lib/movieRepository';
import { applyFilters } from '@/lib/movieFilters';
import { SearchFilterBar } from '@/lib/components/SearchFilterBar';
import type { Movie } from '@/lib/schema';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function StarRating({ rating, movieId }: { rating: number | null; movieId: string }) {
  if (rating === null) return null;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <View testID={`movie-rating-${movieId}`} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
      {Array.from({ length: fullStars }, (_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={14} color="#FFD700" />
      ))}
      {hasHalf && <Ionicons name="star-half" size={14} color="#FFD700" />}
    </View>
  );
}

function MovieItem({ movie, onPress, onRank }: { movie: Movie; onPress: () => void; onRank: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <View
        testID={`movie-item-${movie.id}`}
      style={{
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceLight,
      }}
    >
      {movie.posterUrl ? (
        <Image
          testID={`movie-poster-${movie.id}`}
          source={{ uri: movie.posterUrl }}
          style={{ width: 50, height: 75, borderRadius: 4 }}
        />
      ) : (
        <View
          testID={`movie-poster-placeholder-${movie.id}`}
          style={{
            width: 50,
            height: 75,
            borderRadius: 4,
            backgroundColor: theme.colors.surfaceLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="film-outline" size={24} color={theme.colors.textSecondary} />
        </View>
      )}
      <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
          {movie.title}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 }}>
          {movie.year}
        </Text>
        <StarRating rating={movie.letterboxdRating} movieId={movie.id} />
      </View>
      <Pressable
        testID={`rank-button-${movie.id}`}
        onPress={(e) => {
          e.stopPropagation();
          onRank();
        }}
        style={{
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
          alignSelf: 'center',
        }}
      >
        <Text style={{ color: theme.colors.background, fontSize: 13, fontWeight: '700' }}>Rank</Text>
      </Pressable>
    </View>
    </Pressable>
  );
}

export default function UnrankedScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);

  const filteredMovies = useMemo(
    () => applyFilters(movies, searchQuery, minRating),
    [movies, searchQuery, minRating],
  );

  const loadMovies = useCallback(async () => {
    try {
      const db = await getDatabase();
      const unranked = await getUnrankedMovies(db);
      setMovies(shuffleArray(unranked));
    } catch {
      // silently handle errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  const renderItem = useCallback(
    ({ item }: { item: Movie }) => (
      <MovieItem
        movie={item}
        onPress={() => router.push(`/movie/${item.id}`)}
        onRank={() => router.push({ pathname: '/comparison', params: { movieId: item.id } })}
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((item: Movie) => item.id, []);

  if (loading) {
    return (
      <View testID="unranked-screen" style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (movies.length === 0) {
    return (
      <View testID="unranked-screen" style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <View testID="unranked-empty">
          <Text style={{ color: theme.colors.text, fontSize: 18, textAlign: 'center' }}>
            Unranked Movies
          </Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            Import a CSV to add movies
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View testID="unranked-screen" style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        minRating={minRating}
        onMinRatingChange={setMinRating}
      />
      <FlatList
        testID="movie-list"
        data={filteredMovies}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}
