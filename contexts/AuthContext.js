import React, { createContext, useState, useContext, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import authService from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // 1. Get and store token immediately so API calls work
                    const token = await firebaseUser.getIdToken();
                    await authService.storeToken(token);

                    // 2. Set user to unblock UI immediately
                    setUser(firebaseUser);

                    // 3. Sync with backend in background (fire-and-forget)
                    authService.registerUser(firebaseUser).catch(error => {
                        console.error('Background sync error:', error);
                    });
                } catch (error) {
                    console.error('Error in auth state change:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
                await authService.logout();
            }

            if (initializing) {
                setInitializing(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email, password, displayName) => {
        try {
            setLoading(true);

            // Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Send email verification
            await sendEmailVerification(userCredential.user);

            // Sign out user until email is verified
            await signOut(auth);

            return {
                success: true,
                message: 'Account created! Please check your email to verify your account before logging in.',
                requiresEmailVerification: true
            };
        } catch (error) {
            console.error('Signup error:', error);
            let message = 'An error occurred during signup';

            if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already registered';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password is too weak';
            }

            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setLoading(true);
            console.log('AuthContext: Starting login for', email);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('AuthContext: Firebase login successful');

            // ENFORCE EMAIL VERIFICATION - Block login if email not verified
            if (!userCredential.user.emailVerified) {
                console.log('AuthContext: Email not verified');
                // Return specific status so UI can handle resend
                return {
                    success: false,
                    requiresVerification: true,
                    user: userCredential.user
                };
            }

            // Get Firebase token and register in backend
            console.log('AuthContext: Getting token and registering in backend...');
            const token = await userCredential.user.getIdToken();
            await authService.storeToken(token);

            // Background registration (fire-and-forget)
            authService.registerUser(userCredential.user).catch(err =>
                console.error('Background registration failed:', err)
            );

            console.log('AuthContext: Login successful, proceeding...');

            return {
                success: true,
                user: userCredential.user
            };
        } catch (error) {
            console.error('Login error:', error);
            let message = error.message || 'An error occurred during login';

            if (error.code === 'auth/user-not-found') {
                message = 'No account found with this email';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Incorrect password';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address';
            } else if (error.code === 'auth/user-disabled') {
                message = 'This account has been disabled';
            } else if (error.code === 'auth/invalid-credential') {
                message = 'Invalid email or password';
            }

            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const resendVerificationEmail = async () => {
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                return { success: true, message: 'Verification email sent!' };
            }
            throw new Error('No user logged in');
        } catch (error) {
            console.error('Resend verification error:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        initializing,
        signup,
        login,
        logout,
        resendVerificationEmail
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
