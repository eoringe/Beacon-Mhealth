import { API_URL } from './authService';
import { getAuth } from 'firebase/auth';
import cacheService from './cacheService';

const getHeaders = async () => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const milestoneService = {
    // Save milestone responses for a child
    saveMilestoneResponses: async (childId, ageMonths, category, responses) => {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_URL}/milestones/${childId}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ageMonths,
                    category,
                    responses
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save milestone responses');
            }

            // Invalidate milestone caches on save
            await cacheService.invalidatePattern(`milestones_${childId}`);

            return data;
        } catch (error) {
            console.error('Error saving milestone responses:', error);
            throw error;
        }
    },

    // Get milestone responses for a specific child, age, and category
    getMilestoneResponses: async (childId, ageMonths, category, forceRefresh = false) => {
        try {
            const headers = await getHeaders();
            const cacheKey = `milestones_${childId}_${ageMonths}_${category}`;

            const result = await cacheService.fetchWithCache(
                cacheKey,
                async () => {
                    const response = await fetch(
                        `${API_URL}/milestones/${childId}?ageMonths=${ageMonths}&category=${category}`,
                        { headers }
                    );
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to fetch milestone responses');
                    }
                    return data;
                },
                { forceRefresh }
            );

            if (result.fromCache) {
                console.log(`[milestoneService] Loaded from cache: ${cacheKey}`);
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching milestone responses:', error);
            throw error;
        }
    },

    // Get all milestone responses for a child
    getAllMilestoneResponsesForChild: async (childId, forceRefresh = false) => {
        try {
            const headers = await getHeaders();
            const cacheKey = `milestones_${childId}_all`;

            const result = await cacheService.fetchWithCache(
                cacheKey,
                async () => {
                    const response = await fetch(`${API_URL}/milestones/${childId}/all`, {
                        headers
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to fetch all milestone responses');
                    }
                    return data;
                },
                { forceRefresh }
            );

            if (result.fromCache) {
                console.log(`[milestoneService] Loaded all milestones from cache for child ${childId}`);
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching all milestone responses:', error);
            throw error;
        }
    }
};

