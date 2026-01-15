import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { auth } from '@/config/firebase';
import { jwtDecode } from "jwt-decode";
import { decode } from "base-64";
global.atob = decode; // Polyfill for jwt-decode

// USE PRODUCTION URL for all platforms
const API_URL = 'https://beacon-mhealth-production.up.railway.app/api';

console.log('AuthService: Using PRODUCTION API URL:', API_URL);

export { API_URL };

class AuthService {
    // Store auth token
    async storeToken(token) {
        try {
            await AsyncStorage.setItem('authToken', token);
        } catch (error) {
            console.error('Error storing token:', error);
        }
    }

    // Get auth token with auto-refresh logic
    async getToken() {
        try {
            let token = await AsyncStorage.getItem('authToken');

            if (!token) {
                // If no stored token, try to get fresh from Firebase if user is logged in
                const user = auth.currentUser;
                if (user) {
                    console.log('AuthService: No stored token, fetching fresh one from Firebase');
                    token = await user.getIdToken(true);
                    await this.storeToken(token);
                    return token;
                }
                return null;
            }

            // Check if token is expired or about to expire
            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                // Buffer time (e.g., refresh if expiring in next 5 minutes)
                const BUFFER = 300;

                if (decoded.exp < currentTime + BUFFER) {
                    console.log('AuthService: Token expired or expiring soon, refreshing...');
                    const user = auth.currentUser;
                    if (user) {
                        token = await user.getIdToken(true);
                        console.log('AuthService: Token refreshed successfully');
                        await this.storeToken(token);
                        return token;
                    } else {
                        console.warn('AuthService: Token expired but no Firebase user found to refresh');
                        // Optionally force logout here or return null
                    }
                }
            } catch (decodeError) {
                console.error('AuthService: Error validating token, fetching new one:', decodeError);
                const user = auth.currentUser;
                if (user) {
                    token = await user.getIdToken(true);
                    await this.storeToken(token);
                    return token;
                }
            }

            return token;
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
            const token = await this.getToken(); // Uses refreshed token

            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                // Double retry logic could go here if needed, but getToken handles mostly
                throw new Error('Unauthorized');
            }

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
            const token = await this.getToken(); // Uses refreshed token

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
        try {
            const user = auth.currentUser;
            if (user) {
                await auth.signOut();
            }
        } catch (e) {
            console.error('Firebase signout error:', e);
        }
        await this.removeToken();
    }
}

export default new AuthService();
