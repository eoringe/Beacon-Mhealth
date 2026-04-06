import { useEffect, useState, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, AppState, AppStateStatus, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { useAlert } from '@/contexts/AlertContext';
import { DrawerProvider, useDrawer } from '@/contexts/DrawerContext';
import NavigationDrawer from '@/components/NavigationDrawer';

export default function TabLayout() {
  return (
    <DrawerProvider>
      <TabLayoutInner />
    </DrawerProvider>
  );
}

function TabLayoutInner() {
  const insets = useSafeAreaInsets();
  const { colorScheme, isDark } = useTheme();
  const router = useRouter();
  const { selectedChild } = useChild() as { selectedChild: any };
  const { showAlert } = useAlert();
  const { drawerVisible, closeDrawer } = useDrawer();
  const [key, setKey] = useState(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);

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
    <View style={{ flex: 1 }}>
      <Tabs
        key={key}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
          tabBarStyle: {
            backgroundColor: isDark ? colorScheme.surface : colorScheme.primary,
            borderTopWidth: 1,
            borderTopColor: isDark ? colorScheme.border : colorScheme.primary,
            paddingBottom: bottomPadding,
            paddingTop: 8,
            height: tabBarHeight,
          },
          tabBarLabelStyle: {
            fontSize: 10, // Reduced from 12 to prevent truncation
            fontWeight: '500',
            textAlign: 'center',
          },
          sceneStyle: {
            backgroundColor: colorScheme.background,
          },
        }}
        screenListeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Check if navigating to appointments tab without a child selected
            if (route.name === 'appointments' && !selectedChild) {
              e.preventDefault();
              showAlert(
                'No Child Selected',
                'Please select a child from the dashboard to access appointments.',
                [{ text: 'OK' }],
                'warning'
              );
              return;
            }

            // Special handling for the profile tab to ensure it always resets to root
            if (route.name === 'profile') {
              e.preventDefault();
              router.replace('/profile');
              return;
            }

            // Only reset when pressing a tab that has nested screens
            const state = navigation.getState();
            const currentTabState = state.routes.find((r: any) => r.name === route.name)?.state;

            // If the tab has a nested stack with more than 1 screen, reset to first screen
            if (currentTabState && typeof currentTabState.index === 'number' && currentTabState.index > 0) {
              e.preventDefault();
              navigation.reset({
                index: 0,
                routes: [{ name: route.name }],
              });
            }
          },
        })}
      >

        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Milestones',
            href: null,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="flag" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Consults',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="calendar-today" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="asd-checklist"
          options={{
            title: 'ASD Screener',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="psychology" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <NavigationDrawer visible={drawerVisible} onClose={closeDrawer} />
    </View>
  );
}