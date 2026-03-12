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
                    return json.data || [];
                },
                { forceRefresh, ttl: 3600000 } // 60 minutes cache
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
                { forceRefresh, ttl: 3600000 } // 60 minutes cache
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

    // Get available time slots for a specialization on a specific date (pools all doctors)
    async getSpecializationAvailability(specializationId, date, appointmentType = 'IN_PERSON') {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const response = await fetch(
                `${API_URL}/appointments/specialization/${specializationId}/availability?date=${date}&appointmentType=${appointmentType}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const text = await response.text();
                console.error(`Fetch specialization availability failed: ${response.status} ${text}`);
                throw new Error(`Failed to fetch availability: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching specialization availability:', error);
            throw error;
        }
    }

    // Get teleconsultation windows for a specialization
    async getSpecializationTeleWindows(specializationId) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const response = await fetch(
                `${API_URL}/appointments/specialization/${specializationId}/tele-windows`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch tele windows');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching tele windows:', error);
            return [];
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

    // Create a guest appointment (for children without registration number)
    // This calls the external Laravel API directly
    async createGuestAppointment(guestData) {
        try {
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            // The guest endpoint is on the external Laravel API, not our Node.js backend
            // We'll proxy through our backend to maintain auth
            const response = await fetch(`${API_URL}/appointments/guest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(guestData)
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                console.error(`Create guest appointment failed: ${response.status}`, responseData);
                // Handle Laravel validation errors
                if (responseData.errors) {
                    const errorMessages = Object.values(responseData.errors).flat().join('\n');
                    throw new Error(errorMessages);
                }
                throw new Error(responseData.message || responseData.error || `Failed to create appointment: ${response.status}`);
            }

            // Check for business logic errors (Laravel returns 200 with success: false)
            if (responseData.success === false) {
                throw new Error(responseData.message || 'Booking failed');
            }

            // Invalidate appointments cache on mutation
            await cacheService.invalidatePattern('appointments');

            return responseData;
        } catch (error) {
            console.error('Error creating guest appointment:', error);
            throw error;
        }
    }

    // Get user's appointments (cached)
    async getAppointments(status = null, forceRefresh = false, childId = null) {
        try {
            const token = await this.getToken();
            if (!token) {
                // During logout, the token is cleared before background fetches finish.
                // Return empty data silently instead of throwing an error.
                console.log('[AppointmentService] No token available, returning empty (likely logging out)');
                return [];
            }

            const cacheKey = `appointments_${status || 'all'}_${childId || 'all'}`;

            const result = await cacheService.fetchWithCache(
                cacheKey,
                async () => {
                    let url = `${API_URL}/appointments`;
                    const params = [];
                    if (status) params.push(`status=${status}`);
                    if (childId) params.push(`childId=${childId}`);

                    if (params.length > 0) {
                        url += `?${params.join('&')}`;
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
                // DEBUG: Log raw appointments received from backend
                console.log('[Frontend DEBUG] Raw appointments from API:', JSON.stringify(appointments && appointments.slice ? appointments.slice(0, 3) : appointments, null, 2));

                if (Array.isArray(appointments) && appointments.length > 0) {
                    // DEBUG: Log doctor_id and staff_id for each appointment
                    appointments.forEach(apt => {
                        console.log(`[Frontend DEBUG] Apt ID: ${apt.id}, doctor_id: ${apt.doctor_id}, staff_id: ${apt.staff_id}, child_name: ${apt.child_name}, doctor_name: ${apt.doctor_name}`);
                    });
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
                                    doctor_name: (doctor.specialization === 'Developmental Paediatrician' ? 'Dr. ' : '') + cleanName(doctor.name),
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

