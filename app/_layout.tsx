import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { theme, fontAssets } from "@/lib/theme";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  // Hold on the black splash until the display face is ready.
  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="movie/[id]"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTintColor: theme.colors.primary,
            headerBackButtonDisplayMode: "minimal",
            title: "",
          }}
        />
        <Stack.Screen
          name="comparison"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="share"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="add"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "ADD A FILM",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: theme.colors.headerBackground },
            headerTintColor: theme.colors.primary,
            headerTitleStyle: {
              fontFamily: theme.fonts.displayBold,
              fontSize: 20,
              color: theme.colors.text,
            },
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
      </Stack>
    </>
  );
}
