const { query } = require('../config/database');

class AuthController {
    // Register or update user in database after Firebase auth
    async registerUser(req, res, next) {
        console.log('[AuthController] Registering user:', req.body.email);
        try {
            const { firebaseUid, email, displayName, photoUrl } = req.body;

            if (!firebaseUid || !email) {
                console.warn('[AuthController] Missing required fields:', { firebaseUid: !!firebaseUid, email: !!email });
                return res.status(400).json({ error: 'Firebase UID and email are required' });
            }

            // First check if user exists by email
            console.log('[AuthController] Checking if user exists by email:', email);
            const existingUser = await query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );

            let result;
            if (existingUser.rows.length > 0) {
                console.log('[AuthController] User exists, updating record...');
                // Update existing user with firebase_uid
                result = await query(
                    `UPDATE users 
                     SET firebase_uid = $1, 
                         display_name = $2, 
                         photo_url = $3, 
                         updated_at = NOW()
                     WHERE email = $4
                     RETURNING id, firebase_uid, email, display_name, photo_url, created_at`,
                    [firebaseUid, displayName || null, photoUrl || null, email]
                );
            } else {
                console.log('[AuthController] Creating new user record...');
                // Insert new user
                result = await query(
                    `INSERT INTO users (firebase_uid, email, display_name, photo_url, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, NOW(), NOW())
                     RETURNING id, firebase_uid, email, display_name, photo_url, created_at`,
                    [firebaseUid, email, displayName || null, photoUrl || null]
                );
            }

            console.log('[AuthController] User registered successfully:', result.rows[0].id);
            res.status(201).json({
                message: 'User registered successfully',
                user: result.rows[0]
            });
        } catch (error) {
            console.error('[AuthController] Error registering user:', error);
            next(error);
        }
    }

    // Get user profile
    async getProfile(req, res, next) {
        try {
            const { uid } = req.user;

            const result = await query(
                'SELECT id, firebase_uid, email, display_name, photo_url, phone_number, date_of_birth, location, created_at FROM users WHERE firebase_uid = $1',
                [uid]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user: result.rows[0] });
        } catch (error) {
            next(error);
        }
    }

    // Update user profile
    async updateProfile(req, res, next) {
        try {
            const { uid } = req.user;
            const { displayName, phoneNumber } = req.body;

            console.log('[AuthController] Updating profile for:', uid, req.body);

            // Update user record
            // We map displayName to display_name (Firebase style)
            const result = await query(
                `UPDATE users 
                 SET display_name = COALESCE($1, display_name), 
                     phone_number = COALESCE($2, phone_number),
                     updated_at = NOW()
                 WHERE firebase_uid = $3
                 RETURNING id, firebase_uid, email, display_name, phone_number`,
                [displayName, phoneNumber, uid]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                message: 'Profile updated successfully',
                user: result.rows[0]
            });
        } catch (error) {
            console.error('[AuthController] Error updating profile:', error);
            next(error);
        }
    }

    // Update FCM token for push notifications
    async updateFCMToken(req, res, next) {
        try {
            const { uid } = req.user;
            const { fcmToken } = req.body;

            if (!fcmToken) {
                return res.status(400).json({ error: 'FCM token is required' });
            }

            await query(
                'UPDATE users SET fcm_token = $1, updated_at = NOW() WHERE firebase_uid = $2',
                [fcmToken, uid]
            );

            res.json({ message: 'FCM token updated successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Verify token (when called from client)
    async verifyToken(req, res) {
        // If we reach here, token is valid (middleware already verified it)
        res.json({
            valid: true,
            user: req.user
        });
    }

    // Delete user account
    async deleteAccount(req, res, next) {
        try {
            const { uid } = req.user;
            console.log('[AuthController] Deleting account:', uid);

            // Delete from database
            const result = await query(
                'DELETE FROM users WHERE firebase_uid = $1 RETURNING id',
                [uid]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Note: Firebase user deletion is usually handled by the client or a separate admin script,
            // but deleting from our DB removes their app data access.

            res.json({ message: 'Account deleted successfully' });
        } catch (error) {
            console.error('[AuthController] Error deleting account:', error);
            next(error);
        }
    }
}

module.exports = new AuthController();
