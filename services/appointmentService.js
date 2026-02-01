import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import cacheService from './cacheService';
import { API_URL } from './authService';


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

    // Get all available doctors (cached - doctors rarely change)
    async getDoctors(forceRefresh = false) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const cacheKey = 'doctors_list';

            const result = await cacheService.fetchWithCache(
                cacheKey,
                async () => {
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

                    const json = await response.json();
                    return Array.isArray(json) ? json : (json.data || []);
                },
                { forceRefresh }
            );

            if (result.fromCache) {
                console.log('[AppointmentService] Loaded doctors from cache');
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching doctors:', error);
            throw error;
        }
    }

    // Get specializations (cached - rarely changes)
    async getSpecializations(forceRefresh = false) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const cacheKey = 'specializations_list';

            const result = await cacheService.fetchWithCache(
                cacheKey,
                async () => {
                    const response = await fetch(`${API_URL}/appointments/specializations`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch specializations');
                    }

                    const json = await response.json();
                    return json.data || [];
                },
                { forceRefresh }
            );

            if (result.fromCache) {
                console.log('[AppointmentService] Loaded specializations from cache');
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching specializations:', error);
            return [];
        }
    }

    // Get available time slots for a doctor on a specific date (NOT cached - real-time availability)
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

            // Invalidate appointments cache on mutation
            await cacheService.invalidatePattern('appointments');

            return await response.json();
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    }

    // Get user's appointments (cached)
    async getAppointments(status = null, forceRefresh = false) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const cacheKey = status ? `appointments_${status}` : 'appointments_all';

            const result = await cacheService.fetchWithCache(
                cacheKey,
                async () => {
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
                },
                { forceRefresh }
            );

            if (result.fromCache) {
                console.log(`[AppointmentService] Loaded appointments from cache`);
            }

            // ENHANCEMENT: Populate doctor_name if missing, using cached doctors list
            try {
                const appointments = result.data;
                if (Array.isArray(appointments) && appointments.length > 0) {
                    // We use getDoctors(false) to use cached version if available
                    const doctors = await this.getDoctors(false);

                    const doctorMap = {};
                    doctors.forEach(d => {
                        doctorMap[d.id] = d;
                    });

                    // Helper to remove "Dr." prefix
                    const cleanName = (name) => {
                        if (!name) return name;
                        return name.replace(/^Dr\.?\s+/i, '');
                    };

                    // Map doctor details to appointments
                    const enhancedAppointments = appointments.map(apt => {
                        // FORCE Override: Prioritize doctor_id lookup to fix incorrect names (e.g. receptionist names)
                        if (apt.doctor_id) {
                            const doctor = doctorMap[apt.doctor_id];
                            if (doctor) {
                                return {
                                    ...apt,
                                    doctor_name: cleanName(doctor.name),
                                    doctor_photo: doctor.photo_url || apt.doctor_photo,
                                    doctor_specialty: doctor.specialization || apt.doctor_specialty
                                };
                            }
                        }

                        // Fallback: If no doctor_id match, clean the existing name if present
                        if (apt.doctor_name) {
                            return {
                                ...apt,
                                doctor_name: cleanName(apt.doctor_name)
                            };
                        }
                        return apt;
                    });

                    return enhancedAppointments;
                }
            } catch (enrichError) {
                console.warn('Failed to enrich appointments with doctor details:', enrichError);
                // Fallback to original data if enrichment fails
                return result.data;
            }

            return result.data;
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

            // Invalidate appointments cache
            await cacheService.invalidatePattern('appointments');

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

            // Invalidate appointments cache
            await cacheService.invalidatePattern('appointments');

            return await response.json();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw error;
        }
    }
}

export default new AppointmentService();

