const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Patient Verification (For internal clinic children)
router.post('/verify-patient', publicController.verifyPatient);

// Specializations
router.get('/specializations', publicController.getPublicSpecializations);

// Availability
router.get('/availability', publicController.getPublicAvailability);

// Consolidated Booking Endpoint
// Handles both Guest and Return patients
router.post('/book', publicController.bookPublicAppointment);

module.exports = router;
