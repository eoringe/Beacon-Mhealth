const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Get all doctors and therapists
router.get('/', doctorController.getDoctors);

// Get all specializations
router.get('/specializations', doctorController.getSpecializations);

// Get doctors by specialization
router.get('/specialization/:specialization', doctorController.getDoctorsBySpecialization);

module.exports = router;
