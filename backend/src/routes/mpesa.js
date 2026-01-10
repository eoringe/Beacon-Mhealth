const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesaController');
const { displayAuth } = require('../middleware/auth'); // Optional auth for status checks

// Initiate STK Push
router.post('/stk-push', mpesaController.initiateStkPush);

// Check Status
router.get('/status/:checkoutRequestId', mpesaController.checkStatus);

// Callback (Publicly accessible)
router.post('/callback', mpesaController.callback);

module.exports = router;
