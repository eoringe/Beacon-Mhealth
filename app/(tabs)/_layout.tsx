import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState, useRef } from 'react';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const [key, setKey] = useState(0);
  const appState = useRef(AppState.currentState);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground - force re-render to recalculate safe areas
        setKey(prev => prev + 1);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Calculate proper bottom padding - use safe area insets with minimum fallback
  // On Android with gesture navigation, insets.bottom can be 0 even with nav bar
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);

  // Tab bar height includes the padding
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      key={key}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colorScheme.primary,
        tabBarInactiveTintColor: colorScheme.textTertiary,
        tabBarStyle: {
          backgroundColor: colorScheme.surface,
          borderTopWidth: 1,
          borderTopColor: colorScheme.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Milestones',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="child-care" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}