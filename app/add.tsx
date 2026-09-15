import { View, Text, FlatList, ActivityIndicator, Pressable, StyleSheet, Alert } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stack, useRouter, useFocusEffect, useNavigation } from "expo-router";
import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SearchBarCommands } from "react-native-screens";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";
import { WORKER_URL } from "@/lib/constants";
import { getDatabase } from "@/lib/database";
import { getReelEntries } from "@/lib/movieRepository";
import { addFilmToReel } from "@/lib/addFilm";
import { buildReelIndex, findOnReel, type ReelEntry } from "@/lib/reelMatch";
import { useFilmSearch, type FilmSearch } from "@/lib/useFilmSearch";
import { Poster } from "@/lib/components/Poster";
import { CountdownNumeral } from "@/lib/components/CountdownNumeral";
import { SprocketRail, RAIL_WIDTH } from "@/lib/components/SprocketRail";
import { Icon } from "@/lib/components/Icon";
import type { FilmSearchHit } from "@/lib/tmdbClient";

const THUMB_W = 44;
const THUMB_H = 66;

export default function AddFilmScreen() {
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const insets = useSafeAreaInsets();
  const searchBar = useRef<SearchBarCommands>(null);
  const [query, setQuery] = useState("");
  const search = useFilmSearch(query, WORKER_URL);
  const [entries, setEntries] = useState<ReelEntry[]>([]);
  const [adding, setAdding] = useState<ReadonlySet<number>>(new Set());

  const reel = useMemo(() => buildReelIndex(entries), [entries]);

  const loadReel = useCallback(async () => {
    try {
      const db = await getDatabase();
      setEntries(await getReelEntries(db));
    } catch {
      // Rows offer Add; adding checks the reel again before it writes.
    }
  }, []);

  // iOS has no autoFocus for the header search bar; focus it once the sheet has risen.
  useEffect(
    () =>
      navigation.addListener("transitionEnd", (e) => {
        if (!e.data.closing) searchBar.current?.focus();
      }),
    [navigation],
  );

  // Reload on focus so a film ranked from here shows its new number.
  useFocusEffect(
    useCallback(() => {
      loadReel();
    }, [loadReel]),
  );

  const add = useCallback(async (hit: FilmSearchHit) => {
    setAdding((s) => new Set(s).add(hit.tmdbId));
    try {
      const db = await getDatabase();
      const movie = await addFilmToReel(db, hit, WORKER_URL);
      setEntries((list) => (list.some((e) => e.id === movie.id) ? list : [...list, movie]));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert("Film not added", `${hit.title} could not be saved. Try again.`);
    } finally {
      setAdding((s) => {
        const next = new Set(s);
        next.delete(hit.tmdbId);
        return next;
      });
    }
  }, []);

  const hits = search.status === "loading" || search.status === "done" ? search.hits : [];

  const renderItem = useCallback(
    ({ item }: { item: FilmSearchHit }) => (
      <HitRow
        hit={item}
        onReel={findOnReel(reel, item)}
        adding={adding.has(item.tmdbId)}
        onAdd={() => add(item)}
        onRank={(movieId) => router.push({ pathname: "/comparison", params: { movieId } })}
      />
    ),
    [reel, adding, add, router],
  );

  return (
    <View testID="add-film-screen" style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              testID="add-film-close"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              style={({ pressed }) => [styles.close, pressed && { opacity: 0.5 }]}
            >
              <Icon name="xmark" size={17} color={theme.colors.primary} />
            </Pressable>
          ),
          headerSearchBarOptions: {
            ref: searchBar,
            placeholder: "Film title",
            placement: "stacked",
            hideWhenScrolling: false,
            hideNavigationBar: false,
            obscureBackground: false,
            autoCapitalize: "words",
            tintColor: theme.colors.primary,
            textColor: theme.colors.text,
            barTintColor: theme.colors.surface,
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            onCancelButtonPress: () => setQuery(""),
          },
        }}
      />
      <SprocketRail side="left" />
      <SprocketRail side="right" />
      <FlatList
        testID="add-film-results"
        data={hits}
        renderItem={renderItem}
        keyExtractor={(h) => String(h.tmdbId)}
        extraData={search.status}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={<SearchMessage search={search} query={query} />}
        ListFooterComponent={
          <Text style={styles.credit}>
            Film data and posters from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
          </Text>
        }
      />
    </View>
  );
}

