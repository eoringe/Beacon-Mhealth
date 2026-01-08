/**
 * Mock for @react-native-google-signin/google-signin
 * Used when running in Expo Go where native modules are not available
 */

export const GoogleSignin = {
    configure: () => {
        console.log('[Mock] GoogleSignin.configure called');
    },
    hasPlayServices: async () => {
        console.log('[Mock] GoogleSignin.hasPlayServices called');
        return true;
    },
    signIn: async () => {
        throw new Error('Google Sign-In is not available in Expo Go. Please use email/password login.');
    },
    signOut: async () => {
        console.log('[Mock] GoogleSignin.signOut called');
    },
    revokeAccess: async () => {
        console.log('[Mock] GoogleSignin.revokeAccess called');
    },
    isSignedIn: async () => false,
    getCurrentUser: async () => null,
};

export const statusCodes = {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

export default {
    GoogleSignin,
    statusCodes,
};
