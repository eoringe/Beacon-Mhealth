import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';

interface TeleconsultScreenProps {
    initialRoomId?: string;
    patientName?: string;
    onClose?: () => void;
}

export default function TeleconsultScreen({ initialRoomId, patientName, onClose }: TeleconsultScreenProps) {
    const router = useRouter();
    // Generate a random room ID if none provided
    const [roomId] = useState(initialRoomId || `Teleconsult-${Math.random().toString(36).substring(7)}`);

    // Construct the Jitsi URL with config params to disable deep linking and start in web mode
    const jitsiUrl = `https://meet.jit.si/${roomId}#config.disableDeepLinking=true&config.prejoinPageEnabled=false`;

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            router.back();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Custom Header/Close Button (Overlay) */}
            <View style={styles.header}>
                <View style={styles.roomInfo}>
                    <Text style={styles.roomText}>Room: {roomId}</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>End Call</Text>
                </TouchableOpacity>
            </View>

            <WebView
                source={{ uri: jitsiUrl }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2E5BFF" />
                        <Text style={styles.loadingText}>Loading Meeting...</Text>
                    </View>
                )}
                // Grant camera/microphone permissions automatically on Android
                onPermissionRequest={(event) => {
                    const { resources } = event;
                    // Check if the requested resources are what we expect
                    if (resources.includes('android.webkit.resource.VIDEO_CAPTURE') ||
                        resources.includes('android.webkit.resource.AUDIO_CAPTURE')) {
                        event.grant(resources);
                    }
                }}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                // Custom User Agent to ensure Jitsi treats this as a supported mobile browser
                userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Mobile Safari/537.36"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomInfo: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 8,
    },
    roomText: {
        color: '#fff',
        fontSize: 12,
    },
    closeButton: {
        backgroundColor: 'rgba(255, 69, 58, 0.9)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
    },
});
