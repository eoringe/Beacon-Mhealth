const axios = require('axios');
const { pool } = require('../config/database');
const { externalQuery, externalPool } = require('../config/externalDatabase');
const appointmentController = require('./appointmentController');

// Helper to get access token
const getAccessToken = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    console.log('--- M-Pesa Token Request Debug ---');
    console.log('Consumer Key:', consumerKey ? `${consumerKey.substring(0, 5)}...${consumerKey.substring(consumerKey.length - 5)}` : 'MISSING');
    console.log('Consumer Secret:', consumerSecret ? `${consumerSecret.length} chars` : 'MISSING');
    console.log('MPESA_ENV:', process.env.MPESA_ENV);

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const url = process.env.MPESA_ENV === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    console.log('Token URL:', url);

    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Basic ${auth}` }
        });
        console.log('Token Response Status:', response.status);
        return response.data.access_token;
    } catch (error) {
        console.error('M-Pesa Token Error Status:', error.response?.status);
        console.error('M-Pesa Token Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('M-Pesa Token Error Message:', error.message);
        throw new Error('Failed to get M-Pesa token');
    }
};

exports.initiateStkPush = async (req, res) => {
    // Check if we are in a testing/sandbox mode without real credentials
    const isMockMode = process.env.MPESA_ENV === 'sandbox' && (!process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY === 'your_key');

    // IF MOCK MODE (For User testing without real credentials)
    if (isMockMode) {
        // Simulate success immediately
        const { phone, amount, appointment_data, reference_id } = req.body;
        const checkoutRequestId = `ws_CO_${Date.now()}`;

        // Save to DB
        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO mpesa_transactions 
                 (checkout_request_id, merchant_request_id, amount, phone, status, appointment_data, reference_id)
                 VALUES ($1, $2, $3, $4, 'pending', $5, $6)`,
                [checkoutRequestId, `mock_${Date.now()}`, amount, phone, appointment_data, reference_id]
            );

            // Auto-complete it after 3 seconds asynchronously
            setTimeout(async () => {
                const subClient = await pool.connect();
                try {
                    // Create appointment logic
                    // We need userId. Assuming appointment_data has userId or we Mock it?
                    // The prompt's appointment_data doesn't have userId. 
                    // But we need it for appointment creation.
                    // We should pass it or retrieve from child relation?
                    // appointmentController.createAppointmentLogic expects valid userId to verification.

                    // Hack for Mock: Resolve userId from childId (owner of child)
                    const childId = appointment_data.child_id;
                    const userResult = await subClient.query('SELECT parent_id FROM children WHERE id = $1', [childId]);
                    let userId = userResult.rows[0]?.parent_id;

                    // Update transaction
                    await subClient.query(
                        "UPDATE mpesa_transactions SET status = 'completed', mpesa_receipt_number = 'MOCK123456' WHERE checkout_request_id = $1",
                        [checkoutRequestId]
                    );

                    // Create Appointment
                    if (userId) {
                        try {
                            const result = await appointmentController.createAppointmentLogic(appointment_data, userId);
                            console.log('Mock Appointment Created:', result);
                        } catch (e) {
                            console.error('Mock Appointment Creation Failed:', e);
                        }
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    subClient.release();
                }
            }, 3000);

            return res.json({
                success: true,
                message: "STK Push initiated successfully (MOCK)",
                checkout_request_id: checkoutRequestId,
                merchant_request_id: `mock_${Date.now()}`
            });

        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Mock Error' });
        } finally {
            client.release();
        }
    }

    // REAL IMPLEMENTATION
    try {
        const { phone, amount, appointment_data, reference_id } = req.body;

        // Validation
        if (!phone || !amount || !appointment_data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Format phone number to 254XXXXXXXXX
        let formattedPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('254')) {
            formattedPhone = '254' + formattedPhone;
        }
        console.log('Formatted Phone:', formattedPhone);

        // 1. Get Token
        const token = await getAccessToken();

        // 2. Prepare Request
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const passkey = process.env.MPESA_PASSKEY;
        const shortcode = process.env.MPESA_SHORTCODE;
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        const url = process.env.MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const stkRequest = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(Number(amount)), // Must be integer usually, but API accepts number
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: `Appt-${appointment_data.child_id}`,
            TransactionDesc: 'Consultation Fee'
        };

        // 3. Send Request
        const response = await axios.post(url, stkRequest, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 4. Save to DB
        const checkoutRequestId = response.data.CheckoutRequestID;
        const merchantRequestId = response.data.MerchantRequestID; // Fixed casing

        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO mpesa_transactions 
                 (checkout_request_id, merchant_request_id, amount, phone, status, appointment_data, reference_id)
                 VALUES ($1, $2, $3, $4, 'pending', $5, $6)`,
                [checkoutRequestId, merchantRequestId, amount, phone, appointment_data, reference_id]
            );
        } finally {
            client.release();
        }

        res.json({
            success: true,
            message: "STK Push initiated successfully",
            checkout_request_id: checkoutRequestId,
            merchant_request_id: merchantRequestId
        });

    } catch (error) {
        console.error('STK Push Error:', error.response?.data || error.message);
        const debugInfo = {
            hasKey: !!process.env.MPESA_CONSUMER_KEY,
            hasSecret: !!process.env.MPESA_CONSUMER_SECRET,
            env: process.env.MPESA_ENV,
            error: error.response?.data || error.message
        };
        res.status(500).json({ error: 'STK Push request failed', debug: debugInfo });
    }
};

exports.checkStatus = async (req, res) => {
    const { checkoutRequestId } = req.params;
    const client = await pool.connect();

    try {
        const result = await client.query(
            `SELECT * FROM mpesa_transactions WHERE checkout_request_id = $1`,
            [checkoutRequestId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const transaction = result.rows[0];

        // If completed, find the created appointment if we can?
        // We don't store appointment_id in mpesa_transactions table in the migration, 
        // but the plan implied we might want to return it.
        // We can query appointments table by querying what we just created?
        // Actually, let's just return the status. The frontend matches by checkout/polling.

        let response = {
            checkout_request_id: transaction.checkout_request_id,
            payment_type: transaction.payment_type,
            reference_id: transaction.reference_id,
            amount: transaction.amount,
            status: transaction.status,
            mpesa_receipt_number: transaction.mpesa_receipt_number
        };

        // If completed, try to fetch the appointment ID if possible.
        // Since we didn't add appointment_id column to mpesa_transactions, we might not have it easily directly linked 
        // unless we query based on date/time/child.
        // But for now, returning status 'completed' is enough for frontend to know to stop polling 
        // and MAYBE show a success message.
        // WAIT: The prompt says Response (Completed) includes "appointment_id".
        // I should have added appointment_id to the table. 
        // I'll add a quick robust lookup:

        if (transaction.status === 'completed') {
            try {
                const apptData = transaction.appointment_data;
                // apptData.child_id is the LOCAL ID. We need to find the appointment in EXTERNAL DB.
                // We can find it by date, time and the child's registration number (which we can link via local ID)
                const apptResult = await externalQuery(
                    `SELECT a.id, a.google_meet_link 
                     FROM appointments a
                     JOIN children c ON a.child_id = c.id
                     WHERE c.registration_number = (SELECT registration_number FROM children WHERE id = $1)
                     AND a.appointment_date = $2 AND a.start_time = $3
                     ORDER BY a.created_at DESC LIMIT 1`,
                    [apptData.child_id, apptData.appointment_date, apptData.appointment_time]
                );

                if (apptResult.rows.length > 0) {
                    response.appointment_id = apptResult.rows[0].id;
                    response.google_meet_link = apptResult.rows[0].google_meet_link;
                }
            } catch (err) {
                console.error('Error fetching appointment details for status:', err);
            }
        }

        res.json(response);

    } finally {
        client.release();
    }
};

exports.callback = async (req, res) => {
    console.log('--- M-PESA CALLBACK RECEIVED ---');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    try {
        const { Body } = req.body;
        const { stkCallback } = Body;

        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;

        console.log('Callback Details:', { checkoutRequestId, resultCode, resultDesc });

        const client = await pool.connect();
        try {
            // Find transaction
            const txResult = await client.query(
                `SELECT * FROM mpesa_transactions WHERE checkout_request_id = $1`,
                [checkoutRequestId]
            );

            console.log('Transaction lookup result:', txResult.rows.length, 'rows');

            if (txResult.rows.length === 0) {
                console.error('Transaction not found for callback:', checkoutRequestId);
                return res.json({ result: 'fail' });
            }

            const transaction = txResult.rows[0];
            console.log('Found transaction ID:', transaction.id);

            if (resultCode === 0) {
                // SUCCESS
                const meta = stkCallback.CallbackMetadata.Item;
                const amountItem = meta.find(i => i.Name === 'Amount');
                const receiptItem = meta.find(i => i.Name === 'MpesaReceiptNumber');

                const receipt = receiptItem ? receiptItem.Value : 'UNKNOWN';
                console.log('Payment successful, receipt:', receipt);

                // Update Transaction
                const updateResult = await client.query(
                    `UPDATE mpesa_transactions 
                     SET status = 'completed', mpesa_receipt_number = $1, result_desc = $2, updated_at = NOW()
                     WHERE id = $3
                     RETURNING *`,
                    [receipt, resultDesc, transaction.id]
                );
                console.log('Transaction updated:', updateResult.rows[0]?.status);

                // Update Transaction
                await client.query(
                    `UPDATE mpesa_transactions 
                     SET status = 'completed', mpesa_receipt_number = $1, result_desc = $2, updated_at = NOW()
                     WHERE id = $3`,
                    [receipt, resultDesc, transaction.id]
                );

                // triggers appointment creation
                const apptData = transaction.appointment_data;
                const childId = apptData.child_id;

                // Get User ID from child
                const userResult = await client.query('SELECT parent_id FROM children WHERE id = $1', [childId]);
                const userId = userResult.rows[0]?.parent_id;

                if (userId) {
                    try {
                        const result = await appointmentController.createAppointmentLogic(apptData, userId);
                        console.log('Appointment created via Callback:', result);
                        // Ideally store appointment_id in mpesa_transactions here if we had the column
                    } catch (err) {
                        console.error('Failed to create appointment after payment:', err);
                        // Log this critical error! Payment taken, service not given.
                    }
                }

            } else {
                // FAILED / CANCELLED
                await client.query(
                    `UPDATE mpesa_transactions 
                     SET status = 'failed', result_desc = $1, updated_at = NOW()
                     WHERE id = $2`,
                    [resultDesc, transaction.id]
                );
            }
        } finally {
            client.release();
        }

        res.json({ result: 'success' }); // Ack to Safaricom

    } catch (error) {
        console.error('Callback Error:', error);
        res.status(500).json({ error: 'Callback failed' }); // Safaricom doesn't care much about 500, they retry.
    }
};
