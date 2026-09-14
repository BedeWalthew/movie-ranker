// The Projection Booth: emulsion black, one lamp.
export const theme = {
  colors: {
    background: "#050505", // emulsion black
    surface: "#0F0F10", // spool: unlit chrome and rows
    surfaceLight: "#1C1C1E", // sprocket punch
    rail: "#0B0B0C", // the strip's edge rail
    primary: "#C8801E", // lamp amber: the single tint
    primaryPressed: "#A8680F",
    onPrimary: "#0A0A0A",
    onPrimaryMuted: "#3A2308",
    lamp: "#F4E3B2", // xenon warm white: rims and lit text
    text: "#EDE6D6",
    textSecondary: "#9A958A",
    error: "#FF453A",
    tabBar: "#050505",
    tabBarBorder: "#1C1C1E",
    headerBackground: "#050505",
  },
  fonts: {
    display: "BigShouldersDisplay-Black",
    displayBold: "BigShouldersDisplay-Bold",
    displayMedium: "BigShouldersDisplay-Medium",
  },
  radius: {
    frame: 4, // a film frame's corner
    pill: 999,
  },
  shadow: {
    lit: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
    },
    row: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
    },
  },
} as const;

export type Theme = typeof theme;

export const fontAssets = {
  "BigShouldersDisplay-Black": require("../assets/fonts/BigShouldersDisplay-Black.ttf"),
  "BigShouldersDisplay-Bold": require("../assets/fonts/BigShouldersDisplay-Bold.ttf"),
  "BigShouldersDisplay-Medium": require("../assets/fonts/BigShouldersDisplay-Medium.ttf"),
};
