import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';
import { getDatabase } from '@/lib/database';
import { getRankedMovies } from '@/lib/movieRepository';
import { PosterGrid } from '@/lib/components/PosterGrid';
import { generateAndShareTopTen } from '@/lib/shareTopTen';
import type { Movie } from '@/lib/schema';

export default function ShareScreen() {
  const router = useRouter();
  const gridRef = useRef<View>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDatabase();
        const ranked = await getRankedMovies(db);
        setMovies(ranked.slice(0, 10));
      } catch {
        Alert.alert('Error', 'Failed to load ranked movies');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleShare = useCallback(async () => {
    if (captured) return;
    setCaptured(true);

    if (movies.length === 0) {
      Alert.alert('No Movies', 'Rank some movies first to share your top list.');
      router.back();
      return;
    }

    // Small delay to ensure the grid is fully rendered
    await new Promise((r) => setTimeout(r, 100));

    const result = await generateAndShareTopTen(gridRef);
    if (!result.success) {
      Alert.alert('Share Error', result.error);
    }
    router.back();
  }, [movies, captured, router]);

  useEffect(() => {
    if (!loading && movies.length >= 0) {
      handleShare();
    }
  }, [loading, handleShare]);

  if (loading) {
    return (
      <View testID="share-screen" style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View testID="share-screen" style={styles.container}>
      <View ref={gridRef} collapsable={false} style={styles.captureArea}>
        <PosterGrid movies={movies} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  captureArea: {
    backgroundColor: theme.colors.background,
  },
});
