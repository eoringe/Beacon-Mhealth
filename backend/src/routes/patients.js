/**
 * Patient Routes
 * API endpoints for patient lookup from external database
 */

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Lookup patient by registration number
// GET /api/patients/lookup/:registrationNumber
router.get('/lookup/:registrationNumber', patientController.lookupByRegistrationNumber);

// Search patients by name or registration number
// GET /api/patients/search?query=xxx
router.get('/search', patientController.searchPatients);

module.exports = router;
