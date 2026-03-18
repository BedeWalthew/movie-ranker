import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  minRating: number | null;
  onMinRatingChange: (rating: number | null) => void;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  minRating,
  onMinRatingChange,
}: SearchFilterBarProps) {
  const handleRatingPress = (rating: number) => {
    onMinRatingChange(minRating === rating ? null : rating);
  };

  return (
    <View testID="search-filter-bar" style={styles.container}>
      <TextInput
        testID="search-input"
        style={styles.searchInput}
        placeholder="Search movies..."
        placeholderTextColor={theme.colors.textSecondary}
        value={searchQuery}
        onChangeText={onSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((rating) => {
          const isActive = minRating === rating;
          return (
            <TouchableOpacity
              key={rating}
              testID={`rating-filter-${rating}`}
              onPress={() => handleRatingPress(rating)}
              style={[styles.ratingButton, isActive && styles.ratingButtonActive]}
            >
              <Text style={[styles.ratingText, isActive && styles.ratingTextActive]}>
                {rating}★
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: theme.colors.background,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  ratingButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
  },
  ratingButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  ratingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  ratingTextActive: {
    color: theme.colors.background,
  },
});
