import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { Platform, AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [key, setKey] = useState(0);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);


  // Handle app state changes - force re-render on resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Force SafeAreaProvider to recalculate insets
        setKey(prev => prev + 1);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider key={key}>
      <ThemeProvider>
        <NavigationWrapper />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function NavigationWrapper() {
  const { isDark, colorScheme } = useTheme();

  // Create custom navigation theme based on current theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colorScheme.background,
      card: colorScheme.surface,
      border: colorScheme.border,
      primary: colorScheme.primary,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <View style={{ flex: 1, backgroundColor: colorScheme.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{
          headerShown: false,
          animation: 'default',
          presentation: 'card',
          contentStyle: { backgroundColor: colorScheme.background },
        }}>
          <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="growth-chart" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="vaccinations" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="child-profile" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="milestone-checklist" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="milestone-overview" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="add_child" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="appointments" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="teleconsultation" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="notifications" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    </NavigationThemeProvider>
  );
}
