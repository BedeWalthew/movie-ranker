// Jest setup file
import '@testing-library/jest-native/extend-expect';

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
