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

class AppointmentService {
    // Get auth token
    async getToken() {
        try {
            return await AsyncStorage.getItem('authToken');
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    // Get all available doctors
    async getDoctors() {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const response = await fetch(`${API_URL}/appointments/doctors`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`Fetch doctors failed: ${response.status} ${text}`);
                throw new Error(`Failed to fetch doctors: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching doctors:', error);
            throw error;
        }
    }

    // Get available time slots for a doctor on a specific date
    async getDoctorAvailability(doctorId, date) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const response = await fetch(
                `${API_URL}/appointments/doctors/${doctorId}/availability?date=${date}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const text = await response.text();
                console.error(`Fetch availability failed: ${response.status} ${text}`);
                throw new Error(`Failed to fetch availability: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching availability:', error);
            throw error;
        }
    }

    // Create a new appointment
    async createAppointment(appointmentData) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const response = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(appointmentData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Create appointment failed: ${response.status}`, errorData);
                throw new Error(errorData.error || `Failed to create appointment: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    }

    // Get user's appointments
    async getAppointments(status = null) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            let url = `${API_URL}/appointments`;
            if (status) {
                url += `?status=${status}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`Fetch appointments failed: ${response.status} ${text}`);
                throw new Error(`Failed to fetch appointments: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw error;
        }
    }

    // Cancel an appointment
    async cancelAppointment(appointmentId) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Cancel appointment failed: ${response.status}`, errorData);
                throw new Error(errorData.error || `Failed to cancel appointment: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            throw error;
        }
    }

    // Delete an appointment (hard delete)
    async deleteAppointment(appointmentId) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const response = await fetch(`${API_URL}/appointments/${appointmentId}/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Delete appointment failed: ${response.status}`, errorData);
                throw new Error(errorData.error || `Failed to delete appointment: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw error;
        }
    }
}

export default new AppointmentService();
