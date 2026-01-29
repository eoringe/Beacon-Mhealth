import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from '@/config/api';

const API_BASE = API_URL;



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
