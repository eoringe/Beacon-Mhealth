import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function FirstsLayout() {
    const { colorScheme } = useTheme();

    return (
        <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colorScheme.background },
            animation: 'slide_from_right'
        }}>
            <Stack.Screen name="index" />
        </Stack>
    );
}
