import { Stack } from 'expo-router';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
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
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen
                name="onboarding"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </SQLiteProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
