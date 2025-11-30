const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes (no auth required)
router.post('/register', authController.registerUser);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/fcm-token', authMiddleware, authController.updateFCMToken);
router.post('/verify', authMiddleware, authController.verifyToken);

module.exports = router;
