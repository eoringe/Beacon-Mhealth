import React, { createContext, useContext, useState, useCallback } from 'react';
import { CustomAlert } from '@/components/CustomAlert';

const AlertContext = createContext({
    showAlert: () => { },
    hideAlert: () => { },
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alertState, setAlertState] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        buttons: [],
    });

    const showAlert = useCallback((title, message, buttons = [], type = 'info') => {
        // Map native Alert buttons to our format if needed, or handle custom ones
        // Native: [{ text: 'Cancel', onPress: ..., style: 'cancel' }]
        // Our component expects basically the same

        // If buttons is empty but we want a default OK, we handle that in component
        // But for clarity let's just pass what we get.

        // Wrap onPress to close alert
        const wrappedButtons = buttons.map(btn => ({
            ...btn,
            onPress: () => {
                setAlertState(prev => ({ ...prev, visible: false }));
                if (btn.onPress) btn.onPress();
            }
        }));

        // If no buttons provided, provide a default OK that closes it
        const finalButtons = wrappedButtons.length > 0 ? wrappedButtons : [
            {
                text: 'OK',
                onPress: () => setAlertState(prev => ({ ...prev, visible: false })),
            }
        ];

        setAlertState({
            visible: true,
            title,
            message,
            type, // 'success' | 'error' | 'warning' | 'info'
            buttons: finalButtons,
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertState(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={alertState.visible}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                buttons={alertState.buttons}
                onClose={hideAlert}
            />
        </AlertContext.Provider>
    );
};
