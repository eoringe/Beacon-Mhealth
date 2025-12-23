import { API_URL } from './authService';
import { getAuth } from 'firebase/auth';

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
            return data;
        } catch (error) {
            console.error('Error saving milestone responses:', error);
            throw error;
        }
    },

    // Get milestone responses for a specific child, age, and category
    getMilestoneResponses: async (childId, ageMonths, category) => {
        try {
            const headers = await getHeaders();
            const response = await fetch(
                `${API_URL}/milestones/${childId}?ageMonths=${ageMonths}&category=${category}`,
                { headers }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch milestone responses');
            }
            return data;
        } catch (error) {
            console.error('Error fetching milestone responses:', error);
            throw error;
        }
    },

    // Get all milestone responses for a child
    getAllMilestoneResponsesForChild: async (childId) => {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_URL}/milestones/${childId}/all`, {
                headers
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch all milestone responses');
            }
            return data;
        } catch (error) {
            console.error('Error fetching all milestone responses:', error);
            throw error;
        }
    }
};
