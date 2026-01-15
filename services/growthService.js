import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import cacheService from './cacheService';
import { API_URL } from './authService';

class GrowthService {
    // Get auth token
    async getToken() {
        try {
            return await AsyncStorage.getItem('authToken');
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    // Add a new growth measurement
    async addMeasurement(childId, measurementData) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const response = await fetch(`${API_URL}/growth/${childId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(measurementData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Add measurement failed: ${response.status}`, errorData);
                throw new Error(errorData.error || `Failed to add measurement: ${response.status}`);
            }

            // Invalidate cache on mutation
            await cacheService.invalidate(`growth_${childId}`);

            return await response.json();
        } catch (error) {
            console.error('Error adding measurement:', error);
            throw error;
        }
    }

    // Get all growth measurements for a child
    async getMeasurements(childId, forceRefresh = false) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const cacheKey = `growth_${childId}`;

            const result = await cacheService.fetchWithCache(
                cacheKey,
                async () => {
                    const response = await fetch(`${API_URL}/growth/${childId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        const text = await response.text();
                        console.error(`Fetch measurements failed: ${response.status} ${text}`);
                        throw new Error(`Failed to fetch measurements: ${response.status}`);
                    }

                    return await response.json();
                },
                { forceRefresh }
            );

            if (result.fromCache) {
                console.log(`[GrowthService] Loaded measurements from cache for child ${childId}`);
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching measurements:', error);
            throw error;
        }
    }

    // Delete a growth measurement
    async deleteMeasurement(id, childId) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const response = await fetch(`${API_URL}/growth/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Delete measurement failed: ${response.status}`, errorData);
                throw new Error(errorData.error || `Failed to delete measurement: ${response.status}`);
            }

            // Invalidate cache on mutation
            if (childId) {
                await cacheService.invalidate(`growth_${childId}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting measurement:', error);
            throw error;
        }
    }
}

export default new GrowthService();

