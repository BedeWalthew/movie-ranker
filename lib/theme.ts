export const theme = {
  colors: {
    background: "#252540",
    surface: "#1A1A2E",
    surfaceLight: "#232327",
    primary: "#93C2FB",
    error: "#FF3B30",
    text: "#E8E8E8",
    textSecondary: "#9CA3AF",
    tabBar: "#252540",
    tabBarBorder: "#FFFFFFF",
    headerBackground: "#252540",
  },
} as const;

export type Theme = typeof theme;
