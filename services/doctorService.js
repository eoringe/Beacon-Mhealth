import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './authService';

/**
 * Get auth token from storage
 */
const getAuthToken = async () => {
    try {
        return await AsyncStorage.getItem('authToken');
    } catch {
        return null;
    }
};

/**
 * Get all doctors and therapists from the clinic
 */
export const getDoctors = async () => {
    try {
        const token = await getAuthToken();

        const response = await fetch(`${API_URL}/doctors`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch doctors');
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching doctors:', error);
        throw error;
    }
};

/**
 * Get all specializations
 */
export const getSpecializations = async () => {
    try {
        const token = await getAuthToken();

        const response = await fetch(`${API_URL}/doctors/specializations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch specializations');
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching specializations:', error);
        throw error;
    }
};

/**
 * Get doctors by specialization
 */
export const getDoctorsBySpecialization = async (specialization) => {
    try {
        const token = await getAuthToken();

        const response = await fetch(
            `${API_URL}/doctors/specialization/${encodeURIComponent(specialization)}`,
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
            throw new Error(error.message || 'Failed to fetch doctors');
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching doctors by specialization:', error);
        throw error;
    }
};

export default {
    getDoctors,
    getSpecializations,
    getDoctorsBySpecialization,
};
