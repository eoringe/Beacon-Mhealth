/**
 * Patient Service
 * Handles patient lookup from external database via backend API
 */

import AuthService, { API_URL } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthToken = async () => {
    try {
        const token = await AuthService.getToken();
        return token;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

/**
 * Lookup patient by registration number
 * Returns comprehensive patient data including parent, last visit, and latest triage
 */
export const lookupPatient = async (registrationNumber) => {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(
            `${API_URL}/patients/lookup/${encodeURIComponent(registrationNumber)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to lookup patient');
        }

        return await response.json();
    } catch (error) {
        console.error('Error looking up patient:', error);
        throw error;
    }
};

/**
 * Search patients by name or registration number
 */
export const searchPatients = async (query) => {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(
            `${API_URL}/patients/search?query=${encodeURIComponent(query)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to search patients');
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching patients:', error);
        throw error;
    }
};

/**
 * Get media/documents for a child by registration number
 */
export const getMediaList = async (registrationNumber) => {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(
            `${API_URL}/media/${encodeURIComponent(registrationNumber)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch media');
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching media:', error);
        throw error;
    }
};

/**
 * Get download URL for a media item
 */
export const getMediaDownloadUrl = (mediaId) => {
    return `${API_URL}/media/download/${mediaId}`;
};

/**
 * Get prescriptions for a child by registration number
 */
export const getPrescriptions = async (registrationNumber) => {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(
            `${API_URL}/prescriptions/${encodeURIComponent(registrationNumber)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch prescriptions');
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        throw error;
    }
};

export default {
    lookupPatient,
    searchPatients,
    getMediaList,
    getMediaDownloadUrl,
    getPrescriptions,
};
