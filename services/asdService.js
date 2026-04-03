import { API_URL } from '@/config/api';
import authService from './authService';

const asdService = {
  /**
   * Save ASD screening result for a child
   */
  saveAsdScreening: async (childId, screeningData) => {
    try {
      const token = await authService.getToken();
      
      const response = await fetch(`${API_URL}/asd/${childId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(screeningData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save ASD screening');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving ASD screening:', error);
      throw error;
    }
  },

  /**
   * Get all ASD screenings for a child
   */
  getAsdScreeningsForChild: async (childId) => {
    try {
      const token = await authService.getToken();
      
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
    } catch (error) {
      console.error('Error fetching ASD screenings:', error);
      throw error;
    }
  }
};

export default asdService;
