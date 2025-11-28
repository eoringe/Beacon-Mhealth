import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function TourLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 350,
          contentStyle: {
            backgroundColor: 'white',
          },
        }}
      />
    </View>
  );
}