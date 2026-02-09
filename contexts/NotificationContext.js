import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '@/services/notificationService';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshNotifications = async () => {
        const data = await notificationService.getNotifications();
        // Sort by time descending if needed, but adding to front handles it mostly
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
    };

    useEffect(() => {
        refreshNotifications();
    }, []);

    const addNotification = async (notificationData) => {
        try {
            await notificationService.addNotification(notificationData);
            await refreshNotifications();
        } catch (error) {
            console.error('Add notification failed', error);
        }
    };

    const markRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            await refreshNotifications();
        } catch (error) {
            console.error('Mark read failed', error);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            await refreshNotifications();
        } catch (error) {
            console.error('Mark all read failed', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await notificationService.deleteNotification(id);
            await refreshNotifications();
        } catch (error) {
            console.error('Delete notification failed', error);
        }
    };

    const clearAll = async () => {
        try {
            await notificationService.clearAll();
            await refreshNotifications();
        } catch (error) {
            console.error('Clear all notifications failed', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markRead,
            markAllRead,
            deleteNotification,
            clearAll,
            refreshNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
