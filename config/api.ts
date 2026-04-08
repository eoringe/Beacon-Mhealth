import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production URL
const PRODUCTION_URL = 'https://beacon-mhealth-production.up.railway.app/api';

/**
 * Get the API URL based on the environment.
 */
const getApiUrl = () => {
    // For both Development and Production Mode, connect to the Railway backend
    return PRODUCTION_URL;
};

export const API_URL = getApiUrl();
