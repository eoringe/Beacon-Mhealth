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
            return data;
        } catch (error) {
            throw error;
        }
    },

    getChildren: async () => {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_URL}/children`, {
                headers
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch children');
            }
            return data;
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
            return data;
        } catch (error) {
            throw error;
        }
    }
};
