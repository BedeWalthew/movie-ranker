import { View, Text } from 'react-native';
import { theme } from '@/lib/theme';

export default function RankedScreen() {
  return (
    <View
      testID="ranked-screen"
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        testID="ranked-placeholder"
        style={{ color: theme.colors.text, fontSize: 18 }}
      >
        Ranked Movies
      </Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
        Your ranked movies will appear here
      </Text>
    </View>
  );
}
