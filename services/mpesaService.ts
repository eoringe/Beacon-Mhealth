
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// For M-Pesa testing, use Railway production server directly
// This ensures callbacks are processed on the same server that's being polled
const USE_PRODUCTION_FOR_MPESA = true;
const PRODUCTION_URL = 'https://beacon-mhealth-production.up.railway.app/api';

const getApiUrl = () => {
    // Use production for M-Pesa to ensure callback reaches the same server
    if (USE_PRODUCTION_FOR_MPESA) {
        console.log('MpesaService: Using PRODUCTION API URL');
        return PRODUCTION_URL;
    }

    if (Platform.OS === 'web') return 'http://localhost:3000/api';

    const origin = Constants.expoConfig?.hostUri;

    if (origin) {
        const url = `http://${origin.split(':')[0]}:3000/api`;
        console.log('MpesaService: Using dynamic API URL:', url);
        return url;
    }

    console.log('MpesaService: hostUri not found, falling back to static URL');
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
};

const API_BASE = getApiUrl();



// Since we might not have the complexity of strict TS types for quick implementation:
export interface AppointmentData {
    child_id: number;
    doctor_id: number;
    appointment_date: string;
    appointment_time: string;
    appointment_type: 'PHYSICAL' | 'TELECONSULT';
    reason?: string;
    notes?: string;
}

const getHeaders = async () => {
    // We need to support auth if required. 
    // Assuming public for STK Push initiation or standard bearer token if we had auth service handy
    // For now, simple JSON content type
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
};

export const mpesaService = {
    initiateAppointmentPayment: async (
        phone: string,
        amount: number,
        appointmentData: AppointmentData
    ) => {
        try {
            console.log('Initiating Payment:', { phone, amount, appointmentData });
            const response = await fetch(`${API_BASE}/mpesa/stk-push`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({
                    payment_type: 'appointment',
                    reference_id: 0,
                    phone,
                    amount,
                    appointment_data: appointmentData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Payment initiation failed');
            }

            return data;
        } catch (error) {
            console.error('Payment Error:', error);
            throw error;
        }
    },

    checkPaymentStatus: async (checkoutRequestId: string) => {
        try {
            const response = await fetch(`${API_BASE}/mpesa/status/${checkoutRequestId}`, {
                headers: await getHeaders(),
            });
            return await response.json();
        } catch (error) {
            console.error('Check Status Error:', error);
            throw error;
        }
    },

    pollPaymentStatus: (
        checkoutRequestId: string,
        onSuccess: (receipt: string) => void,
        onFailure: (reason: string) => void
    ) => {
        let attempts = 0;
        const maxAttempts = 20; // 1 minute roughly (3s * 20)

        const interval = setInterval(async () => {
            attempts++;

            try {
                const status = await mpesaService.checkPaymentStatus(checkoutRequestId);
                console.log('Poll Status:', status.status);

                if (status.status === 'completed') {
                    clearInterval(interval);
                    onSuccess(status.mpesa_receipt_number);
                } else if (status.status === 'failed' || status.status === 'cancelled') {
                    clearInterval(interval);
                    onFailure(status.result_desc || 'Payment failed');
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    onFailure('Payment timed out. Please check your phone.');
                }
            } catch (e) {
                // Ignore transient errors during poll, count as attempt
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    onFailure('Network error checking payment status');
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }
};

export default mpesaService;
