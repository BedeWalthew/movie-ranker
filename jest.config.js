/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|expo-router|expo-sqlite|expo-constants|expo-linking|expo-status-bar|expo-system-ui|expo-document-picker|expo-sharing|expo-image|expo-font|expo-haptics|expo-symbols|expo-splash-screen|expo-modules-core|@expo/vector-icons|react-native-view-shot|react-native-reanimated|react-native-worklets)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(ttf|otf|png|jpg)$': '<rootDir>/__tests__/__mocks__/fileMock.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)'],
};
