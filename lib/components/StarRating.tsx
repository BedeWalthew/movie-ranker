import { View, Text } from "react-native";
import { theme } from "@/lib/theme";
import { Icon } from "@/lib/components/Icon";

/** Letterboxd stars (0.5 to 5). Renders nothing when the export had no rating. */
export function StarRating({
  rating,
  size = 12,
  showValue = false,
  testID,
  color = theme.colors.primary,
}: {
  rating: number | null;
  size?: number;
  showValue?: boolean;
  testID?: string;
  color?: string;
}) {
  if (rating === null) return null;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${rating} stars on Letterboxd`}
      style={{ flexDirection: "row", alignItems: "center", gap: 1 }}
    >
      {Array.from({ length: full }, (_, i) => (
        <Icon key={`f${i}`} name="star.fill" size={size} color={color} />
      ))}
      {half && <Icon name="star.leadinghalf.filled" size={size} color={color} />}
      {showValue && (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: Math.max(11, size),
            marginLeft: 6,
            fontVariant: ["tabular-nums"],
          }}
        >
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}
