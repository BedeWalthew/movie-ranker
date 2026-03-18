import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, Text, Modal, SafeAreaView, Alert } from 'react-native';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '@/lib/theme';
import { TAB_NAMES, HEADER_MENU_ITEMS, WORKER_URL } from '@/lib/constants';
import { getDatabase } from '@/lib/database';
import { importMoviesFromCsv } from '@/lib/importService';

async function handleImportCsv() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const file = result.assets[0];
    const response = await fetch(file.uri);
    const csvContent = await response.text();

    const db = await getDatabase();

    const importResult = await importMoviesFromCsv(
      db,
      csvContent,
      WORKER_URL,
      (progress) => {
        // Progress is available for UI updates if needed
      },
    );

    Alert.alert(
      'Import Complete',
      `Imported ${importResult.imported} movies.\n${importResult.skipped} duplicates skipped.`,
    );
  } catch {
    Alert.alert('Import Error', 'Failed to import CSV file.');
  }
}

function HeaderMenu() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  const handleMenuPress = (item: string) => {
    setVisible(false);
    if (item === 'Import CSV') {
      handleImportCsv();
    } else if (item === 'Share Top 10') {
      router.push('/share');
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        testID="header-menu-button"
        style={{ padding: 8 }}
      >
        <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
      </Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setVisible(false)}
        >
          <SafeAreaView>
            <View
              style={{
                backgroundColor: theme.colors.surface,
                margin: 16,
                marginTop: 60,
                borderRadius: 12,
                padding: 8,
                alignSelf: 'flex-end',
                minWidth: 180,
              }}
            >
              {HEADER_MENU_ITEMS.map((item) => (
                <Pressable
                  key={item}
                  testID={`menu-item-${item.toLowerCase().replace(' ', '-')}`}
                  onPress={() => handleMenuPress(item)}
                  style={{ padding: 14 }}
                >
                  <Text style={{ color: theme.colors.text, fontSize: 16 }}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
        },
        headerStyle: {
          backgroundColor: theme.colors.headerBackground,
        },
        headerTintColor: theme.colors.text,
        headerRight: () => <HeaderMenu />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: TAB_NAMES.ranked,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
          tabBarTestID: "tab-ranked",
        }}
      />
      <Tabs.Screen
        name="unranked"
        options={{
          title: TAB_NAMES.unranked,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="film" size={size} color={color} />
          ),
          tabBarTestID: "tab-unranked",
        }}
      />
    </Tabs>
  );
}
