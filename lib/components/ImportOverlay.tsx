import { useEffect } from "react";
import { Modal, View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { theme } from "@/lib/theme";
import { CountdownNumeral } from "@/lib/components/CountdownNumeral";
import { SprocketRail, RAIL_WIDTH } from "@/lib/components/SprocketRail";
import type { ImportState } from "@/lib/importContext";

/**
 * The import sheet: a strip of film feeding through the gate while each
 * film's poster and details are fetched. Stays up until the reel is loaded.
 */
export function ImportOverlay({ state, onDismiss }: { state: ImportState; onDismiss: () => void }) {
  const { width } = useWindowDimensions();
  const visible = state.phase !== "idle";
  const trackW = width - RAIL_WIDTH * 2 - 64;
  const fraction = state.total > 0 ? state.current / state.total : 0;

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withTiming(fraction, { duration: 260, easing: Easing.out(Easing.exp) });
  }, [fraction, fill]);
  const fillStyle = useAnimatedStyle(() => ({ width: trackW * fill.value }));

  // While the export is still being read there is no total; the fill idles
  // as a short lamp sweep so the sheet never looks frozen.
  const sweep = useSharedValue(0);
  useEffect(() => {
    if (state.phase !== "reading") {
      cancelAnimation(sweep);
      return;
    }
    sweep.value = 0;
    // Repeated on the UI thread; a JS callback here would crash a Release build.
    sweep.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => cancelAnimation(sweep);
  }, [state.phase, sweep]);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (trackW - 48) * sweep.value }],
    opacity: state.phase === "reading" ? 1 : 0,
  }));

  const done = state.phase === "done" || state.phase === "failed";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={done ? onDismiss : undefined}
    >
      <View style={styles.scrim}>
        <View style={styles.sheet} accessibilityViewIsModal testID="import-overlay">
          <SprocketRail side="left" />
          <SprocketRail side="right" />
          <View style={styles.body}>
            <Text style={styles.heading}>
              {state.phase === "reading" && "Reading your export"}
              {state.phase === "fetching" && "Loading the reel"}
              {state.phase === "done" && "Reel loaded"}
              {state.phase === "failed" && "Import failed"}
            </Text>

            {state.phase === "fetching" || (state.phase === "done" && state.total > 0) ? (
              <View style={styles.countRow}>
                <CountdownNumeral value={state.current} size="md" testID="import-count" />
                <Text style={styles.of}>of {state.total}</Text>
              </View>
            ) : null}

            <View style={[styles.track, { width: trackW }]}>
              {Array.from({ length: Math.floor(trackW / 22) }, (_, i) => (
                <View key={i} style={[styles.hole, { left: i * 22 + 7 }]} />
              ))}
              <Animated.View style={[styles.fill, fillStyle]} />
              <Animated.View style={[styles.sweep, sweepStyle]} />
            </View>

            <Text style={styles.detail} numberOfLines={2}>
              {state.phase === "reading" && "Finding the films you have not imported yet."}
              {state.phase === "fetching" && (state.latestTitle ?? "Fetching posters and directors.")}
              {state.phase === "done" &&
                (state.imported === 0
                  ? `Nothing new to add. ${state.skipped === 1 ? "The 1 film in that export is" : `All ${state.skipped} films in that export are`} already in your list.`
                  : `${state.imported} ${state.imported === 1 ? "film" : "films"} added to the unranked reel.` +
                    (state.skipped > 0 ? ` ${state.skipped} already in your list were skipped.` : ""))}
              {state.phase === "failed" && (state.error ?? "The file could not be read as a Letterboxd export.")}
            </Text>

            {done ? (
              <Pressable
                onPress={onDismiss}
                accessibilityRole="button"
                testID="import-done"
                style={({ pressed }) => [styles.button, pressed && { backgroundColor: theme.colors.primaryPressed }]}
              >
                <Text style={styles.buttonLabel}>{state.phase === "done" && state.imported > 0 ? "Start ranking" : "Close"}</Text>
              </Pressable>
            ) : (
              <Text style={styles.hint}>Keep the app open. Posters arrive a few at a time.</Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(5,5,5,0.86)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.surfaceLight,
    paddingBottom: 40,
  },
  body: {
    paddingHorizontal: RAIL_WIDTH + 32,
    paddingTop: 28,
    alignItems: "center",
    gap: 16,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: theme.colors.lamp,
    textAlign: "center",
  },
  countRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  of: { fontSize: 15, color: theme.colors.textSecondary, fontVariant: ["tabular-nums"] },
  track: {
    height: 22,
    backgroundColor: theme.colors.rail,
    borderRadius: 2,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.surfaceLight,
  },
  hole: {
    position: "absolute",
    top: 8,
    width: 8,
    height: 6,
    borderRadius: 1.5,
    backgroundColor: theme.colors.surfaceLight,
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  sweep: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 48,
    backgroundColor: "rgba(200,128,30,0.55)",
  },
  detail: {
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.text,
    textAlign: "center",
    minHeight: 42,
  },
  hint: { fontSize: 13, color: theme.colors.textSecondary, textAlign: "center" },
  button: {
    marginTop: 4,
    minHeight: 50,
    alignSelf: "stretch",
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.onPrimary,
    includeFontPadding: false,
  },
});
