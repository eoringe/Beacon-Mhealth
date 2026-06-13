import { API_URL, resilientFetch } from '@/config/api';
import authService from './authService';
import cacheService from './cacheService';
import syncService from './syncService';

const CACHE_KEY = 'children_list';

const getHeaders = async () => {
    const token = await authService.getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const childService = {
    // Add a child profile using offline-first caching and sync queue
    addChild: async (childData) => {
        try {
            console.log(`[childService] Offline-first addChild: name=${childData.firstName}`);
            const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const localChild = {
                id: tempId,
                first_name: childData.firstName,
                last_name: childData.lastName || '',
                date_of_birth: childData.dateOfBirth,
                gender: childData.gender,
                registration_number: childData.registrationNumber || null,
                photo_url: childData.photoUrl || null,
                created_at: new Date().toISOString()
            };

            // 1. Update cache immediately
            const cached = await cacheService.get(CACHE_KEY) || [];
            await cacheService.set(CACHE_KEY, [localChild, ...cached]);

            // 2. Queue background sync task
            await syncService.enqueue('ADD_CHILD', {
                tempId,
                childData
            });

            return localChild;
        } catch (error) {
            console.error('Error in offline-first addChild:', error);
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
                    const response = await resilientFetch(`${API_URL}/children`, { headers });
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

    // Update child profile using offline-first caching and sync queue
    updateChild: async (id, childData) => {
        try {
            console.log(`[childService] Offline-first updateChild: id=${id}`);
            
            // 1. Update cache immediately
            const cached = await cacheService.get(CACHE_KEY) || [];
            const index = cached.findIndex(c => c.id === id);
            let updatedChild = null;

            if (index > -1) {
                updatedChild = {
                    ...cached[index],
                    first_name: childData.firstName !== undefined ? childData.firstName : cached[index].first_name,
                    last_name: childData.lastName !== undefined ? childData.lastName : cached[index].last_name,
                    date_of_birth: childData.dateOfBirth !== undefined ? childData.dateOfBirth : cached[index].date_of_birth,
                    gender: childData.gender !== undefined ? childData.gender : cached[index].gender,
                    registration_number: childData.registrationNumber !== undefined ? childData.registrationNumber : cached[index].registration_number,
                    photo_url: childData.photoUrl !== undefined ? childData.photoUrl : cached[index].photo_url,
                    updated_at: new Date().toISOString()
                };
                cached[index] = updatedChild;
                await cacheService.set(CACHE_KEY, cached);
            }

            // 2. Queue background sync task
            await syncService.enqueue('UPDATE_CHILD', {
                id,
                childData
            });

            return updatedChild || { id, ...childData };
        } catch (error) {
            console.error('Error in offline-first updateChild:', error);
            throw error;
        }
    },

    // Delete child profile using offline-first caching and sync queue
    deleteChild: async (id) => {
        try {
            console.log(`[childService] Offline-first deleteChild: id=${id}`);

            // 1. Update cache immediately
            const cached = await cacheService.get(CACHE_KEY) || [];
            const filtered = cached.filter(c => c.id !== id);
            await cacheService.set(CACHE_KEY, filtered);

            // 2. Queue background sync task
            await syncService.enqueue('DELETE_CHILD', { id });

            return { success: true, message: 'Child profile deleted successfully (offline)' };
        } catch (error) {
            console.error('Error in offline-first deleteChild:', error);
            throw error;
        }
    }
};

