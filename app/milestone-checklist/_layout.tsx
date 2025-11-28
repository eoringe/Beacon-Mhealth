import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function MilestoneChecklistLayout() {
    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <Stack screenOptions={{
                headerShown: false,
                animation: 'default',
            }} />
        </View>
    );
}
