import cacheService from './cacheService';
import authService, { API_URL } from './authService';
import syncService from './syncService';

class GrowthService {
    // Get auth token (delegates to authService for auto-refresh)
    async getToken() {
        return authService.getToken();
    }

    // Add a new growth measurement using offline-first caching and sync queue
    async addMeasurement(childId, measurementData) {
        try {
            console.log(`[GrowthService] Offline-first add: childId=${childId}, date=${measurementData.date}`);
            const cacheKey = `growth_${childId}`;
            let measurements = await cacheService.get(cacheKey) || [];
            const dateStr = measurementData.date;
            const existingIndex = measurements.findIndex(m => m.recorded_date === dateStr);
            
            let localItem;
            if (existingIndex > -1) {
                // Update existing local record
                localItem = {
                    ...measurements[existingIndex],
                    weight: measurementData.weight,
                    height: measurementData.height,
                    head_circumference: measurementData.headCircumference,
                    notes: measurementData.notes || null,
                    updated_at: new Date().toISOString()
                };
                measurements[existingIndex] = localItem;
            } else {
                // Create new local record with a temp ID
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                localItem = {
                    id: tempId,
                    child_id: childId,
                    recorded_date: dateStr,
                    weight: measurementData.weight,
                    height: measurementData.height,
                    head_circumference: measurementData.headCircumference,
                    notes: measurementData.notes || null,
                    created_at: new Date().toISOString()
                };
                measurements.push(localItem);
            }
            
            // Save to local cache immediately so it renders on chart instantly
            await cacheService.set(cacheKey, measurements);

            // Queue background sync task
            await syncService.enqueue('ADD_GROWTH', {
                tempId: localItem.id,
                childId,
                date: measurementData.date,
                weight: measurementData.weight,
                height: measurementData.height,
                headCircumference: measurementData.headCircumference
            });

            return localItem;
        } catch (error) {
            console.error('Error in offline-first addMeasurement:', error);
            throw error;
        }
    }

    // Get all growth measurements for a child
    async getMeasurements(childId, forceRefresh = false) {
        try {
            // Skip server fetch for offline-only children (temp IDs)
            if (childId && childId.startsWith('temp_')) {
                console.log(`[GrowthService] Skipping server fetch for temp child: ${childId}`);
                const cached = await cacheService.get(`growth_${childId}`);
                return cached || [];
            }
            const token = await this.getToken();
            if (!token) throw new Error('No authentication token');

            const cacheKey = `growth_${childId}`;

            const result = await cacheService.fetchWithCache(
                cacheKey,
                async () => {
                    const response = await fetch(`${API_URL}/growth/${childId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        const text = await response.text();
                        console.error(`Fetch measurements failed: ${response.status} ${text}`);
                        throw new Error(`Failed to fetch measurements: ${response.status}`);
                    }

                    return await response.json();
                },
                { forceRefresh }
            );

            if (result.fromCache) {
                console.log(`[GrowthService] Loaded measurements from cache for child ${childId}`);
            }

            // Apply all pending ADD_GROWTH and DELETE_GROWTH tasks from sync queue on top of result data
            try {
                const queue = await syncService.getQueue();
                
                // Filter tasks for this child
                const childTasks = queue.filter(t => t.payload && t.payload.childId === childId);
                
                if (childTasks.length > 0) {
                    console.log(`[GrowthService] Merging ${childTasks.length} pending growth task(s) from sync queue`);
                    let measurements = Array.isArray(result.data) ? [...result.data] : [];
                    
                    childTasks.forEach(task => {
                        if (task.type === 'ADD_GROWTH') {
                            const { tempId, date, weight, height, headCircumference } = task.payload;
                            const existingIndex = measurements.findIndex(m => m.recorded_date === date || m.id === tempId);
                            const localItem = {
                                id: tempId,
                                child_id: childId,
                                recorded_date: date,
                                weight: weight,
                                height: height,
                                head_circumference: headCircumference,
                                created_at: task.createdAt || new Date().toISOString()
                            };
                            if (existingIndex > -1) {
                                measurements[existingIndex] = {
                                    ...measurements[existingIndex],
                                    ...localItem
                                };
                            } else {
                                measurements.push(localItem);
                            }
                        } else if (task.type === 'DELETE_GROWTH') {
                            const { id } = task.payload;
                            measurements = measurements.filter(m => m.id !== id);
                        }
                    });
                    
                    // Sort by date ascending to match WHOChart expectation
                    measurements.sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
                    result.data = measurements;
                }
            } catch (err) {
                console.error('[GrowthService] Error merging pending tasks:', err);
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching measurements:', error);
            throw error;
        }
    }

    // Delete a growth measurement using offline-first caching and sync queue
    async deleteMeasurement(id, childId) {
        try {
            console.log(`[GrowthService] Offline-first delete: id=${id}, childId=${childId}`);
            
            if (childId) {
                const cacheKey = `growth_${childId}`;
                let measurements = await cacheService.get(cacheKey) || [];
                measurements = measurements.filter(m => m.id !== id);
                await cacheService.set(cacheKey, measurements);
            }

            // Queue background sync task
            await syncService.enqueue('DELETE_GROWTH', { id, childId });

            return { success: true, message: 'Measurement deleted successfully (offline)' };
        } catch (error) {
            console.error('Error in offline-first deleteMeasurement:', error);
            throw error;
        }
    }
}

export default new GrowthService();

