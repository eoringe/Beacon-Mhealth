import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
    if (Platform.OS === 'web') return 'http://localhost:3000/api';

    const hostUri = Constants.expoConfig?.hostUri
        || Constants.manifest2?.extra?.expoGo?.debuggerHost
        || Constants.manifest?.debuggerHost;

    if (hostUri) {
        const host = hostUri.split(':')[0];
        return `http://${host}:3000/api`;
    }

    return Platform.OS === 'android' ? 'http://10.254.253.231:3000/api' : 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

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

            return await response.json();
        } catch (error) {
            console.error('Error adding measurement:', error);
            throw error;
        }
    }

    // Get all growth measurements for a child
    async getMeasurements(childId) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

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
        } catch (error) {
            console.error('Error fetching measurements:', error);
            throw error;
        }
    }

    // Delete a growth measurement
    async deleteMeasurement(id) {
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

            return await response.json();
        } catch (error) {
            console.error('Error deleting measurement:', error);
            throw error;
        }
    }
}

export default new GrowthService();
