import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, Text, Modal, SafeAreaView, Alert } from 'react-native';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '@/lib/theme';
import { TAB_NAMES, HEADER_MENU_ITEMS, WORKER_URL } from '@/lib/constants';
import { getDatabase } from '@/lib/database';
import { importMoviesFromCsv } from '@/lib/importService';
import { deleteAllMovies } from '@/lib/movieRepository';
import { RefreshProvider, useRefresh } from '@/lib/refreshContext';

function HeaderMenu() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const { triggerRefresh } = useRefresh();

  const handleImportCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      console.log('[Import] File selected:', file.name, file.uri, file.mimeType);

      const response = await fetch(file.uri);
      const csvContent = await response.text();
      console.log('[Import] CSV length:', csvContent.length, 'First 200 chars:', csvContent.substring(0, 200));

      const db = await getDatabase();

      const importResult = await importMoviesFromCsv(
        db,
        csvContent,
        WORKER_URL,
        (progress) => {
          console.log(`[Import] Progress: ${progress.current}/${progress.total}`);
        },
      );

      console.log('[Import] Result:', importResult);
      triggerRefresh();
      Alert.alert(
        'Import Complete',
        `Imported ${importResult.imported} movies.\n${importResult.skipped} duplicates skipped.`,
      );
    } catch (error) {
      console.error('[Import] Error:', error);
      Alert.alert('Import Error', `Failed to import CSV file.\n${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleMenuPress = (item: string) => {
    setVisible(false);
    // Delay to let the menu modal finish dismissing before presenting
    // another modal (document picker / navigation). iOS cannot present
    // two view controllers simultaneously.
    setTimeout(() => {
      if (item === 'Import CSV') {
        handleImportCsv();
      } else if (item === 'Share Top 10') {
        router.push('/share');
      } else if (item === 'Reset Movies') {
        Alert.alert(
          'Reset Movies',
          'This will permanently delete all your movies and rankings. This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reset',
              style: 'destructive',
              onPress: async () => {
                try {
                  const db = await getDatabase();
                  await deleteAllMovies(db);
                  triggerRefresh();
                  Alert.alert('Done', 'All movies have been deleted.');
                } catch {
                  Alert.alert('Error', 'Failed to reset movies.');
                }
              },
            },
          ],
        );
      }
    }, 350);
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
                  testID={`menu-item-${item.toLowerCase().replace(/ /g, '-')}`}
                  onPress={() => handleMenuPress(item)}
                  style={{ padding: 14 }}
                >
                  <Text
                    style={{
                      color: item === 'Reset Movies' ? theme.colors.error : theme.colors.text,
                      fontSize: 16,
                    }}
                  >
                    {item}
                  </Text>
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
    <RefreshProvider>
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
    </RefreshProvider>
  );
}


async function handleImportCsv() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const file = result.assets[0];
    console.log('[Import] File selected:', file.name, file.uri, file.mimeType);

    const response = await fetch(file.uri);
    const csvContent = await response.text();
    console.log('[Import] CSV length:', csvContent.length, 'First 200 chars:', csvContent.substring(0, 200));

    const db = await getDatabase();

    const importResult = await importMoviesFromCsv(
      db,
      csvContent,
      WORKER_URL,
      (progress) => {
        console.log(`[Import] Progress: ${progress.current}/${progress.total}`);
      },
    );

    console.log('[Import] Result:', importResult);
    triggerRefresh();
    Alert.alert(
      'Import Complete',
      `Imported ${importResult.imported} movies.\n${importResult.skipped} duplicates skipped.`,
    );
  } catch (error) {
    console.error('[Import] Error:', error);
    Alert.alert('Import Error', `Failed to import CSV file.\n${error instanceof Error ? error.message : String(error)}`);
  }
}

function HeaderMenu() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const { triggerRefresh } = useRefresh();

  const handleMenuPress = (item: string) => {
    setVisible(false);
    // Delay to let the menu modal finish dismissing before presenting
    // another modal (document picker / navigation). iOS cannot present
    // two view controllers simultaneously.
    setTimeout(() => {
      if (item === 'Import CSV') {
        handleImportCsv();
      } else if (item === 'Share Top 10') {
        router.push('/share');
      } else if (item === 'Reset Movies') {
        Alert.alert(
          'Reset Movies',
          'This will permanently delete all your movies and rankings. This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reset',
              style: 'destructive',
              onPress: async () => {
                try {
                  const db = await getDatabase();
                  await deleteAllMovies(db);
                  Alert.alert('Done', 'All movies have been deleted.');
                } catch {
                  Alert.alert('Error', 'Failed to reset movies.');
                }
              },
            },
          ],
        );
      }
    }, 350);
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
                  testID={`menu-item-${item.toLowerCase().replace(/ /g, '-')}`}
                  onPress={() => handleMenuPress(item)}
                  style={{ padding: 14 }}
                >
                  <Text
                    style={{
                      color: item === 'Reset Movies' ? theme.colors.error : theme.colors.text,
                      fontSize: 16,
                    }}
                  >
                    {item}
                  </Text>
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
