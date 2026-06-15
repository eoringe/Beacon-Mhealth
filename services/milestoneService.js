import { API_URL, resilientFetch } from '@/config/api';
import authService from './authService';
import cacheService from './cacheService';
import syncService from './syncService';

const getHeaders = async () => {
    const token = await authService.getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const milestoneService = {
    // Save milestone responses for a child using offline-first caching and sync queue
    saveMilestoneResponses: async (childId, ageMonths, category, responses) => {
        try {
            console.log(`[MilestoneService] Offline-first save: childId=${childId}, age=${ageMonths}, category=${category}`);

            // 1. Update individual category cache immediately
            const catCacheKey = `milestones_${childId}_${ageMonths}_${category}`;
            const localData = {
                child_id: childId,
                age_months: ageMonths,
                category,
                responses
            };
            await cacheService.set(catCacheKey, localData);

            // 2. Update all-milestones list cache immediately
            const allCacheKey = `milestones_${childId}_all`;
            let allResponses = await cacheService.get(allCacheKey);
            if (!allResponses) {
                allResponses = [];
            }
            if (Array.isArray(allResponses)) {
                const existingIndex = allResponses.findIndex(
                    row => row.category === category && Number(row.age_months) === Number(ageMonths)
                );
                if (existingIndex > -1) {
                    allResponses[existingIndex].responses = responses;
                } else {
                    allResponses.push(localData);
                }
                await cacheService.set(allCacheKey, allResponses);
            }

            // 3. Queue synchronization task in the background
            await syncService.enqueue('SAVE_MILESTONE', {
                childId,
                ageMonths,
                category,
                responses
            });

            return localData;
        } catch (error) {
            console.error('Error in offline-first saveMilestoneResponses:', error);
            throw error;
        }
    },

    // Get milestone responses for a specific child, age, and category
    getMilestoneResponses: async (childId, ageMonths, category, forceRefresh = false) => {
        try {
            // Skip server fetch for offline-only children (temp IDs)
            if (childId && childId.startsWith('temp_')) {
                console.log(`[milestoneService] Skipping server fetch for temp child: ${childId}`);
                const cached = await cacheService.get(`milestones_${childId}_${ageMonths}_${category}`);
                return cached || null;
            }
            const headers = await getHeaders();
            const cacheKey = `milestones_${childId}_${ageMonths}_${category}`;

            const result = await cacheService.fetchWithCache(
                cacheKey,
                async () => {
                    const response = await resilientFetch(
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

            // Safe parsing of responses if returned as string
            if (result.data) {
                if (typeof result.data.responses === 'string') {
                    try {
                        result.data.responses = JSON.parse(result.data.responses);
                    } catch (e) {
                        console.error('[milestoneService] Error parsing responses string:', e);
                        result.data.responses = {};
                    }
                }
            }

            // Apply pending sync tasks on top of the result
            try {
                const queue = await syncService.getQueue();
                const pendingSave = queue.find(t => 
                    t.type === 'SAVE_MILESTONE' &&
                    t.payload.childId === childId &&
                    Number(t.payload.ageMonths) === Number(ageMonths) &&
                    t.payload.category === category
                );
                if (pendingSave) {
                    console.log(`[milestoneService] Merging pending SAVE_MILESTONE responses from sync queue for category: ${category}`);
                    if (!result.data) {
                        result.data = {
                            child_id: childId,
                            age_months: ageMonths,
                            category,
                            responses: {}
                        };
                    }
                    result.data.responses = {
                        ...result.data.responses,
                        ...pendingSave.payload.responses
                    };
                }
            } catch (err) {
                console.error('[milestoneService] Error merging pending responses:', err);
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
            // Skip server fetch for offline-only children (temp IDs)
            if (childId && childId.startsWith('temp_')) {
                console.log(`[milestoneService] Skipping server fetch for temp child: ${childId}`);
                const cached = await cacheService.get(`milestones_${childId}_all`);
                return cached || [];
            }
            const headers = await getHeaders();
            const cacheKey = `milestones_${childId}_all`;

            const result = await cacheService.fetchWithCache(
                cacheKey,
                async () => {
                    const response = await resilientFetch(`${API_URL}/milestones/${childId}/all`, {
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

            // Safe parsing of responses in array
            if (Array.isArray(result.data)) {
                result.data = result.data.map(row => {
                    if (row && typeof row.responses === 'string') {
                        try {
                            row.responses = JSON.parse(row.responses);
                        } catch (e) {
                            console.error('[milestoneService] Error parsing row responses string:', e);
                            row.responses = {};
                        }
                    }
                    return row;
                });
            }

            // Apply all pending SAVE_MILESTONE tasks for this child from sync queue on top of result data
            try {
                const queue = await syncService.getQueue();
                const childPendingSaves = queue.filter(t => 
                    t.type === 'SAVE_MILESTONE' &&
                    t.payload.childId === childId
                );

                if (childPendingSaves.length > 0) {
                    console.log(`[milestoneService] Merging ${childPendingSaves.length} pending SAVE_MILESTONE task(s) from sync queue`);
                    if (!Array.isArray(result.data)) {
                        result.data = [];
                    }
                    childPendingSaves.forEach(task => {
                        const { ageMonths, category, responses } = task.payload;
                        const existingIndex = result.data.findIndex(row => 
                            row.category === category && Number(row.age_months) === Number(ageMonths)
                        );
                        if (existingIndex > -1) {
                            result.data[existingIndex].responses = {
                                ...result.data[existingIndex].responses,
                                ...responses
                            };
                        } else {
                            result.data.push({
                                child_id: childId,
                                age_months: ageMonths,
                                category,
                                responses
                            });
                        }
                    });
                }
            } catch (err) {
                console.error('[milestoneService] Error merging pending saves:', err);
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching all milestone responses:', error);
            throw error;
        }
    }
};

