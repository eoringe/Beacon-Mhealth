const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');

// Get all prescriptions for a child by registration number
router.get('/:registrationNumber', prescriptionController.getPrescriptionsByRegistration);

module.exports = router;
