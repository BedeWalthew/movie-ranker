// Jest setup file
import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
require('react-native-reanimated').setUpTests();

// Suppress React act() warnings from async useEffect state updates.
// Tests use waitFor() correctly; this noise doesn't indicate real failures.
const originalError = console.error.bind(console);
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act(')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

// Mock @expo/vector-icons to avoid native module issues in tests
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return {
    Ionicons: (props) => <Text {...props}>{props.name}</Text>,
  };
});

// SF Symbols render natively; in tests they are their name.
jest.mock('expo-symbols', () => {
  const { Text } = require('react-native');
  return {
    SymbolView: (props) => <Text testID={props.testID}>{props.name}</Text>,
  };
});

// expo-image is native; tests see a plain RN Image with the same props.
jest.mock('expo-image', () => {
  const { Image } = require('react-native');
  return {
    Image: ({ contentFit, transition, cachePolicy, ...props }) => <Image {...props} />,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: View,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    initialWindowMetrics: { insets: inset, frame: { x: 0, y: 0, width: 390, height: 844 } },
  };
});

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

// Mock react-native-view-shot
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));
