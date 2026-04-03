/**
 * Patient Service
 * Handles patient lookup from external database via backend API
 */

import AuthService, { API_URL } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cacheService from './cacheService';

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
export const lookupPatient = async (registrationNumber, forceRefresh = false) => {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const cacheKey = `patient_${registrationNumber}`;

        const result = await cacheService.fetchWithCache(
            cacheKey,
            async () => {
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
            },
            { forceRefresh }
        );

        return result.data;
    } catch (error) {
        console.error('Error looking up patient:', error);
        throw error;
    }
};

/**
 * Search patients by name or registration number (NOT cached - search results should be fresh)
 */
// Securely verify patient with 5-parameter check
export const verifyPatient = async (verificationData) => {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(
            `${API_URL}/patients/verify-secure`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(verificationData)
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Verification failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Error verifying patient:', error);
        throw error;
    }
};

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
 * Get media/documents for a child by registration number (cached)
 */
export const getMediaList = async (registrationNumber) => {
    try {
        if (!registrationNumber) {
            return [];
        }
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        console.log(`🌐 FRESH API FETCH: media_${registrationNumber} (caching disabled)`);
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

export default {
    lookupPatient,
    searchPatients,
    getMediaList,
    getMediaDownloadUrl,
};

