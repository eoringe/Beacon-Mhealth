import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function AppointmentsLayout() {
    const { colorScheme } = useTheme();

    return (
        <Stack screenOptions={{
            headerShown: false,
            animation: 'default',
            presentation: 'card',
            contentStyle: { backgroundColor: colorScheme.background },
        }} />
    );
}
