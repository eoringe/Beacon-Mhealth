const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const mpesaController = require('../controllers/mpesaController');

// Patient Verification (For internal clinic children)
router.post('/verify-patient', publicController.verifyPatient);

// Specializations
router.get('/specializations', publicController.getPublicSpecializations);

// Availability
router.get('/availability', publicController.getPublicAvailability);

// Consultation Prices
router.get('/consultation-prices', publicController.getConsultationPrices);

// Consolidated Booking Endpoint (In-Person — no payment required)
// Handles both Guest and Return patients
router.post('/book', publicController.bookPublicAppointment);

// Teleconsult Booking with M-Pesa Payment
// Initiates STK push, appointment created on successful callback
router.post('/book-teleconsult', publicController.bookPublicTeleconsult);

// M-Pesa Payment Status (poll after STK push)
router.get('/mpesa-status/:checkoutRequestId', mpesaController.checkStatus);

module.exports = router;
