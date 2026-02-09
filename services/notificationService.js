import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = '@beacon_notifications';

const notificationService = {
    async getNotifications() {
        try {
            const jsonValue = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to load notifications', e);
            return [];
        }
    },

    async addNotification(notification) {
        try {
            const existing = await this.getNotifications();
            const newNotification = {
                id: Date.now().toString(),
                time: new Date().toISOString(), // store ISO string for consistency
                isRead: false,
                ...notification,
            };
            const updated = [newNotification, ...existing];
            await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
            return newNotification;
        } catch (e) {
            console.error('Failed to add notification', e);
            throw e;
        }
    },

    async markAsRead(id) {
        try {
            const existing = await this.getNotifications();
            const updated = existing.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            );
            await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.error('Failed to mark notification as read', e);
            throw e;
        }
    },

    async markAllAsRead() {
        try {
            const existing = await this.getNotifications();
            const updated = existing.map(n => ({ ...n, isRead: true }));
            await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.error('Failed to mark all as read', e);
            throw e;
        }
    },

    async deleteNotification(id) {
        try {
            const existing = await this.getNotifications();
            const updated = existing.filter(n => n.id !== id);
            await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.error('Failed to delete notification', e);
            throw e;
        }
    },

    async clearAll() {
        try {
            await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
            return [];
        } catch (e) {
            console.error('Failed to clear notifications', e);
            throw e;
        }
    }
};

export default notificationService;
