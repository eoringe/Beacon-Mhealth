import React, { createContext, useContext, useState } from 'react';

const DrawerContext = createContext({
    drawerVisible: false,
    openDrawer: () => { },
    closeDrawer: () => { },
});

export function DrawerProvider({ children }) {
    const [drawerVisible, setDrawerVisible] = useState(false);

    return (
        <DrawerContext.Provider value={{
            drawerVisible,
            openDrawer: () => setDrawerVisible(true),
            closeDrawer: () => setDrawerVisible(false),
        }}>
            {children}
        </DrawerContext.Provider>
    );
}

export function useDrawer() {
    return useContext(DrawerContext);
}
