import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileLayout() {
    const { colorScheme } = useTheme();

    return (
        <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colorScheme.background },
            animation: 'slide_from_right'
        }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="edit" />
            <Stack.Screen name="change-password" />
            <Stack.Screen name="children" />
            <Stack.Screen name="child-profile" />
        </Stack>
    );
}
