import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/lib/theme";
import { Icon } from "@/lib/components/Icon";

/** The plus in the navigation bar. Opens the sheet for adding a film by title. */
export function AddFilmButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/add")}
      testID="add-film-button"
      accessibilityRole="button"
      accessibilityLabel="Add a film"
      hitSlop={8}
      style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.5 : 1 })}
    >
      <Icon name="plus" size={22} color={theme.colors.primary} />
    </Pressable>
  );
}
