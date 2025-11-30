const { query } = require('../config/database');

class AuthController {
    // Register or update user in database after Firebase auth
    async registerUser(req, res, next) {
        try {
            const { firebaseUid, email, displayName, photoUrl } = req.body;

            if (!firebaseUid || !email) {
                return res.status(400).json({ error: 'Firebase UID and email are required' });
            }

            const result = await query(
                `INSERT INTO users (firebase_uid, email, display_name, photo_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (firebase_uid) 
         DO UPDATE SET 
           email = EXCLUDED.email,
           display_name = EXCLUDED.display_name,
           photo_url = EXCLUDED.photo_url,
           updated_at = NOW()
         RETURNING id, firebase_uid, email, display_name, photo_url, created_at`,
                [firebaseUid, email, displayName || null, photoUrl || null]
            );

            res.status(201).json({
                message: 'User registered successfully',
                user: result.rows[0]
            });
        } catch (error) {
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
}

module.exports = new AuthController();
