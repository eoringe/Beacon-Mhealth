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

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: '42471785456-fh7oic285gea6fv498sf5jf44q6fm84l.apps.googleusercontent.com',
});

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
            console.log('AuthContext: Logged in user:', userCredential.user.displayName);

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

    const loginWithGoogle = async () => {
        try {
            setLoading(true);
            console.log('AuthContext: loginWithGoogle started');

            // Check if device has Google Play Services
            console.log('AuthContext: Checking Play Services...');
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            console.log('AuthContext: Play Services available');

            // Get the ID token
            console.log('AuthContext: Calling GoogleSignin.signIn()...');
            const signInResult = await GoogleSignin.signIn();
            console.log('AuthContext: Sign-In Result:', JSON.stringify(signInResult, null, 2));
            const idToken = signInResult.data ? signInResult.data.idToken : signInResult.idToken;
            console.log('AuthContext: Extracted idToken:', idToken ? 'Token exists' : 'Token is MISSING');

            if (!idToken) {
                throw new Error('No ID token found in Google Sign-In response');
            }

            // Create a Google credential with the token
            const googleCredential = GoogleAuthProvider.credential(idToken);
            console.log('AuthContext: Firebase credential created');

            // Sign-in the user with the credential
            console.log('AuthContext: Signing in to Firebase...');
            const userCredential = await signInWithCredential(auth, googleCredential);
            console.log('AuthContext: Firebase Sign-In successful');

            // Get Firebase token and register in backend
            const token = await userCredential.user.getIdToken();
            await authService.storeToken(token);

            // Background registration (fire-and-forget)
            authService.registerUser(userCredential.user).catch(err =>
                console.error('Background registration failed:', err)
            );

            return { success: true, user: userCredential.user };

        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                throw new Error('Sign in cancelled');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                throw new Error('Sign in in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                throw new Error('Play services not available');
            } else {
                console.error('Google Sign-In Error:', error);
                throw new Error(error.message || 'Google Sign-In failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            // 1. Firebase SignOut
            await signOut(auth);

            // 2. Google SignOut & Revoke
            try {
                console.log('AuthContext: Attempting Google cleanup...');

                // Force revoke access - this ensures the "Choose Account" prompt appears next time
                try {
                    await GoogleSignin.revokeAccess();
                    console.log('AuthContext: Google access revoked');
                } catch (revokeError) {
                    // It's okay if this fails (e.g. not signed in)
                    console.log('AuthContext: Revoke skipped (likely not signed in)');
                }

                // Force sign out
                try {
                    await GoogleSignin.signOut();
                    console.log('AuthContext: Google session cleared');
                } catch (signOutError) {
                    // It's okay if this fails
                    console.log('AuthContext: Google signOut skipped');
                }
            } catch (googleError) {
                console.log('AuthContext: Google cleanup warning:', googleError.message);
            }

            // 3. Clear App State
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
        loginWithGoogle,
        logout,
        resendVerificationEmail
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
