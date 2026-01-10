const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const syncController = require('../controllers/syncController');

// Get sync timestamps for cache validation
router.get('/check', authMiddleware, syncController.getSyncTimestamps);

module.exports = router;

