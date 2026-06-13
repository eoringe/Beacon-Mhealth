import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production URL
const PRODUCTION_URL = 'https://beacon-mhealth-production.up.railway.app/api';

/**
 * Get the API URL based on the environment.
 */
const getApiUrl = () => {
    // For both Development and Production Mode, connect to the Railway backend
    return PRODUCTION_URL;
};

export const API_URL = getApiUrl();

/**
 * Resilient fetch wrapper that automatically retries upon transient network failures
 * and transient server gateway/load balancer errors (502, 503, 504).
 * Each individual attempt is guarded by an AbortController timeout so that
 * React Native's whatwg-fetch polyfill doesn't hang for 30-60 s on stalled sockets.
 */
export const resilientFetch = async (
    url: string | URL | Request, 
    options: RequestInit = {}, 
    retries = 3, 
    delay = 1000,
    perRequestTimeoutMs = 15000
): Promise<Response> => {
    const method = (options?.method || 'GET').toUpperCase();
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '(Request)';
    console.log(`[ResilientFetch] ▶ ${method} ${urlStr} (max retries: ${retries}, timeout: ${perRequestTimeoutMs}ms)`);

    for (let i = 0; i <= retries; i++) {
        // Create a per-attempt AbortController so stalled requests fail fast
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), perRequestTimeoutMs);

        try {
            console.log(`[ResilientFetch]   Attempt ${i + 1}/${retries + 1}...`);
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            console.log(`[ResilientFetch]   ◀ ${response.status} ${response.statusText}`);
            
            // Retry on transient server gateway errors
            if (!response.ok && [502, 503, 504].includes(response.status) && i < retries) {
                throw new Error(`Transient server error: ${response.status}`);
            }
            
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            const errorMessage = error?.message || '';
            console.log(`[ResilientFetch]   ✖ Attempt ${i + 1} failed: [${error?.name}] ${errorMessage}`);
            
            const isNetworkError = 
                error instanceof TypeError || 
                errorMessage.includes('Network request failed') ||
                errorMessage.includes('NetworkError') ||
                errorMessage.includes('Failed to fetch') ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('aborted') ||
                errorMessage.includes('Transient server error') ||
                error.name === 'AbortError';

            if (isNetworkError && i < retries) {
                const backoffDelay = delay * Math.pow(2, i);
                console.log(`[ResilientFetch]   ↻ Retrying in ${backoffDelay}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                continue;
            }
            console.log(`[ResilientFetch]   ✖ FINAL FAILURE after ${i + 1} attempts: ${errorMessage}`);
            throw error;
        }
    }
    throw new Error('Request failed after max retries');
};
