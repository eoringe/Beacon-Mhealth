/**
 * CacheService - Centralized offline-first caching utility
 * Uses AsyncStorage to cache API responses and reduce database queries
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'beacon_cache_';
const CACHE_META_PREFIX = 'beacon_meta_';

class CacheService {
    /**
     * Get cached data by key
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} - Cached data or null if not found
     */
    async get(key) {
        try {
            const data = await AsyncStorage.getItem(CACHE_PREFIX + key);
            if (!data) return null;
            return JSON.parse(data);
        } catch (error) {
            console.error('[CacheService] Error reading cache:', error);
            return null;
        }
    }

    /**
     * Store data in cache with timestamp metadata
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {string} [remoteTimestamp] - Optional server timestamp for sync tracking
     * @param {number} [ttl] - Optional time-to-live in milliseconds
     */
    async set(key, data, remoteTimestamp = null, ttl = null) {
        try {
            // Store the data
            await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));

            // Store metadata (timestamps for sync validation)
            const meta = {
                cachedAt: new Date().toISOString(),
                remoteTimestamp: remoteTimestamp || new Date().toISOString(),
                expirationTime: ttl ? new Date(Date.now() + ttl).toISOString() : null
            };
            await AsyncStorage.setItem(CACHE_META_PREFIX + key, JSON.stringify(meta));
        } catch (error) {
            console.error('[CacheService] Error writing cache:', error);
        }
    }

    /**
     * Get cache metadata (timestamps)
     * @param {string} key - Cache key
     * @returns {Promise<{cachedAt: string, remoteTimestamp: string}|null>}
     */
    async getMeta(key) {
        try {
            const meta = await AsyncStorage.getItem(CACHE_META_PREFIX + key);
            return meta ? JSON.parse(meta) : null;
        } catch (error) {
            console.error('[CacheService] Error reading cache meta:', error);
            return null;
        }
    }

    /**
     * Check if local cache is stale compared to remote timestamp or expired
     * @param {string} key - Cache key
     * @param {string} remoteTimestamp - Remote server's last update timestamp
     * @returns {Promise<boolean>} - True if cache is stale and needs refresh
     */
    async isStale(key, remoteTimestamp) {
        try {
            const meta = await this.getMeta(key);
            if (!meta) return true; // No cache = stale

            // Check expiration (TTL)
            if (meta.expirationTime) {
                const expirationTime = new Date(meta.expirationTime).getTime();
                if (Date.now() > expirationTime) {
                    console.log(`[CacheService] Cache expired for ${key}`);
                    return true;
                }
            }

            // Sync check (if remote timestamp provided)
            if (remoteTimestamp) {
                const localTime = new Date(meta.remoteTimestamp).getTime();
                const remoteTime = new Date(remoteTimestamp).getTime();
                return remoteTime > localTime;
            }

            return false;
        } catch (error) {
            console.error('[CacheService] Error checking staleness:', error);
            return true; // Assume stale on error
        }
    }

    /**
     * Invalidate (delete) a specific cache entry
     * @param {string} key - Cache key to invalidate
     */
    async invalidate(key) {
        try {
            await AsyncStorage.multiRemove([
                CACHE_PREFIX + key,
                CACHE_META_PREFIX + key
            ]);
            console.log(`[CacheService] Invalidated cache: ${key}`);
        } catch (error) {
            console.error('[CacheService] Error invalidating cache:', error);
        }
    }

    /**
     * Invalidate all caches matching a pattern
     * @param {string} pattern - Pattern to match (e.g., 'children' matches 'children_list', 'children_123')
     */
    async invalidatePattern(pattern) {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const matchingKeys = allKeys.filter(
                key => key.startsWith(CACHE_PREFIX + pattern) ||
                    key.startsWith(CACHE_META_PREFIX + pattern)
            );

            if (matchingKeys.length > 0) {
                await AsyncStorage.multiRemove(matchingKeys);
                console.log(`[CacheService] Invalidated ${matchingKeys.length} cache entries matching: ${pattern}`);
            }
        } catch (error) {
            console.error('[CacheService] Error invalidating pattern:', error);
        }
    }

    /**
     * Clear all cached data (useful for logout)
     */
    async clearAll() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(
                key => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_META_PREFIX)
            );

            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
                console.log(`[CacheService] Cleared ${cacheKeys.length} cache entries`);
            }
        } catch (error) {
            console.error('[CacheService] Error clearing cache:', error);
        }
    }

    /**
     * Get cache statistics (for debugging)
     * @returns {Promise<{count: number, keys: string[]}>}
     */
    async getStats() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
            return {
                count: cacheKeys.length,
                keys: cacheKeys.map(k => k.replace(CACHE_PREFIX, ''))
            };
        } catch (error) {
            console.error('[CacheService] Error getting stats:', error);
            return { count: 0, keys: [] };
        }
    }

    /**
     * Wrapper for fetch with cache-first strategy
     * @param {string} cacheKey - Key to cache under
     * @param {Function} fetchFn - Async function that returns fresh data
     * @param {Object} options - Options
     * @param {boolean} options.forceRefresh - Skip cache and fetch fresh
     * @param {string} options.remoteTimestamp - Server timestamp for staleness check
     * @param {number} options.ttl - Time to live in milliseconds
     * @returns {Promise<{data: any, fromCache: boolean}>}
     */
    async fetchWithCache(cacheKey, fetchFn, options = {}) {
        const { forceRefresh = false, remoteTimestamp = null, ttl = null } = options;

        // Check if we should use cache
        if (!forceRefresh) {
            // Check staleness (expiration or remote timestamp)
            const isStale = await this.isStale(cacheKey, remoteTimestamp);
            if (!isStale) {
                const cached = await this.get(cacheKey);
                if (cached) {
                    console.log(`📦 CACHE HIT: ${cacheKey} (loaded from local storage)`);
                    return { data: cached, fromCache: true };
                }
            }
        }

        // Fetch fresh data
        try {
            console.log(`🌐 API FETCH: ${cacheKey} (fetching from remote database...)`);
            const freshData = await fetchFn();
            await this.set(cacheKey, freshData, remoteTimestamp, ttl);
            console.log(`💾 CACHED: ${cacheKey} (saved to local storage)`);
            return { data: freshData, fromCache: false };
        } catch (error) {
            // On network error, try to return cached data as fallback (even if expired)
            const cached = await this.get(cacheKey);
            if (cached) {
                console.warn(`⚠️ NETWORK ERROR - FALLBACK: ${cacheKey} (using cached data)`);
                return { data: cached, fromCache: true };
            }
            throw error;
        }
    }
}

export default new CacheService();
