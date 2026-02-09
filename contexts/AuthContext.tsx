import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential,
    sendPasswordResetEmail,
    updatePassword,
    updateProfile,
    User,
    UserCredential
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import authService from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cacheService from '@/services/cacheService';

// Use native Google Sign-In module (available in development and production builds)
let GoogleSignin: any;
let statusCodes: any;

try {
    const GoogleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = GoogleSigninModule.GoogleSignin;
    statusCodes = GoogleSigninModule.statusCodes;
} catch (e) {
    console.log('Google Signin module not available (running in Expo Go?)');
    // Mock to prevent crash
    GoogleSignin = {
        configure: () => { },
        hasPlayServices: () => Promise.resolve(true),
        signIn: () => Promise.reject({ message: 'Google Sign-In not supported in Expo Go' }),
        signOut: () => Promise.resolve(),
        revokeAccess: () => Promise.resolve(),
        getTokens: () => Promise.resolve({ idToken: 'mock-token', accessToken: 'mock-access-token' }),
    };
    statusCodes = {
        SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
        IN_PROGRESS: 'IN_PROGRESS',
        PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    initializing: boolean;
    signup: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; message: string; requiresEmailVerification?: boolean }>;
    login: (email: string, password: string) => Promise<{ success: boolean; user?: User; requiresVerification?: boolean }>;
    loginWithGoogle: () => Promise<{ success: boolean; user: User }>;
    logout: () => Promise<void>;
    resendVerificationEmail: () => Promise<{ success: boolean; message: string }>;
    forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
    changePassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
    deleteAccount: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [initializing, setInitializing] = useState<boolean>(true);

    // Derived loading state
    const loading = authLoading || actionLoading;

    // Configure Google Sign-In on mount
    useEffect(() => {
        if (GoogleSignin && GoogleSignin.configure) {
            GoogleSignin.configure({
                webClientId: '42471785456-fh7oic285gea6fv498sf5jf44q6fm84l.apps.googleusercontent.com',
                offlineAccess: true,
            });
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // 1. Get and store token immediately so API calls work
                    const token = await firebaseUser.getIdToken();
                    await authService.storeToken(token);

                    // 2. Fetch full profile from backend to get phone number etc.
                    let backendUser = null;
                    try {
                        const profileData = await authService.getProfile();
                        backendUser = profileData.user;
                        console.log('Fetched backend profile:', backendUser);
                    } catch (e) {
                        console.log('Failed to fetch backend profile, using firebase only', e);
                    }

                    // 3. Merge Firebase user with Backend data
                    const mergedUser = {
                        ...firebaseUser,
                        // Prefer backend data if available, fallback to firebase
                        displayName: backendUser?.display_name || firebaseUser.displayName,
                        photoURL: backendUser?.photo_url || firebaseUser.photoURL,
                        phoneNumber: backendUser?.phone_number || firebaseUser.phoneNumber,
                        // Add custom fields
                        dbId: backendUser?.id,
                        firstName: backendUser?.first_name,
                        lastName: backendUser?.last_name
                    };

                    setUser(mergedUser as User);

                    // 4. Background sync (optional now since we just fetched)
                    if (!backendUser) {
                        authService.registerUser(firebaseUser).catch(error => {
                            console.error('Background sync error:', error);
                        });
                    }
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
            setAuthLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email: string, password: string, displayName?: string) => {
        try {
            setActionLoading(true);

            // Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update Profile with Display Name
            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
                // Force reload user to update local state if needed (though usually not needed immediately before signOut)
            }

            // Send email verification
            await sendEmailVerification(userCredential.user);

            // Sign out user until email is verified
            await signOut(auth);

            return {
                success: true,
                message: 'Account created! Please check your email to verify your account before logging in.',
                requiresEmailVerification: true
            };
        } catch (error: any) {
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
            setActionLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setActionLoading(true);
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
        } catch (error: any) {
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
            setActionLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        try {
            setActionLoading(true);
            console.log('AuthContext: loginWithGoogle started');

            // Check if Google Sign-In is mocked (Expo Go)
            const isExpoGo = !GoogleSignin.getTokens; // Simplified check or just rely on the mock behavior
            if (isExpoGo && !GoogleSignin.getTokens) { // Trying to detect our mock
                // Actually the mock signIn returns a rejected promise so the catch block handles it
            }

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

        } catch (error: any) {
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
            setActionLoading(false);
        }
    };

    const logout = async () => {
        try {
            // 1. Firebase SignOut
            await signOut(auth);

            // 2. Google SignOut & Revoke (only if Google Sign-In is available)
            if (GoogleSignin) {
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
                } catch (googleError: any) {
                    console.log('AuthContext: Google cleanup warning:', googleError.message);
                }
            } else {
                console.log('AuthContext: Google Sign-In not available, skipping cleanup');
            }

            // 3. Clear all cached data
            await cacheService.clearAll();
            console.log('AuthContext: Cache cleared');

            // 4. Clear App State
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

    const forgotPassword = async (email: string) => {
        try {
            setActionLoading(true);
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: 'Password reset email sent!' };
        } catch (error: any) {
            console.error('Forgot password error:', error);
            let message = 'Failed to send reset email';
            if (error.code === 'auth/user-not-found') message = 'No account found with this email';
            if (error.code === 'auth/invalid-email') message = 'Invalid email address';
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const changePassword = async (newPassword: string) => {
        try {
            setActionLoading(true);
            if (!auth.currentUser) throw new Error('No user logged in');

            await updatePassword(auth.currentUser, newPassword);
            return { success: true, message: 'Password updated successfully' };
        } catch (error: any) {
            console.error('Change password error:', error);
            let message = 'Failed to update password';
            if (error.code === 'auth/requires-recent-login') {
                message = 'For security, please log out and log back in before changing your password.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password is too weak';
            }
            throw new Error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const deleteAccount = async () => {
        try {
            setActionLoading(true);
            if (!auth.currentUser) throw new Error('No user logged in');

            await authService.deleteAccount();

            // Clean up Google Sign-In if needed
            if (GoogleSignin) {
                try {
                    await GoogleSignin.revokeAccess();
                    await GoogleSignin.signOut();
                } catch (e) {
                    console.log('Google cleanup failed during delete:', e);
                }
            }

            await cacheService.clearAll();
            setUser(null);

            return { success: true, message: 'Account deleted successfully' };
        } catch (error: any) {
            console.error('Delete account error:', error);
            throw new Error(error.message || 'Failed to delete account');
        } finally {
            setActionLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        initializing,
        signup,
        login,
        loginWithGoogle,
        logout,
        resendVerificationEmail,
        forgotPassword,
        changePassword,
        deleteAccount
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
