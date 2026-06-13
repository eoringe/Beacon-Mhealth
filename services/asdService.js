import { API_URL } from '@/config/api';
import authService from './authService';
import cacheService from './cacheService';
import syncService from './syncService';

const asdService = {
  /**
   * Save ASD screening result for a child using offline-first caching and sync queue
   */
  saveAsdScreening: async (childId, screeningData) => {
    try {
      console.log(`[AsdService] Offline-first save: childId=${childId}`);
      const cacheKey = `asd_${childId}`;
      let screenings = await cacheService.get(cacheKey) || [];
      const todayStr = new Date().toISOString().split('T')[0];
      const existingIndex = screenings.findIndex(s => s.created_at && s.created_at.startsWith(todayStr));
      
      let localItem;
      if (existingIndex > -1) {
        localItem = {
          ...screenings[existingIndex],
          responses: screeningData.responses,
          score: screeningData.score,
          risk_level: screeningData.riskLevel,
          updated_at: new Date().toISOString()
        };
        screenings[existingIndex] = localItem;
      } else {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        localItem = {
          id: tempId,
          child_id: childId,
          responses: screeningData.responses,
          score: screeningData.score,
          risk_level: screeningData.riskLevel,
          created_at: new Date().toISOString()
        };
        screenings.push(localItem);
      }
      
      // Save locally first
      await cacheService.set(cacheKey, screenings);

      // Queue background sync task
      await syncService.enqueue('SAVE_ASD', {
        tempId: localItem.id,
        childId,
        responses: screeningData.responses,
        score: screeningData.score,
        riskLevel: screeningData.riskLevel
      });

      return localItem;
    } catch (error) {
      console.error('Error in offline-first saveAsdScreening:', error);
      throw error;
    }
  },

  /**
   * Get all ASD screenings for a child using local cache fallback
   */
  getAsdScreeningsForChild: async (childId, forceRefresh = false) => {
    try {
      // Skip server fetch for offline-only children (temp IDs)
      if (childId && childId.startsWith('temp_')) {
        console.log(`[asdService] Skipping server fetch for temp child: ${childId}`);
        const cached = await cacheService.get(`asd_${childId}`);
        return cached || [];
      }
      const token = await authService.getToken();
      if (!token) throw new Error('No authentication token');
      
      const cacheKey = `asd_${childId}`;

      const result = await cacheService.fetchWithCache(
        cacheKey,
        async () => {
          const response = await fetch(`${API_URL}/asd/${childId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch ASD screenings');
          }

          return await response.json();
        },
        { forceRefresh }
      );

      // Safe parsing of responses in array
      if (Array.isArray(result.data)) {
        result.data = result.data.map(row => {
          if (row && typeof row.responses === 'string') {
            try {
              row.responses = JSON.parse(row.responses);
            } catch (e) {
              console.error('[asdService] Error parsing row responses string:', e);
              row.responses = {};
            }
          }
          return row;
        });
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching ASD screenings:', error);
      throw error;
    }
  }
};

export default asdService;
