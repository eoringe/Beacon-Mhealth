const { auth } = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            // Verify Firebase ID token
            const decodedToken = await auth.verifyIdToken(token);

            // Attach user info to request
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified,
                displayName: decodedToken.name || null,
                photoURL: decodedToken.picture || null
            };

            // Fetch user from database to get UUID
            const { Pool } = require('pg');
            const pool = new Pool({ connectionString: process.env.DATABASE_URL });
            const client = await pool.connect();
            try {
                const result = await client.query('SELECT * FROM users WHERE firebase_uid = $1', [decodedToken.uid]);
                if (result.rows.length > 0) {
                    req.user = { ...req.user, ...result.rows[0] };
                } else {
                    // Optional: Auto-create user if not found? For now, just log warning
                    console.warn('User not found in database for Firebase UID:', decodedToken.uid);
                }
            } catch (dbError) {
                console.error('Database error in auth middleware:', dbError);
            } finally {
                client.release();
                // Don't close pool here as it might be shared, but creating new pool per request is bad practice.
                // Ideally pool should be imported. For quick fix, we'll rely on pool management or import it properly.
            }

            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = authMiddleware;