function HitRow({
  hit,
  onReel,
  adding,
  onAdd,
  onRank,
}: {
  hit: FilmSearchHit;
  onReel: ReelEntry | null;
  adding: boolean;
  onAdd: () => void;
  onRank: (movieId: string) => void;
}) {
  const ranked = onReel !== null && onReel.rank !== null;
  const status = onReel === null ? null : ranked ? `Ranked #${onReel.rank}` : "On your reel";

  return (
    <View style={styles.row} testID={`hit-${hit.tmdbId}`}>
      <View
        style={styles.rowMain}
        accessible
        accessibilityLabel={[hit.title, hit.year, status].filter(Boolean).join(", ")}
      >
        <Poster uri={hit.thumbUrl} width={THUMB_W} height={THUMB_H} radius={2} />
        <View style={styles.rowText}>
          <Text style={styles.title} numberOfLines={2}>
            {hit.title}
          </Text>
          <Text style={styles.meta}>
            {hit.year}
            {onReel && (ranked ? "  ·  Ranked" : "  ·  On your reel")}
          </Text>
        </View>
      </View>

      {onReel === null ? (
        <Pressable
          testID={`add-button-${hit.tmdbId}`}
          onPress={onAdd}
          disabled={adding}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Add ${hit.title}`}
          accessibilityState={{ busy: adding }}
          style={({ pressed }) => [styles.pill, pressed && { backgroundColor: theme.colors.primaryPressed }]}
        >
          {adding ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <Text style={styles.pillLabel}>Add</Text>
          )}
        </Pressable>
      ) : ranked ? (
        <CountdownNumeral value={onReel.rank!} size="sm" lit={false} testID={`hit-rank-${hit.tmdbId}`} />
      ) : (
        <Pressable
          testID={`rank-button-${hit.tmdbId}`}
          onPress={() => onRank(onReel.id)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Rank ${hit.title}`}
          style={({ pressed }) => [styles.pill, pressed && { backgroundColor: theme.colors.primaryPressed }]}
        >
          <Text style={styles.pillLabel}>Rank</Text>
        </Pressable>
      )}
    </View>
  );
}

function SearchMessage({ search, query }: { search: FilmSearch; query: string }) {
  if (search.status === "loading") {
    return (
      <View style={styles.message}>
        <ActivityIndicator testID="add-film-searching" color={theme.colors.primary} />
      </View>
    );
  }

  const [title, body] =
    search.status === "failed"
      ? ["Search is offline", "The film list could not be reached. Check your connection and try again."]
      : search.status === "done"
        ? ["No match", `Nothing matches “${query.trim()}”. Try the original title, or fewer words.`]
        : ["What did you watch?", "Search by title. Films you add wait in Unranked until you rank them."];

  return (
    <View testID={`add-film-${search.status}`} style={styles.message}>
      <Text style={styles.messageTitle}>{title}</Text>
      <Text style={styles.messageBody}>{body}</Text>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  close: { padding: 6 },
  listContent: { paddingHorizontal: RAIL_WIDTH, flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 14,
    minHeight: THUMB_H + 20,
  },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  rowText: { flex: 1, justifyContent: "center" },
  title: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    lineHeight: 21,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: theme.colors.text,
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  pill: {
    minHeight: 36,
    minWidth: 64,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pillLabel: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: theme.colors.onPrimary,
    includeFontPadding: false,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.surfaceLight,
    marginLeft: 16 + THUMB_W + 14,
  },
  message: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 24,
    gap: 12,
  },
  messageTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 26,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: theme.colors.text,
    textAlign: "center",
  },
  messageBody: {
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  credit: {
    marginTop: "auto",
    paddingTop: 32,
    paddingHorizontal: 16,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});
