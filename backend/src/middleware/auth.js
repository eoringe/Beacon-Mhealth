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
