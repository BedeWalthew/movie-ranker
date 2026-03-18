export const theme = {
  colors: {
    background: '#0D0D0D',
    surface: '#1A1A2E',
    surfaceLight: '#252540',
    primary: '#00D4AA',
    error: '#FF3B30',
    text: '#E8E8E8',
    textSecondary: '#9CA3AF',
    tabBar: '#111111',
    tabBarBorder: '#2A2A2A',
    headerBackground: '#111111',
  },
} as const;

export type Theme = typeof theme;
