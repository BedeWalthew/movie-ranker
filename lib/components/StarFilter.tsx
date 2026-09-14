import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Icon } from "@/lib/components/Icon";
import { theme } from "@/lib/theme";

/**
 * Minimum-Letterboxd-rating chips. Tapping the active chip clears it.
 */
export function StarFilter({
  minRating,
  onChange,
  counts,
}: {
  minRating: number | null;
  onChange: (rating: number | null) => void;
  /** Optional: how many films clear each threshold, shown on the chip. */
  counts?: Record<number, number>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="star-filter"
    >
      {[1, 2, 3, 4, 5].map((rating) => {
        const active = minRating === rating;
        return (
          <Pressable
            key={rating}
            testID={`rating-filter-${rating}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${rating} stars and up`}
            onPress={() => onChange(active ? null : rating)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Icon
              name="star.fill"
              size={11}
              color={active ? theme.colors.onPrimary : theme.colors.primary}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {rating}+{counts ? ` · ${counts[rating] ?? 0}` : ""}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(200,128,30,0.45)",
    backgroundColor: theme.colors.background,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  label: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 15,
    letterSpacing: 0.4,
    color: theme.colors.primary,
    includeFontPadding: false,
  },
  labelActive: { color: theme.colors.onPrimary },
});
