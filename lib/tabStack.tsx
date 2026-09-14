import { Stack } from "expo-router";
import { theme } from "@/lib/theme";
import { HeaderMenu } from "@/lib/components/HeaderMenu";
import { ScreenSearchProvider, useScreenSearch } from "@/lib/screenSearch";

/**
 * Each tab is its own native stack: a large title that collapses on scroll,
 * the system search field in the bar, and the menu on the right.
 */
export function TabStack({
  title,
  searchPlaceholder,
}: {
  title: string;
  searchPlaceholder: string;
}) {
  return (
    <ScreenSearchProvider>
      <TabStackInner title={title} searchPlaceholder={searchPlaceholder} />
    </ScreenSearchProvider>
  );
}

function TabStackInner({
  title,
  searchPlaceholder,
}: {
  title: string;
  searchPlaceholder: string;
}) {
  const { setQuery, setFiltering } = useScreenSearch();

  return (
    <Stack
      screenOptions={{
        title: title.toUpperCase(),
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerTransparent: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.headerBackground },
        headerLargeStyle: { backgroundColor: theme.colors.headerBackground },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontFamily: theme.fonts.displayBold,
          fontSize: 20,
          color: theme.colors.text,
        },
        headerLargeTitleStyle: {
          fontFamily: theme.fonts.display,
          fontSize: 34,
          color: theme.colors.text,
        },
        headerRight: () => <HeaderMenu />,
        headerSearchBarOptions: {
          placeholder: searchPlaceholder,
          placement: "integratedButton",
          hideWhenScrolling: false,
          tintColor: theme.colors.primary,
          textColor: theme.colors.text,
          barTintColor: theme.colors.surface,
          onChangeText: (e) => setQuery(e.nativeEvent.text),
          onOpen: () => setFiltering(true),
          onClose: () => {
            setQuery("");
            setFiltering(false);
          },
        },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
