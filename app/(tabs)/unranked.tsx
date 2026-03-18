import { View, Text } from 'react-native';
import { theme } from '@/lib/theme';

export default function UnrankedScreen() {
  return (
    <View
      testID="unranked-screen"
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        testID="unranked-placeholder"
        style={{ color: theme.colors.text, fontSize: 18 }}
      >
        Unranked Movies
      </Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
        Your unranked movies will appear here
      </Text>
    </View>
  );
}
