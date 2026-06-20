import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL, resilientFetch } from '@/config/api';
import authService from './authService';
import cacheService from './cacheService';

const QUEUE_KEY = 'beacon_sync_queue';

class SyncService {
    constructor() {
        this.isProcessing = false;
        this.unsubscribeNetInfo = null;
        this.syncInterval = null;
        this.listeners = [];
    }

    /**
     * Subscribe to synchronization events
     * @param {function} callback
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify subscribers of sync events
     * @param {string} event
     * @param {object} data
     */
    notify(event, data) {
        this.listeners.forEach(cb => {
            try {
                cb(event, data);
            } catch (err) {
                console.error('[SyncService] Subscriber error:', err);
            }
        });
    }

    /**
     * Start the sync service (listen to connectivity changes and start periodic check)
     */
    start() {
        if (this.unsubscribeNetInfo) return;

        // Monitor connection status
        this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
            if (state.isConnected && state.isInternetReachable !== false) {
                console.log('[SyncService] Network online. Triggering sync...');
                this.processQueue();
            }
        });

        // Periodic check to retry sync if server was down but network was online
        this.syncInterval = setInterval(() => {
            console.log('[SyncService] Periodic check: triggering sync run...');
            this.processQueue();
        }, 60000); // Check/retry every 60 seconds

        // Trigger an initial process run
        this.processQueue();
    }

    /**
     * Stop the sync service
     */
    stop() {
        if (this.unsubscribeNetInfo) {
            this.unsubscribeNetInfo();
            this.unsubscribeNetInfo = null;
        }
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Get the current queue
     */
    async getQueue() {
        try {
            const raw = await AsyncStorage.getItem(QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            console.error('[SyncService] Error reading queue:', error);
            return [];
        }
    }

    /**
     * Save queue to storage
     */
    async saveQueue(queue) {
        try {
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        } catch (error) {
            console.error('[SyncService] Error saving queue:', error);
        }
    }

    /**
     * Enqueue a new synchronization task
     * @param {string} type - Action type
     * @param {object} payload - Action arguments
     */
    async enqueue(type, payload) {
        const queue = await this.getQueue();
        const taskId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Optimize/fold task cancellations (e.g. if we add growth record then delete it, cancel both)
        if (type === 'DELETE_GROWTH') {
            const { id } = payload;
            const addIndex = queue.findIndex(t => t.type === 'ADD_GROWTH' && t.payload.tempId === id);
            if (addIndex > -1) {
                queue.splice(addIndex, 1);
                await this.saveQueue(queue);
                console.log(`[SyncService] Cancelled ADD_GROWTH and DELETE_GROWTH for tempId: ${id}`);
                return;
            }
        }

        // Deduplicate/fold SAVE_MILESTONE tasks to avoid queue flooding
        if (type === 'SAVE_MILESTONE') {
            const { childId, ageMonths, category, responses } = payload;
            const existingIndex = queue.findIndex(t => 
                t.type === 'SAVE_MILESTONE' &&
                t.payload.childId === childId &&
                Number(t.payload.ageMonths) === Number(ageMonths) &&
                t.payload.category === category
            );
            if (existingIndex > -1) {
                queue[existingIndex].payload.responses = responses;
                await this.saveQueue(queue);
                console.log(`[SyncService] Folded/Updated existing SAVE_MILESTONE task for ${category}`);
                return;
            }
        }

        // Deduplicate/fold SAVE_ASD tasks to avoid queue flooding
        if (type === 'SAVE_ASD') {
            const { childId } = payload;
            const existingIndex = queue.findIndex(t => 
                t.type === 'SAVE_ASD' &&
                t.payload.childId === childId
            );
            if (existingIndex > -1) {
                queue[existingIndex].payload = payload;
                await this.saveQueue(queue);
                console.log(`[SyncService] Folded/Updated existing SAVE_ASD task for child ${childId}`);
                return;
            }
        }

        queue.push({
            id: taskId,
            type,
            payload,
            attempts: 0,
            createdAt: new Date().toISOString()
        });

        await this.saveQueue(queue);
        console.log(`[SyncService] ✚ Enqueued task: ${type} (ID: ${taskId})`);
        console.log(`[SyncService]   Payload: ${JSON.stringify(payload).substring(0, 500)}`);

        // Trigger processing immediately in the background
        this.processQueue();
    }

    /**
     * Process all tasks in the queue sequentially
     */
    async processQueue() {
        if (this.isProcessing) return;

        // Check network connection first
        const netState = await NetInfo.fetch();
        if (!netState.isConnected || netState.isInternetReachable === false) {
            console.log('[SyncService] Offline. Skipping sync run.');
            return;
        }

        this.isProcessing = true;
        console.log('[SyncService] ═══════════════════════════════════════');
        console.log('[SyncService] Starting sync queue processing...');

        try {
            let queue = await this.getQueue();
            console.log(`[SyncService] Queue length: ${queue.length}`);
            queue.forEach((t, i) => console.log(`[SyncService]   [${i}] ${t.type} | attempts=${t.attempts} | id=${t.id} | payload_keys=${Object.keys(t.payload).join(',')}`));
            
            while (queue.length > 0) {
                const task = queue[0];
                console.log(`[SyncService] Processing task: ${task.type} (Attempts: ${task.attempts})`);

                let success = false;
                let clientError = false;
                let resultData = null;

                try {
                    const token = await authService.getToken();
                    console.log(`[SyncService] Auth token present: ${!!token}, length: ${token?.length || 0}`);
                    if (!token) throw new Error('No auth token available');

                    const headers = {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    };

                    // Execute the request directly to bypass circular service dependencies
                    switch (task.type) {
                        case 'SAVE_MILESTONE': {
                            const { childId, ageMonths, category, responses } = task.payload;
                            if (childId.startsWith('temp_')) {
                                console.log('[SyncService] Skipping SAVE_MILESTONE for offline-only child');
                                success = true;
                                break;
                            }
                            const res = await resilientFetch(`${API_URL}/milestones/${childId}`, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({ ageMonths, category, responses })
                            });
                            
                            if (res.status >= 400 && res.status < 500) {
                                clientError = true;
                                throw new Error(`Client error: ${res.status}`);
                            }
                            if (!res.ok) throw new Error(`Server status: ${res.status}`);
                            
                            resultData = await res.json();
                            success = true;
                            break;
                        }

                        case 'ADD_GROWTH': {
                            const { childId, date, weight, height, headCircumference } = task.payload;
                            if (childId.startsWith('temp_')) {
                                console.log('[SyncService] Skipping ADD_GROWTH for offline-only child');
                                success = true;
                                break;
                            }
                            const res = await resilientFetch(`${API_URL}/growth/${childId}`, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({ date, weight, height, headCircumference })
                            });

                            if (res.status >= 400 && res.status < 500) {
                                clientError = true;
                                throw new Error(`Client error: ${res.status}`);
                            }
                            if (!res.ok) throw new Error(`Server status: ${res.status}`);
                            
                            resultData = await res.json();
                            success = true;
                            break;
                        }

                        case 'DELETE_GROWTH': {
                            const { id } = task.payload;
                            if (id.startsWith('temp_')) {
                                console.log('[SyncService] Skipping DELETE_GROWTH for offline-only growth measurement');
                                success = true;
                                break;
                            }
                            const res = await resilientFetch(`${API_URL}/growth/${id}`, {
                                method: 'DELETE',
                                headers
                            });

                            if (res.status >= 400 && res.status < 500) {
                                clientError = true;
                                throw new Error(`Client error: ${res.status}`);
                            }
                            if (!res.ok) throw new Error(`Server status: ${res.status}`);
                            
                            success = true;
                            break;
                        }

                        case 'SAVE_ASD': {
                            const { childId, responses, score, riskLevel } = task.payload;
                            if (childId.startsWith('temp_')) {
                                console.log('[SyncService] Skipping SAVE_ASD for offline-only child');
                                success = true;
                                break;
                            }
                            const res = await resilientFetch(`${API_URL}/asd/${childId}`, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({ responses, score, riskLevel })
                            });

                            if (res.status >= 400 && res.status < 500) {
                                clientError = true;
                                throw new Error(`Client error: ${res.status}`);
                            }
                            if (!res.ok) throw new Error(`Server status: ${res.status}`);
                            
                            resultData = await res.json();
                            success = true;
                            break;
                        }

                        case 'ADD_CHILD': {
                            const { childData } = task.payload;
                            const addChildUrl = `${API_URL}/children`;
                            const addChildBody = JSON.stringify(childData);
                            console.log(`[SyncService][ADD_CHILD] ▶ URL: ${addChildUrl}`);
                            console.log(`[SyncService][ADD_CHILD] ▶ Payload: ${addChildBody}`);
                            console.log(`[SyncService][ADD_CHILD] ▶ TempId: ${task.payload.tempId}`);
                            console.log(`[SyncService][ADD_CHILD] ▶ Headers: ${JSON.stringify({ ...headers, Authorization: 'Bearer ***' })}`);

                            let res;
                            try {
                                res = await resilientFetch(addChildUrl, {
                                    method: 'POST',
                                    headers,
                                    body: addChildBody
                                });
                            } catch (fetchErr) {
                                console.error(`[SyncService][ADD_CHILD] ✖ resilientFetch threw:`, fetchErr?.message || fetchErr);
                                console.error(`[SyncService][ADD_CHILD] ✖ Error name: ${fetchErr?.name}`);
                                console.error(`[SyncService][ADD_CHILD] ✖ Error stack: ${fetchErr?.stack}`);
                                throw fetchErr;
                            }

                            console.log(`[SyncService][ADD_CHILD] ◀ Response status: ${res.status} ${res.statusText}`);

                            // Read raw body text first for logging
                            let rawBody = '';
                            try {
                                rawBody = await res.clone().text();
                                console.log(`[SyncService][ADD_CHILD] ◀ Raw response body: ${rawBody.substring(0, 500)}`);
                            } catch (bodyErr) {
                                console.warn(`[SyncService][ADD_CHILD] Could not read response body:`, bodyErr?.message);
                            }

                            if (res.status >= 400 && res.status < 500) {
                                clientError = true;
                                throw new Error(`Client error ${res.status}: ${rawBody.substring(0, 200)}`);
                            }
                            if (!res.ok) throw new Error(`Server error ${res.status}: ${rawBody.substring(0, 200)}`);

                            resultData = JSON.parse(rawBody);
                            console.log(`[SyncService][ADD_CHILD] ✔ Created child with server ID: ${resultData?.id}`);
                            success = true;
                            break;
                        }

                        case 'UPDATE_CHILD': {
                            const { id, childData } = task.payload;
                            if (id.startsWith('temp_')) {
                                console.log('[SyncService] Skipping UPDATE_CHILD for offline-only child');
                                success = true;
                                break;
                            }
                            const updateUrl = `${API_URL}/children/${id}`;
                            console.log(`[SyncService][UPDATE_CHILD] ▶ URL: ${updateUrl}`);
                            const res = await resilientFetch(updateUrl, {
                                method: 'PUT',
                                headers,
                                body: JSON.stringify(childData)
                            });

                            console.log(`[SyncService][UPDATE_CHILD] ◀ Status: ${res.status}`);
                            if (res.status >= 400 && res.status < 500) {
                                clientError = true;
                                const errBody = await res.text();
                                throw new Error(`Client error ${res.status}: ${errBody.substring(0, 200)}`);
                            }
                            if (!res.ok) throw new Error(`Server status: ${res.status}`);

                            resultData = await res.json();
                            success = true;
                            break;
                        }

                        case 'DELETE_CHILD': {
                            const { id } = task.payload;
                            if (id.startsWith('temp_')) {
                                console.log('[SyncService] Skipping DELETE_CHILD for offline-only child');
                                success = true;
                                break;
                            }
                            const deleteUrl = `${API_URL}/children/${id}`;
                            console.log(`[SyncService][DELETE_CHILD] ▶ URL: ${deleteUrl}`);
                            const res = await resilientFetch(deleteUrl, {
                                method: 'DELETE',
                                headers
                            });

                            console.log(`[SyncService][DELETE_CHILD] ◀ Status: ${res.status}`);
                            if (res.status >= 400 && res.status < 500) {
                                clientError = true;
                                throw new Error(`Client error: ${res.status}`);
                            }
                            if (!res.ok) throw new Error(`Server status: ${res.status}`);

                            success = true;
                            break;
                        }

                        default:
                            console.warn(`[SyncService] Unknown task type: ${task.type}`);
                            success = true; // Drop unknown tasks
                            break;
                    }
                } catch (taskError) {
                    console.log(`[SyncService] ✖ Task execution failed for ${task.type}:`, taskError?.message || taskError);
                    console.log(`[SyncService] ✖ Full task payload:`, JSON.stringify(task.payload));
                    console.log(`[SyncService] ✖ Error type: ${taskError?.name}, Stack: ${taskError?.stack?.substring(0, 300)}`);
                }

                if (success) {
                    console.log(`[SyncService] Task succeeded: ${task.type}`);
                    
                    // Resolve temp IDs to real IDs for pending tasks in queue if entity was created
                    if (task.type === 'ADD_GROWTH' && task.payload.tempId && resultData?.id) {
                        const tempId = task.payload.tempId;
                        const realId = resultData.id;
                        const childId = task.payload.childId;
                        
                        // Map temp ID to real ID in subsequent tasks
                        queue.forEach(t => {
                            if (t.type === 'DELETE_GROWTH' && t.payload.id === tempId) {
                                t.payload.id = realId;
                            }
                        });

                        // Update local growth cache
                        try {
                            const cacheKey = `growth_${childId}`;
                            const cached = await cacheService.get(cacheKey);
                            if (cached && Array.isArray(cached)) {
                                const updated = cached.map(m => m.id === tempId ? { ...m, id: realId } : m);
                                await cacheService.set(cacheKey, updated);
                            }
                        } catch (err) {
                            console.error('[SyncService] Error updating growth cache on ID resolution:', err);
                        }

                        // Notify listeners
                        this.notify('GROWTH_ID_RESOLVED', { childId, tempId, realId });
                    }

                    if (task.type === 'ADD_CHILD' && task.payload.tempId && resultData?.id) {
                        const tempId = task.payload.tempId;
                        const realId = resultData.id;

                        // Map child temp ID to real ID in all subsequent tasks
                        queue.forEach(t => {
                            if (t.payload && t.payload.childId === tempId) {
                                t.payload.childId = realId;
                            }
                            if (t.type === 'UPDATE_CHILD' && t.payload.id === tempId) {
                                t.payload.id = realId;
                            }
                            if (t.type === 'DELETE_CHILD' && t.payload.id === tempId) {
                                t.payload.id = realId;
                            }
                        });

                        // 1. Update children_list local cache
                        try {
                            const cachedList = await cacheService.get('children_list');
                            if (cachedList && Array.isArray(cachedList)) {
                                const updatedList = cachedList.map(c => c.id === tempId ? { ...c, id: realId } : c);
                                await cacheService.set('children_list', updatedList);
                            }
                        } catch (err) {
                            console.error('[SyncService] Error updating children_list cache on ID resolution:', err);
                        }

                        // 2. Update selectedChildId in AsyncStorage
                        try {
                            const selectedId = await AsyncStorage.getItem('selectedChildId');
                            if (selectedId === tempId) {
                                await AsyncStorage.setItem('selectedChildId', realId);
                            }
                        } catch (err) {
                            console.error('[SyncService] Error updating selectedChildId on ID resolution:', err);
                        }

                        // 3. Rename any offline-created caches with tempId to realId
                        const keysToRename = [
                            { oldKey: `growth_${tempId}`, newKey: `growth_${realId}` },
                            { oldKey: `asd_${tempId}`, newKey: `asd_${realId}` },
                            { oldKey: `milestones_${tempId}_all`, newKey: `milestones_${realId}_all` }
                        ];
                        for (const { oldKey, newKey } of keysToRename) {
                            try {
                                const val = await cacheService.get(oldKey);
                                if (val) {
                                    await cacheService.set(newKey, val);
                                    await cacheService.invalidate(oldKey);
                                }
                            } catch (err) {
                                console.error(`[SyncService] Error renaming cache from ${oldKey} to ${newKey}:`, err);
                            }
                        }

                        // 3b. Rename any AsyncStorage keys for child trackers (completed, skipped, and additional vaccines, sleep/feeding logs, and teething data)
                        const asyncStorageKeys = [
                            { oldKey: `completed_vaccines_${tempId}`, newKey: `completed_vaccines_${realId}` },
                            { oldKey: `skipped_vaccines_${tempId}`, newKey: `skipped_vaccines_${realId}` },
                            { oldKey: `additional_vaccines_${tempId}`, newKey: `additional_vaccines_${realId}` },
                            { oldKey: `sleep_logs_${tempId}`, newKey: `sleep_logs_${realId}` },
                            { oldKey: `feeding_logs_${tempId}`, newKey: `feeding_logs_${realId}` },
                            { oldKey: `teething_data_${tempId}`, newKey: `teething_data_${realId}` }
                        ];
                        for (const { oldKey, newKey } of asyncStorageKeys) {
                            try {
                                const val = await AsyncStorage.getItem(oldKey);
                                if (val) {
                                    await AsyncStorage.setItem(newKey, val);
                                    await AsyncStorage.removeItem(oldKey);
                                    console.log(`[SyncService] Renamed AsyncStorage key from ${oldKey} to ${newKey}`);
                                }
                            } catch (err) {
                                console.error(`[SyncService] Error renaming AsyncStorage key from ${oldKey} to ${newKey}:`, err);
                            }
                        }

                        // 4. Notify all subscribers (e.g. ChildContext)
                        this.notify('CHILD_ID_RESOLVED', { tempId, realId });
                    }

                    // Shift completed task
                    queue.shift();
                    await this.saveQueue(queue);
                } else if (clientError) {
                    // Corrupted or invalid request — drop to avoid blocking queue
                    console.warn(`[SyncService] Dropping corrupted client-error task: ${task.type}`);
                    queue.shift();
                    await this.saveQueue(queue);
                } else {
                    // Network/Server error — increment attempts and wait (stop processing queue for now).
                    // We DO NOT drop tasks on network/server errors to prevent permanent data loss.
                    task.attempts += 1;
                    await this.saveQueue(queue);
                    console.log(`[SyncService] Network/Server failure (Attempt ${task.attempts}). Halting queue processing to retry later.`);
                    break;
                }
            }
        } catch (queueError) {
            console.error('[SyncService] Queue processing error:', queueError);
        } finally {
            this.isProcessing = false;
            console.log('[SyncService] Sync queue processing completed.');
        }
    }
}

export default new SyncService();
