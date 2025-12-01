const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.post('/', childController.addChild);
router.get('/', childController.getChildren);
router.put('/:id', childController.updateChild);
router.delete('/:id', childController.deleteChild);

module.exports = router;
