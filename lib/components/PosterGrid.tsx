import { View, Text, StyleSheet } from "react-native";
import { Image } from "react-native";
import { theme } from "@/lib/theme";
import { CountdownNumeral } from "@/lib/components/CountdownNumeral";
import type { Movie } from "@/lib/schema";

/**
 * The shareable top ten: two columns of frames on a strip, each with its
 * countdown numeral. Rendered off-screen and captured as an image.
 */
export function PosterGrid({ movies }: { movies: Movie[] }) {
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
      <View style={styles.rail}>
        {Array.from({ length: 40 }, (_, i) => (
          <View key={i} style={styles.hole} />
        ))}
      </View>
      <View style={styles.sheet}>
        <Text style={styles.heading}>My Top Ten</Text>
        <Text style={styles.sub}>Ranked head to head in Movie Ranker</Text>
        <View style={styles.grid}>
          {display.map((movie) => (
            <View key={movie.id} testID={`poster-cell-${movie.id}`} style={styles.cell}>
              <View style={styles.frame}>
                {movie.posterUrl ? (
                  <Image
                    testID={`poster-image-${movie.id}`}
                    source={{ uri: movie.posterUrl }}
                    style={styles.poster}
                    resizeMode="cover"
                  />
                ) : (
                  <View testID={`poster-placeholder-${movie.id}`} style={styles.placeholder}>
                    <Text style={styles.placeholderText}>{movie.title.slice(0, 1)}</Text>
                  </View>
                )}
                <View style={styles.numeral}>
                  <CountdownNumeral value={movie.rank ?? "–"} size="sm" />
                </View>
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {movie.title}
              </Text>
              <Text style={styles.year}>{movie.year}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.rail, styles.railRight]}>
        {Array.from({ length: 40 }, (_, i) => (
          <View key={i} style={styles.hole} />
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
    flexDirection: "row",
  },
  rail: {
    width: 18,
    backgroundColor: theme.colors.rail,
    paddingTop: 8,
    gap: 16,
    alignItems: "center",
    overflow: "hidden",
  },
  railRight: {},
  hole: { width: 8, height: 6, borderRadius: 1.5, backgroundColor: theme.colors.surfaceLight },
  sheet: { flex: 1, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 28, alignItems: "center" },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: theme.colors.lamp,
    textAlign: "center",
  },
  sub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  cell: { width: CELL_WIDTH },
  frame: { width: CELL_WIDTH, height: POSTER_HEIGHT },
  poster: {
    width: CELL_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: theme.radius.frame,
    borderWidth: 1,
    borderColor: "rgba(244,227,178,0.35)",
  },
  placeholder: {
    width: CELL_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: theme.radius.frame,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontFamily: theme.fonts.display,
    fontSize: 64,
    color: theme.colors.textSecondary,
  },
  numeral: { position: "absolute", left: -6, bottom: -6 },
  title: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 15,
    lineHeight: 16,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: theme.colors.text,
    marginTop: 12,
    marginLeft: 26,
  },
  year: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginLeft: 26,
    fontVariant: ["tabular-nums"],
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    textAlign: "center",
    padding: 40,
    flex: 1,
  },
});
