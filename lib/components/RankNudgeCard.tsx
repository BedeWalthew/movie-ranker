import { View, Text, Pressable, StyleSheet } from "react-native";
import { Icon } from "@/lib/components/Icon";
import { theme } from "@/lib/theme";
import { Poster } from "@/lib/components/Poster";
import type { Movie } from "@/lib/schema";

/**
 * The lamp bar: the one amber block on the Ranked screen. It holds a film
 * drawn at random from the unranked pool; tapping it starts that film's
 * comparisons. A new film is drawn every time the screen comes back.
 */
export function RankNudgeCard({
  movie,
  onPress,
  remaining,
}: {
  movie: Movie;
  onPress: () => void;
  remaining?: number;
}) {
  return (
    <Pressable
      testID="rank-nudge-card"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Rank a random film: ${movie.title}, ${movie.year}`}
      style={({ pressed }) => [
        styles.bar,
        pressed && { backgroundColor: theme.colors.primaryPressed },
      ]}
    >
      <View style={styles.thumb}>
        <Poster
          uri={movie.posterUrl}
          width={32}
          height={48}
          radius={2}
          testID="nudge-poster"
          placeholderTestID="nudge-poster-placeholder"
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.action} numberOfLines={1}>
          Rank a random film
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Text style={styles.title} numberOfLines={1}>
            {movie.title}
          </Text>
          <Text style={styles.year}>{movie.year}</Text>
        </View>
      </View>
      <View style={styles.trailing}>
        {typeof remaining === "number" && (
          <Text style={styles.remaining}>{remaining} left</Text>
        )}
        <Icon name="shuffle" size={22} color={theme.colors.onPrimary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 16,
    minHeight: 64,
  },
  thumb: {
    borderWidth: 1,
    borderColor: theme.colors.onPrimary,
    borderRadius: 3,
    padding: 1,
    backgroundColor: theme.colors.onPrimary,
  },
  action: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: theme.colors.onPrimary,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.onPrimaryMuted,
    flexShrink: 1,
  },
  year: {
    fontSize: 13,
    color: theme.colors.onPrimaryMuted,
    fontVariant: ["tabular-nums"],
  },
  trailing: { alignItems: "flex-end", gap: 2, marginLeft: 8 },
  remaining: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.onPrimaryMuted,
    fontVariant: ["tabular-nums"],
  },
});
