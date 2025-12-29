import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TeleconsultScreen from '../../components/TeleconsultScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function TeleconsultScreenApp() {
    const router = useRouter();
    const { roomId, patientName } = useLocalSearchParams<{ roomId: string; patientName: string }>();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar style="light" />
            <TeleconsultScreen
                initialRoomId={roomId}
                patientName={patientName}
                onClose={() => router.back()}
            />
        </SafeAreaView>
    );
}
