import { ActionSheetIOS, Alert, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { theme } from "@/lib/theme";
import { Icon } from "@/lib/components/Icon";
import { HEADER_MENU_ITEMS, WORKER_URL } from "@/lib/constants";
import { getDatabase } from "@/lib/database";
import { importMoviesFromCsv } from "@/lib/importService";
import { deleteAllMovies } from "@/lib/movieRepository";
import { useRefresh } from "@/lib/refreshContext";

/**
 * The ellipsis in the navigation bar. Opens the system action sheet with
 * Import CSV, Share Top 10 and Reset Movies.
 */
export function HeaderMenu() {
  const router = useRouter();
  const { triggerRefresh } = useRefresh();

  const importCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const csvContent = await response.text();
      const db = await getDatabase();
      const importResult = await importMoviesFromCsv(db, csvContent, WORKER_URL, () => {});
      triggerRefresh();
      Alert.alert(
        "Import complete",
        `${importResult.imported} films added to the unranked reel.` +
          (importResult.skipped > 0 ? `\n${importResult.skipped} already in your list were skipped.` : ""),
      );
    } catch (error) {
      Alert.alert(
        "Import failed",
        `The file could not be read as a Letterboxd export.\n${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const resetMovies = () => {
    Alert.alert(
      "Reset all films?",
      "Every film and every rank will be deleted. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await getDatabase();
              await deleteAllMovies(db);
              triggerRefresh();
            } catch {
              Alert.alert("Reset failed", "The films could not be deleted. Try again.");
            }
          },
        },
      ],
    );
  };

  const run = (item: string) => {
    // Let the sheet finish dismissing before presenting another controller.
    setTimeout(() => {
      if (item === "Import CSV") importCsv();
      else if (item === "Share Top 10") router.push("/share");
      else if (item === "Reset Movies") resetMovies();
    }, 350);
  };

  const open = () => {
    if (Platform.OS !== "ios") return;
    const options = ["Cancel", ...HEADER_MENU_ITEMS];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
        destructiveButtonIndex: options.indexOf("Reset Movies"),
        tintColor: theme.colors.primary,
        userInterfaceStyle: "dark",
      },
      (index) => {
        if (index > 0) run(options[index]);
      },
    );
  };

  return (
    <Pressable
      onPress={open}
      testID="header-menu-button"
      accessibilityRole="button"
      accessibilityLabel="More actions"
      hitSlop={8}
      style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.5 : 1 })}
    >
      <Icon name="ellipsis.circle" size={22} color={theme.colors.primary} />
    </Pressable>
  );
}
