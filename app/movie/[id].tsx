import { View, Text, Image, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { getDatabase } from '@/lib/database';
import { getMovieById } from '@/lib/movieRepository';
import type { Movie } from '@/lib/schema';

function DetailStarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <View testID="detail-rating" style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
      {Array.from({ length: fullStars }, (_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={20} color="#FFD700" />
      ))}
      {hasHalf && <Ionicons name="star-half" size={20} color="#FFD700" />}
      <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginLeft: 6 }}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDatabase();
        const result = await getMovieById(db, id);
        setMovie(result);
      } catch {
        // silently handle errors
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View testID="detail-loading" style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.text, fontSize: 18 }}>Movie not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.headerBackground },
          headerTintColor: theme.colors.text,
          title: movie.title,
        }}
      />
      <ScrollView
        testID="detail-screen"
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {movie.posterUrl ? (
          <Image
            testID="detail-poster"
            source={{ uri: movie.posterUrl }}
            style={{ width: '100%', height: 450, resizeMode: 'cover' }}
          />
        ) : (
          <View
            testID="detail-poster-placeholder"
            style={{
              width: '100%',
              height: 300,
              backgroundColor: theme.colors.surfaceLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="film-outline" size={64} color={theme.colors.textSecondary} />
          </View>
        )}

        <View style={{ padding: 20 }}>
          <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '700' }}>
            {movie.title}
          </Text>

          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, marginTop: 4 }}>
            {String(movie.year)}
          </Text>

          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, marginTop: 8 }}>
            {movie.director ?? 'Director unknown'}
          </Text>

          {movie.letterboxdRating !== null && (
            <DetailStarRating rating={movie.letterboxdRating} />
          )}

          <View
            style={{
              marginTop: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: 8,
              padding: 12,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 18, fontWeight: '600' }}>
              {movie.rank !== null ? `#${movie.rank}` : 'Unranked'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
