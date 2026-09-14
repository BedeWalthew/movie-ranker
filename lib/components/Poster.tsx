import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Icon } from "@/lib/components/Icon";
import { theme } from "@/lib/theme";

/**
 * A poster in a film frame. Falls back to a dark frame with a reel glyph
 * when the import found no artwork.
 */
export function Poster({
  uri,
  width,
  height,
  testID,
  placeholderTestID,
  radius = theme.radius.frame,
}: {
  uri: string | null;
  width: number;
  height: number;
  testID?: string;
  placeholderTestID?: string;
  radius?: number;
}) {
  if (uri) {
    return (
      <Image
        testID={testID}
        source={{ uri }}
        style={{ width, height, borderRadius: radius, backgroundColor: theme.colors.surface }}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
      />
    );
  }
  return (
    <View
      testID={placeholderTestID}
      style={[styles.placeholder, { width, height, borderRadius: radius }]}
    >
      <Icon
        name="film"
        weight="regular"
        size={Math.max(20, Math.round(width * 0.28))}
        color={theme.colors.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
