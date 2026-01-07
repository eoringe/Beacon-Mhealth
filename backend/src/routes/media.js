const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');

// Get all media for a child by registration number
router.get('/:registrationNumber', mediaController.getMediaByRegistration);

// Download/stream a specific media file (proxied from Laravel)
router.get('/download/:mediaId', mediaController.downloadMedia);

module.exports = router;
