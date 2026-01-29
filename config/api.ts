import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production URL
const PRODUCTION_URL = 'https://beacon-mhealth-production.up.railway.app/api';

/**
 * Get the API URL based on the environment.
 * Defaulting to production for deployment readiness.
 */
const getApiUrl = () => {
    // If you want to use local development, uncomment the logic below or use a specific flag
    /*
    if (__DEV__) {
        const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
        const localhost = debuggerHost?.split(':')[0];

        if (localhost) {
             return `http://${localhost}:3000/api`;
        }
        
        // Fallback for Android emulator or web if hostUri is missing
        if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
        if (Platform.OS === 'web') return 'http://localhost:3000/api';
    }
    */

    return PRODUCTION_URL;
};

export const API_URL = getApiUrl();
