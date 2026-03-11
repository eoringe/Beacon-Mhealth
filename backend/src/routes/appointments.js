const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');

// All routes require authentication
router.use(authMiddleware);

// Get all available doctors (External DB)
const doctorController = require('../controllers/doctorController');
router.get('/doctors', doctorController.getDoctors);

// Get specializations (External DB)
router.get('/specializations', doctorController.getSpecializations);

// Get doctor availability for a specific date (Local Logic for now, but should eventually use external schedules)
router.get('/doctors/:doctorId/availability', appointmentController.getDoctorAvailability);

// Get availability for a specialization (pools all doctors in that specialization)
router.get('/specializations/:specializationId/availability', appointmentController.getSpecializationAvailability);

// Create a new appointment
router.post('/', appointmentController.createAppointment);

// Create a guest appointment (for children without registration number)
router.post('/guest', appointmentController.createGuestAppointment);

// Get user's appointments (with optional status filter)
router.get('/', appointmentController.getUserAppointments);

// Cancel an appointment
router.delete('/:appointmentId', appointmentController.cancelAppointment);

// Delete an appointment (hard delete)
router.delete('/:appointmentId/delete', appointmentController.deleteAppointment);


module.exports = router;
