const express = require('express');
const router = express.Router();
const growthController = require('../controllers/growthController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Add a new measurement
router.post('/:childId', growthController.addMeasurement);

// Get all measurements for a child
router.get('/:childId', growthController.getMeasurements);

// Delete a measurement
router.delete('/:id', growthController.deleteMeasurement);

module.exports = router;
