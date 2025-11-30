import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
    if (Platform.OS === 'web') return 'http://localhost:3000/api';

    const origin = Constants.expoConfig?.hostUri;

    if (origin) {
        const url = `http://${origin.split(':')[0]}:3000/api`;
        console.log('AuthService: Using dynamic API URL:', url);
        return url;
    }

    return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

class AuthService {
    // Store auth token
    async storeToken(token) {
        try {
            await AsyncStorage.setItem('authToken', token);
        } catch (error) {
            console.error('Error storing token:', error);
        }
    }

    // Get auth token
    async getToken() {
        try {
            return await AsyncStorage.getItem('authToken');
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    // Remove auth token
    async removeToken() {
        try {
            await AsyncStorage.removeItem('authToken');
        } catch (error) {
            console.error('Error removing token:', error);
        }
    }

    // Register user in backend after Firebase auth
    async registerUser(firebaseUser) {
        try {
            console.log('AuthService: Starting backend registration for', firebaseUser.email);
            const token = await firebaseUser.getIdToken();
            console.log('AuthService: Got Firebase token, calling API:', `${API_URL}/auth/register`);

            // Add timeout to prevent infinite hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        firebaseUid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoUrl: firebaseUser.photoURL
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                console.log('AuthService: API Response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('AuthService: API Error body:', errorText);
                    throw new Error(`Failed to register user in backend: ${response.status} ${errorText}`);
                }

                const data = await response.json();
                console.log('AuthService: Backend registration successful');
                await this.storeToken(token);

                return data;
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    throw new Error('Connection to backend timed out. Is the server running?');
                }
                throw fetchError;
            }
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    // Get user profile from backend
    async getProfile() {
        try {
            const token = await this.getToken();

            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting profile:', error);
            throw error;
        }
    }

    // Update FCM token
    async updateFCMToken(fcmToken) {
        try {
            const token = await this.getToken();

            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch(`${API_URL}/auth/fcm-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fcmToken })
            });

            if (!response.ok) {
                throw new Error('Failed to update FCM token');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating FCM token:', error);
            throw error;
        }
    }

    // Logout
    async logout() {
        await this.removeToken();
    }
}

export default new AuthService();
