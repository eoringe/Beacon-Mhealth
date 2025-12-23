const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');

// All routes require authentication
router.use(authMiddleware);

// Get all available doctors
router.get('/doctors', appointmentController.getAvailableDoctors);

// Get doctor availability for a specific date
router.get('/doctors/:doctorId/availability', appointmentController.getDoctorAvailability);

// Create a new appointment
router.post('/', appointmentController.createAppointment);

// Get user's appointments (with optional status filter)
router.get('/', appointmentController.getUserAppointments);

// Cancel an appointment
router.delete('/:appointmentId', appointmentController.cancelAppointment);

// Delete an appointment (hard delete)
router.delete('/:appointmentId/delete', appointmentController.deleteAppointment);

module.exports = router;
