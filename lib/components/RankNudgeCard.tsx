import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import type { Movie } from '@/lib/schema';

interface RankNudgeCardProps {
  movie: Movie;
  onPress: () => void;
}

export function RankNudgeCard({ movie, onPress }: RankNudgeCardProps) {
  return (
    <TouchableOpacity
      testID="rank-nudge-card"
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        margin: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary,
      }}
    >
      {movie.posterUrl ? (
        <Image
          testID="nudge-poster"
          source={{ uri: movie.posterUrl }}
          style={{ width: 50, height: 75, borderRadius: 6 }}
        />
      ) : (
        <View
          testID="nudge-poster-placeholder"
          style={{
            width: 50,
            height: 75,
            borderRadius: 6,
            backgroundColor: theme.colors.surfaceLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="film-outline" size={24} color={theme.colors.textSecondary} />
        </View>
      )}
      <View style={{ marginLeft: 14, flex: 1 }}>
        <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>
          Rank a movie?
        </Text>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>
          {movie.title}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 }}>
          {movie.year}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: theme.colors.primary,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: theme.colors.background, fontSize: 13, fontWeight: '700' }}>
          Rank this movie!
        </Text>
      </View>
    </TouchableOpacity>
  );
}
