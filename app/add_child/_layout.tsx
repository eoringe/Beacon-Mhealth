import { Stack } from 'expo-router';

export default function AddChildLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        animationDuration: 350,
      }}
    />
  );
}
