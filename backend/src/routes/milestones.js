const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Save or update milestone responses for a specific child
router.post('/:childId', milestoneController.saveMilestoneResponses);

// Get milestone responses for a specific child, age, and category
router.get('/:childId', milestoneController.getMilestoneResponses);

// Get all milestone responses for a child
router.get('/:childId/all', milestoneController.getAllMilestoneResponsesForChild);

module.exports = router;
