import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function TourLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          presentation: 'card',
          gestureDirection: 'horizontal',
          contentStyle: {
            backgroundColor: 'white',
          },
        }}
      />
    </View>
  );
}