import { initializeApp } from 'firebase/app';
import {
    getAuth,
    initializeAuth,
    getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCx2muw-L3DqzrN2v-pZ1F8D1xtJOqqdrA",
    authDomain: "beaconmobileapp-256f4.firebaseapp.com",
    projectId: "beaconmobileapp-256f4",
    storageBucket: "beaconmobileapp-256f4.firebasestorage.app",
    messagingSenderId: "42471785456",
    appId: "1:42471785456:web:40afefb29b63ce38e15335",
    measurementId: "G-XKPCZG7QJ6"
};

import { getStorage } from 'firebase/storage';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Storage
const storage = getStorage(app);

export { auth, app, storage };
