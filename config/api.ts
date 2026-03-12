import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production URL
const PRODUCTION_URL = 'https://beacon-mhealth-production.up.railway.app/api';

/**
 * Get the API URL based on the environment.
 * Defaulting to production for deployment readiness.
 */
const getApiUrl = () => {
    // For now, always return production URL as requested to reconnect to live backend
    return PRODUCTION_URL;
};

export const API_URL = getApiUrl();
