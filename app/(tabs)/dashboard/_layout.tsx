import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function DashboardLayout() {
    const { colorScheme } = useTheme();

    return (
        <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colorScheme.background },
            animation: 'slide_from_right'
        }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="teleconsultation" />
            <Stack.Screen name="growth-chart" />
            <Stack.Screen name="vaccinations" />
            <Stack.Screen name="milestone-checklist" />
            <Stack.Screen name="prescriptions" />
            <Stack.Screen name="medical-reports" />
            <Stack.Screen name="feeding" />
            <Stack.Screen name="sleep" />
            <Stack.Screen name="teething" />
            <Stack.Screen name="firsts" />
            <Stack.Screen name="activities" />
        </Stack>
    );
}
