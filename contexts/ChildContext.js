import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { childService } from '@/services/childService';
import asdService from '@/services/asdService';
import syncService from '@/services/syncService';
import { useAuth } from './AuthContext';

const ChildContext = createContext({});

export const useChild = () => useContext(ChildContext);

export const ChildProvider = ({ children }) => {
    const { user } = useAuth();
    const [childrenList, setChildrenList] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [asdScreenings, setAsdScreenings] = useState([]);
    const [asdLoading, setAsdLoading] = useState(false);

    // Guards to prevent double-submission (sync/duplicate fix)
    const isSavingAsd = useRef(false);
    const isAddingChild = useRef(false);

    // Subscribe to sync service to update temp IDs with real database UUIDs when background sync succeeds
    useEffect(() => {
        const unsubscribe = syncService.subscribe((event, data) => {
            if (event === 'CHILD_ID_RESOLVED') {
                const { tempId, realId } = data;
                console.log(`[ChildContext] Resolving temp ID ${tempId} to real ID ${realId} in state`);
                setChildrenList(prev => prev.map(c => c.id === tempId ? { ...c, id: realId } : c));
                setSelectedChild(prev => prev && prev.id === tempId ? { ...prev, id: realId } : prev);
            }
        });
        return unsubscribe;
    }, []);

    // Load children when user logs in
    useEffect(() => {
        if (user && user.emailVerified) {
            refreshChildren();
        } else {
            setChildrenList([]);
            setSelectedChild(null);
        }
    }, [user]);

    // Load selected child from storage on mount
    useEffect(() => {
        loadSelectedChild();
    }, [childrenList]);

    const loadSelectedChild = async () => {
        try {
            const storedChildId = await AsyncStorage.getItem('selectedChildId');
            if (storedChildId && childrenList.length > 0) {
                const child = childrenList.find(c => c.id === storedChildId);
                if (child) {
                    setSelectedChild(child);
                } else if (childrenList.length > 0) {
                    // Default to first child if stored one not found
                    selectChild(childrenList[0]);
                }
            } else if (childrenList.length > 0 && !selectedChild) {
                selectChild(childrenList[0]);
            }
        } catch (e) {
            console.error('Failed to load selected child', e);
        }
    };

    const selectChild = async (child) => {
        setSelectedChild(child);
        try {
            await AsyncStorage.setItem('selectedChildId', child.id);
            // Also refresh ASD screenings for the new child
            if (child?.id) {
                refreshAsdScreenings(child.id);
            }
        } catch (e) {
            console.error('Failed to save selected child', e);
        }
    };

    const refreshAsdScreenings = async (childId) => {
        if (!childId) return;
        setAsdLoading(true);
        try {
            const data = await asdService.getAsdScreeningsForChild(childId);
            setAsdScreenings(data);
            return data;
        } catch (err) {
            console.error('Error fetching ASD screenings:', err);
        } finally {
            setAsdLoading(false);
        }
    };

    const saveAsdScreening = async (childId, screeningData) => {
        // Prevent double-submission
        if (isSavingAsd.current) {
            console.log('[ChildContext] ASD save already in progress, skipping duplicate call');
            return;
        }
        isSavingAsd.current = true;
        setAsdLoading(true);
        try {
            const result = await asdService.saveAsdScreening(childId, screeningData);
            await refreshAsdScreenings(childId);
            return result;
        } catch (err) {
            console.error('Error saving ASD screening:', err);
            throw err;
        } finally {
            isSavingAsd.current = false;
            setAsdLoading(false);
        }
    };

    const refreshChildren = async (forceRefresh = false) => {
        setLoading(true);
        try {
            const data = await childService.getChildren(forceRefresh);
            console.log('[ChildContext] refreshChildren fetched:', data.length, 'children');
            if (forceRefresh) {
                console.log('[ChildContext] Full data:', JSON.stringify(data, null, 2));
            }
            setChildrenList(data);

            // If a child is currently selected, update its data from the new list
            if (selectedChild) {
                const updatedSelected = data.find(c => c.id === selectedChild.id);
                if (updatedSelected) {
                    console.log('[ChildContext] Updating selectedChild. New Reg Number:', updatedSelected.registration_number);
                    setSelectedChild(updatedSelected);
                } else {
                    console.log('[ChildContext] selectedChild NOT found in new list');
                }
            }

            setError(null);
        } catch (err) {
            console.error('Error fetching children:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addChild = async (childData) => {
        // Prevent double-submission (fixes duplicate child creation on network errors)
        if (isAddingChild.current) {
            console.log('[ChildContext] Child creation already in progress, skipping duplicate call');
            return;
        }
        isAddingChild.current = true;
        setLoading(true);
        try {
            // Check for potential duplicates if registration number is provided
            if (childData.registrationNumber) {
                const isDuplicate = childrenList.some(
                    child => (child.registrationNumber || child.registration_number) === childData.registrationNumber
                );
                if (isDuplicate) {
                    throw new Error('This child record is already linked to your account.');
                }
            }

            // Also check for name + DOB duplicates to prevent accidental re-creation
            const nameMatch = childrenList.some(
                child => child.first_name?.toLowerCase() === childData.firstName?.toLowerCase()
                    && child.last_name?.toLowerCase() === childData.lastName?.toLowerCase()
                    && child.date_of_birth === childData.dateOfBirth
            );
            if (nameMatch) {
                throw new Error('A child with the same name and date of birth already exists.');
            }

            const newChild = await childService.addChild(childData);
            setChildrenList(prev => [newChild, ...prev]);
            // Automatically select the new child
            selectChild(newChild);
            return newChild;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            isAddingChild.current = false;
            setLoading(false);
        }
    };

    const updateChild = async (id, childData) => {
        setLoading(true);
        try {
            const updatedChild = await childService.updateChild(id, childData);
            setChildrenList(prev => prev.map(child => child.id === id ? updatedChild : child));
            if (selectedChild?.id === id) {
                setSelectedChild(updatedChild);
            }
            return updatedChild;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteChild = async (id) => {
        setLoading(true);
        try {
            await childService.deleteChild(id);
            setChildrenList(prev => prev.filter(child => child.id !== id));
            if (selectedChild?.id === id) {
                setSelectedChild(null);
                await AsyncStorage.removeItem('selectedChildId');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <ChildContext.Provider
            value={{
                children: childrenList,
                selectedChild,
                loading,
                error,
                addChild,
                updateChild,
                deleteChild,
                selectChild,
                refreshChildren,
                asdScreenings,
                asdLoading,
                refreshAsdScreenings,
                saveAsdScreening
            }}
        >
            {children}
        </ChildContext.Provider>
    );
};
