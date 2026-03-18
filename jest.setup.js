// Jest setup file
import '@testing-library/jest-native/extend-expect';

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
