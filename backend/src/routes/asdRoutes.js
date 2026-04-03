const express = require('express');
const router = express.Router();
const asdController = require('../controllers/asdController');
const protect = require('../middleware/auth');

// All ASD screening routes are protected
router.use(protect);

router.post('/:childId', asdController.saveAsdScreening);
router.get('/:childId', asdController.getAsdScreeningsForChild);

module.exports = router;
