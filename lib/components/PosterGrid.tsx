import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';
import type { Movie } from '@/lib/schema';

interface PosterGridProps {
  movies: Movie[];
}

export function PosterGrid({ movies }: PosterGridProps) {
  const display = movies.slice(0, 10);

  if (display.length === 0) {
    return (
      <View testID="poster-grid" style={styles.container}>
        <Text style={styles.emptyText}>No ranked movies yet</Text>
      </View>
    );
  }

  return (
    <View testID="poster-grid" style={styles.container}>
      <Text style={styles.heading}>My Top Movies</Text>
      <View style={styles.grid}>
        {display.map((movie) => (
          <View key={movie.id} testID={`poster-cell-${movie.id}`} style={styles.cell}>
            {movie.posterUrl ? (
              <Image
                testID={`poster-image-${movie.id}`}
                source={{ uri: movie.posterUrl }}
                style={styles.poster}
                resizeMode="cover"
              />
            ) : (
              <View testID={`poster-placeholder-${movie.id}`} style={styles.placeholder}>
                <Text style={styles.placeholderText}>🎬</Text>
              </View>
            )}
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{movie.rank}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {movie.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const CELL_WIDTH = 150;
const POSTER_HEIGHT = 225;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: 16,
    alignItems: 'center',
  },
  heading: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  cell: {
    width: CELL_WIDTH,
    alignItems: 'center',
  },
  poster: {
    width: CELL_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 10,
  },
  placeholder: {
    width: CELL_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
  },
  rankBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    width: CELL_WIDTH,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});
