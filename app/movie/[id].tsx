import { View, Text, ScrollView, ActivityIndicator, Pressable, StyleSheet, Linking, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { theme } from "@/lib/theme";
import { getDatabase } from "@/lib/database";
import { getMovieById } from "@/lib/movieRepository";
import { Poster } from "@/lib/components/Poster";
import { StarRating } from "@/lib/components/StarRating";
import { SprocketRail, RAIL_WIDTH } from "@/lib/components/SprocketRail";
import { CountdownNumeral } from "@/lib/components/CountdownNumeral";
import { Icon } from "@/lib/components/Icon";
import type { Movie } from "@/lib/schema";

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  // Reload on focus so a re-rank started from here shows its new number.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const db = await getDatabase();
          const result = await getMovieById(db, id);
          if (!cancelled) setMovie(result);
        } catch {
          // Leave the last known film on screen.
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  if (loading) {
    return (
      <View testID="detail-loading" style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Film not found</Text>
      </View>
    );
  }

  const posterW = width - RAIL_WIDTH * 2 - 48;
  const posterH = Math.round(posterW * 1.5);
  const ranked = movie.rank !== null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: theme.colors.primary,
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: "transparent" },
        }}
      />
      <ScrollView
        testID="detail-screen"
        style={styles.screen}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <SprocketRail side="left" />
        <SprocketRail side="right" />

        <View style={[styles.gate, { width: posterW }]}>
          <View style={styles.litShadow}>
            <Poster
              uri={movie.posterUrl}
              width={posterW}
              height={posterH}
              testID="detail-poster"
              placeholderTestID="detail-poster-placeholder"
            />
          </View>
          <View pointerEvents="none" style={[styles.rim, { width: posterW, height: posterH }]} />
          <View style={styles.numeral}>
            {ranked ? (
              <CountdownNumeral value={movie.rank!} size="lg" testID="detail-rank" />
            ) : (
              <View style={styles.unrankedBadge}>
                <Text style={styles.unrankedLabel}>Unranked</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.label}>
          <Text style={styles.title}>{movie.title}</Text>
          <Text style={styles.metaRow}>
            <Text style={styles.year}>{String(movie.year)}</Text>
            <Text style={styles.dot}>  ·  </Text>
            <Text style={styles.director}>{movie.director ?? "Director unknown"}</Text>
          </Text>
          {movie.letterboxdRating !== null && (
            <View style={styles.rating}>
              <StarRating rating={movie.letterboxdRating} size={16} showValue testID="detail-rating" />
              <Text style={styles.ratingCaption}>your Letterboxd rating</Text>
            </View>
          )}

          <Pressable
            testID="detail-rank-button"
            accessibilityRole="button"
            onPress={() =>
              router.push(
                ranked
                  ? `/comparison?movieId=${movie.id}&rerank=true`
                  : { pathname: "/comparison", params: { movieId: movie.id } },
              )
            }
            style={({ pressed }) => [styles.primary, pressed && { backgroundColor: theme.colors.primaryPressed }]}
          >
            <Text style={styles.primaryLabel}>{ranked ? "Re-rank this film" : "Rank this film"}</Text>
          </Pressable>
          <Text style={styles.primaryHint}>
            {ranked
              ? `Currently #${movie.rank}. A re-rank asks a few picks and keeps this rank until you finish.`
              : "A handful of head-to-head picks places it in your list."}
          </Text>

          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(movie.letterboxdUri).catch(() => {})}
            style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.linkLabel}>Open on Letterboxd</Text>
            <Icon name="arrow.up.right" size={13} color={theme.colors.primary} />
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 22,
    textTransform: "uppercase",
    color: theme.colors.text,
  },
  content: { paddingBottom: 48, paddingTop: 16, minHeight: "100%" },
  gate: { alignSelf: "center" },
  litShadow: {
    borderRadius: theme.radius.frame,
    backgroundColor: theme.colors.background,
    ...theme.shadow.lit,
  },
  rim: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: theme.radius.frame,
    borderWidth: 1,
    borderColor: "rgba(244,227,178,0.55)",
  },
  numeral: { position: "absolute", left: -32, bottom: -24, ...theme.shadow.row },
  unrankedBadge: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: "rgba(154,149,138,0.5)",
    justifyContent: "center",
  },
  unrankedLabel: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 16,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: theme.colors.textSecondary,
    includeFontPadding: false,
  },
  label: {
    paddingHorizontal: RAIL_WIDTH + 24,
    paddingTop: 44,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 36,
    lineHeight: 37,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: theme.colors.text,
  },
  metaRow: { marginTop: 8, fontSize: 16, lineHeight: 22 },
  year: { fontSize: 16, color: theme.colors.textSecondary, fontVariant: ["tabular-nums"] },
  dot: { fontSize: 16, color: theme.colors.textSecondary },
  director: { fontSize: 16, color: theme.colors.textSecondary },
  rating: { marginTop: 14, gap: 4 },
  ratingCaption: { fontSize: 12, color: theme.colors.textSecondary },
  primary: {
    marginTop: 28,
    minHeight: 50,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.onPrimary,
    includeFontPadding: false,
  },
  primaryHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  link: {
    marginTop: 28,
    alignSelf: "center",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  linkLabel: { fontSize: 15, fontWeight: "600", color: theme.colors.primary },
});
