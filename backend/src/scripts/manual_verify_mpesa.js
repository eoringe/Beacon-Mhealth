
require('dotenv').config();
const { pool } = require('../config/database');
const mpesaController = require('../controllers/mpesaController');
const appointmentController = require('../controllers/appointmentController');

// Mock Request/Response
const mockReq = (body) => ({
    body,
    user: { id: 1 }, // Assuming user ID 1 exists
    params: {}
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function verifyFlow() {
    console.log('--- Starting M-Pesa Flow Verification ---');

    // 1. Setup Test Data
    // Need a valid child and doctor.
    // Fetch a child
    const client = await pool.connect();
    let childId, doctorId, userId;

    try {
        const childRes = await client.query('SELECT id, parent_id FROM children LIMIT 1');
        if (childRes.rows.length === 0) throw new Error('No children found for test');
        childId = childRes.rows[0].id;
        userId = childRes.rows[0].parent_id;

        // Fetch a doctor
        const docRes = await client.query('SELECT id FROM doctors LIMIT 1');
        if (docRes.rows.length === 0) throw new Error('No doctors found for test');
        doctorId = docRes.rows[0].id;

    } finally {
        client.release();
    }

    console.log(`Using Child: ${childId}, Doctor: ${doctorId}, User: ${userId}`);

    // Data for STK Push
    const appointmentData = {
        doctorId,
        childId,
        appointmentDate: '2026-12-31', // Future date
        appointmentTime: '10:00',
        appointmentType: 'TELECONSULT',
        reason: 'Automated Test'
    };

    const req = mockReq({
        phone: '0712345678',
        amount: 1.00,
        appointment_data: appointmentData,
        reference_id: 0
    });

    const res = mockRes();

    // 2. Initiate STK Push (Mock Mode expected since env is likely sandbox or we force logic)
    // Force Mock Mode by setting env var temporarily if not set
    process.env.MPESA_ENV = 'sandbox';
    // Ensure Key is not set to real to trigger mock if needed, or rely on logic. 
    // Logic: if (isMockMode) ...
    // My controller logic checks: process.env.MPESA_ENV === 'sandbox' && (!process.env.MPESA_CONSUMER_KEY || ... === 'your_key')
    // I'll assume current env matches "your_key" or I'll override it.
    process.env.MPESA_CONSUMER_KEY = 'your_key';

    console.log('Initiating STK Push...');
    await mpesaController.initiateStkPush(req, res);

    console.log('STK Push Response:', res.data);

    if (!res.data.success) {
        throw new Error('STK Push failed');
    }

    const checkoutRequestId = res.data.checkout_request_id;
    console.log('Checkout ID:', checkoutRequestId);

    // 3. Wait for Mock Callback to Process (Controller has 3s timeout)
    console.log('Waiting for mock callback processing (4s)...');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // 4. Check Status
    console.log('Checking Status...');
    const statusReq = { params: { checkoutRequestId } };
    const statusRes = mockRes();

    await mpesaController.checkStatus(statusReq, statusRes);
    console.log('Status Response:', statusRes.data);

    if (statusRes.data.status !== 'completed') {
        console.error('Test Failed: Status is not completed. It is:', statusRes.data.status);
    } else {
        console.log('Test PASSED: Payment Completed.');

        // Verify Appointment Creation Logic was called?
        // We can check logs or query DB.
        console.log('Note: Check console logs above for "Mock Appointment Created" or errors.');
    }

    pool.end();
}

verifyFlow().catch(console.error);
