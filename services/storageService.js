import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';

/**
 * Storage Service
 * Handles uploading local files to Firebase Storage
 */
export const storageService = {
    /**
     * Upload an image from a local URI to Firebase Storage
     * @param {string} localUri - Local file path (from ImagePicker)
     * @param {string} path - Remote path in storage (e.g., 'profiles/user123.jpg')
     * @returns {Promise<string>} - The public download URL
     */
    uploadImage: async (localUri, path) => {
        try {
            console.log(`[StorageService] Starting upload to ${path}`);
            
            // 1. Fetch the blob from the local URI
            const response = await fetch(localUri);
            const blob = await response.blob();
            
            // 2. Create a reference to the remote path
            const storageRef = ref(storage, path);
            
            // 3. Upload the blob
            const result = await uploadBytes(storageRef, blob);
            console.log('[StorageService] Upload successful');
            
            // 4. Get and return the download URL
            const downloadUrl = await getDownloadURL(result.ref);
            return downloadUrl;
        } catch (error) {
            console.error('[StorageService] Upload failed:', error);
            throw new Error('Failed to upload image. Please check your connection.');
        }
    }
};
