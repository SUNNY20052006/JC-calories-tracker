import { Stack } from 'expo-router';
import { Button, PaperProvider, MD3DarkTheme, Text } from 'react-native-paper';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import {
  useFonts,
  StackSansNotch_400Regular,
  StackSansNotch_500Medium,
  StackSansNotch_600SemiBold,
  StackSansNotch_700Bold,
} from '@expo-google-fonts/stack-sans-notch';
import { initializeDatabase } from '../database/DatabaseService';
import { BG_BASE, COLOR_PRIMARY, TEXT_PRIMARY, TEXT_SECONDARY, COLOR_BORDER, MACRO_CARBS } from '../constants/colors';
import { RADIUS_MD } from '../constants/radius';
import AtmosphericBackground from '../components/AtmosphericBackground';
import { MealDraftProvider } from '../hooks/useMealDraft';
import { UserSettingsProvider, useUserSettings } from '../hooks/useSettings';

const theme = {
  ...MD3DarkTheme,
  roundness: RADIUS_MD,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLOR_PRIMARY,
    secondary: MACRO_CARBS,
    background: BG_BASE,
    surface: BG_BASE,
    onSurface: TEXT_PRIMARY,
    onSurfaceVariant: TEXT_SECONDARY,
    outline: COLOR_BORDER,
  },
};

const BG_COLOR = BG_BASE;

const detailHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: BG_BASE },
  headerTintColor: TEXT_PRIMARY,
  headerShadowVisible: false,
};

function AppNavigator() {
  const { settings, loading, loadError, reload } = useUserSettings();
  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={COLOR_PRIMARY} />;
  if (loadError) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text>Could not open your local profiles.</Text>
      <Button mode="contained" onPress={reload}>Retry</Button>
    </View>
  );
  const signedIn = !!settings;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="gemini-settings" options={{ ...detailHeader, title: 'Gemini' }} />
        <Stack.Screen name="profile" options={{ ...detailHeader, title: 'Profile' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    StackSansNotch_400Regular,
    StackSansNotch_500Medium,
    StackSansNotch_600SemiBold,
    StackSansNotch_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(BG_COLOR);
      NavigationBar.setStyle('light');
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG_BASE }}>
      <AtmosphericBackground />
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <SQLiteProvider
            databaseName="jc.db"
            onInit={initializeDatabase}
            useSuspense
          >
            <StatusBar style="light" />
            <UserSettingsProvider>
              <MealDraftProvider>
                <AppNavigator />
              </MealDraftProvider>
            </UserSettingsProvider>
          </SQLiteProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
