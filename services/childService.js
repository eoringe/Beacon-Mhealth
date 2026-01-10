import { API_URL } from './authService';
import { getAuth } from 'firebase/auth';
import cacheService from './cacheService';

const CACHE_KEY = 'children_list';

const getHeaders = async () => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const childService = {
    addChild: async (childData) => {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_URL}/children`, {
                method: 'POST',
                headers,
                body: JSON.stringify(childData)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add child');
            }

            // Invalidate cache on mutation
            await cacheService.invalidate(CACHE_KEY);

            return data;
        } catch (error) {
            throw error;
        }
    },

    getChildren: async (forceRefresh = false) => {
        try {
            const headers = await getHeaders();

            // Use cache-first strategy
            const result = await cacheService.fetchWithCache(
                CACHE_KEY,
                async () => {
                    const response = await fetch(`${API_URL}/children`, { headers });
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to fetch children');
                    }
                    return data;
                },
                { forceRefresh }
            );

            if (result.fromCache) {
                console.log('[childService] Loaded children from cache');
            }

            return result.data;
        } catch (error) {
            throw error;
        }
    },

    updateChild: async (id, childData) => {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_URL}/children/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(childData)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update child');
            }

            // Invalidate cache on mutation
            await cacheService.invalidate(CACHE_KEY);

            return data;
        } catch (error) {
            throw error;
        }
    },

    deleteChild: async (id) => {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_URL}/children/${id}`, {
                method: 'DELETE',
                headers
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete child');
            }

            // Invalidate cache on mutation
            await cacheService.invalidate(CACHE_KEY);

            return data;
        } catch (error) {
            throw error;
        }
    }
};

