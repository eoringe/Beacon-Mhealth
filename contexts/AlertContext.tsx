import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CustomAlert } from '@/components/CustomAlert';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    buttons: AlertButton[];
}

interface AlertContextType {
    showAlert: (title: string, message: string, buttons?: AlertButton[], type?: AlertType) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
    showAlert: () => { },
    hideAlert: () => { },
});

export const useAlert = () => useContext(AlertContext);

interface AlertProviderProps {
    children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
    const [alertState, setAlertState] = useState<AlertState>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        buttons: [],
    });

    const showAlert = useCallback((title: string, message: string, buttons: AlertButton[] = [], type: AlertType = 'info') => {
        // Wrap onPress to close alert
        const wrappedButtons: AlertButton[] = buttons.map(btn => ({
            ...btn,
            onPress: () => {
                setAlertState(prev => ({ ...prev, visible: false }));
                if (btn.onPress) btn.onPress();
            }
        }));

        // If no buttons provided, provide a default OK that closes it
        const finalButtons: AlertButton[] = wrappedButtons.length > 0 ? wrappedButtons : [
            {
                text: 'OK',
                onPress: () => setAlertState(prev => ({ ...prev, visible: false })),
            }
        ];

        setAlertState({
            visible: true,
            title,
            message,
            type,
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
