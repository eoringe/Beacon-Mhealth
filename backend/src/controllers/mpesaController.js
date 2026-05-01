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

        // Generate a clean AccountReference (Max 12 chars)
        let accountRef = 'BCC-APP';
        if (appointment_data.child_id) {
            accountRef = `BCC-${String(appointment_data.child_id).substring(0, 8)}`;
        } else if (appointment_data.child_first_name || appointment_data.child_name) {
            const name = (appointment_data.child_first_name || appointment_data.child_name)
                .replace(/[^a-zA-Z]/g, '').substring(0, 8);
            accountRef = `BCC-${name}`;
        } else {
            // Fallback for new patients without ID yet: Last 4 digits of phone
            accountRef = `BCC-NP-${formattedPhone.slice(-4)}`;
        }

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
            AccountReference: accountRef.substring(0, 12).toUpperCase(),
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
                const childId = apptData.childId || apptData.child_id;

                // 1. Resolve registration number locally
                const localChild = await pool.query('SELECT registration_number FROM children WHERE id = $1', [childId]);
                const regNumber = localChild.rows[0]?.registration_number;

                if (regNumber) {
                    // 2. Query external DB using the registration number string
                    const apptResult = await externalQuery(
                        `SELECT a.id, a.google_meet_link, a.appointment_type 
                         FROM appointments a
                         JOIN children c ON a.child_id = c.id
                         WHERE c.registration_number = $1
                         AND a.appointment_date = $2 AND a.start_time = $3
                         ORDER BY a.created_at DESC LIMIT 1`,
                        [regNumber, apptData.appointmentDate || apptData.appointment_date, apptData.appointmentTime || apptData.appointment_time]
                    );

                    if (apptResult.rows.length > 0) {
                        response.appointment_id = apptResult.rows[0].id;
                        response.google_meet_link = apptResult.rows[0].google_meet_link;
                        response.appointment_type = apptResult.rows[0].appointment_type;
                    }
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
    console.log('\n========================================');
    console.log('[Callback] M-PESA CALLBACK RECEIVED');
    console.log('[Callback] Timestamp:', new Date().toISOString());
    console.log('[Callback] Request Body:', JSON.stringify(req.body, null, 2));
    console.log('========================================');

    try {
        const { Body } = req.body;
        const { stkCallback } = Body;

        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;

        console.log('[Callback] Details:', { checkoutRequestId, resultCode, resultDesc });

        const client = await pool.connect();
        try {
            // Find transaction
            const txResult = await client.query(
                `SELECT * FROM mpesa_transactions WHERE checkout_request_id = $1`,
                [checkoutRequestId]
            );

            console.log('[Callback] Transaction lookup:', txResult.rows.length, 'rows found');

            if (txResult.rows.length === 0) {
                console.error('[Callback] Transaction NOT FOUND for:', checkoutRequestId);
                return res.json({ result: 'fail' });
            }

            const transaction = txResult.rows[0];
            console.log('[Callback] Found transaction ID:', transaction.id, 'Amount:', transaction.amount, 'Status:', transaction.status);

            if (resultCode === 0) {
                // ============ PAYMENT SUCCESS ============
                const meta = stkCallback.CallbackMetadata.Item;
                const amountItem = meta.find(i => i.Name === 'Amount');
                const receiptItem = meta.find(i => i.Name === 'MpesaReceiptNumber');

                const receipt = receiptItem ? receiptItem.Value : 'UNKNOWN';
                console.log('[Callback] Payment SUCCESSFUL, receipt:', receipt, 'amount:', amountItem?.Value);

                // Update Transaction
                const updateResult = await client.query(
                    `UPDATE mpesa_transactions 
                     SET status = 'completed', mpesa_receipt_number = $1, result_desc = $2, updated_at = NOW()
                     WHERE id = $3
                     RETURNING *`,
                    [receipt, resultDesc, transaction.id]
                );
                console.log('[Callback] Transaction updated to:', updateResult.rows[0]?.status);

                // ============ CREATE APPOINTMENT ============
                const apptDataRaw = transaction.appointment_data;
                // Handle string vs object (JSONB should auto-parse, but be safe)
                const apptData = typeof apptDataRaw === 'string' ? JSON.parse(apptDataRaw) : apptDataRaw;

                console.log('[Callback] Appointment data:', JSON.stringify(apptData, null, 2));
                console.log('[Callback] is_public_booking:', apptData.is_public_booking);

                if (apptData.is_public_booking) {
                    // ======== PUBLIC/WEB APP BOOKING FLOW ========
                    console.log('[Callback] Using PUBLIC booking flow');
                    try {
                        const { externalPool } = require('../config/externalDatabase');
                        const { externalQuery } = require('../config/externalDatabase');
                        const googleCalendarService = require('../services/googleCalendarService');
                        const emailService = require('../services/emailService');

                        let externalClient = await externalPool.connect();
                        try {
                            await externalClient.query('BEGIN');

                            let externalChildId;
                            let childFullName;

                            // 1. Resolve Patient
                            if (apptData.is_return_patient) {
                                console.log('[Callback] Return patient flow, reg:', apptData.reg_number);
                                const check = await externalClient.query(
                                    'SELECT id, fullname FROM children WHERE registration_number = $1 AND dob = $2',
                                    [apptData.reg_number, apptData.dob]
                                );
                                if (check.rows.length === 0) throw new Error('Return patient verification failed in callback');
                                externalChildId = check.rows[0].id;
                                childFullName = check.rows[0].fullname;
                                if (typeof childFullName === 'object') {
                                    childFullName = `${childFullName.first_name || ''} ${childFullName.last_name || ''}`.trim();
                                }
                                console.log('[Callback] Return patient found, childId:', externalChildId);
                            } else {
                                console.log('[Callback] Guest patient flow');
                                // Create/Find Parent
                                const parentCheck = await externalClient.query(
                                    'SELECT id FROM parents WHERE telephone = $1 OR (email IS NOT NULL AND LOWER(email) = LOWER($2))',
                                    [apptData.parent_phone, apptData.parent_email || '']
                                );

                                let externalParentId;
                                if (parentCheck.rows.length > 0) {
                                    externalParentId = parentCheck.rows[0].id;
                                    console.log('[Callback] Found existing parent:', externalParentId);
                                } else {
                                    const fullnameJson = JSON.stringify({
                                        first_name: apptData.parent_first_name || 'Guest',
                                        last_name: apptData.parent_last_name || 'Parent'
                                    });
                                    const parentResult = await externalClient.query(
                                        'INSERT INTO parents (fullname, telephone, email, relationship_id, gender_id, created_at, updated_at) VALUES ($1, $2, $3, 1, 2, NOW(), NOW()) RETURNING id',
                                        [fullnameJson, apptData.parent_phone, apptData.parent_email]
                                    );
                                    externalParentId = parentResult.rows[0].id;
                                    console.log('[Callback] Created new parent:', externalParentId);
                                }

                                // Create Child
                                const timestamp = Math.floor(Date.now() / 1000);
                                const guestRegNumber = `GUEST-${timestamp}-${Math.floor(Math.random() * 9000)}`;
                                const childFullnameJson = JSON.stringify({
                                    first_name: apptData.child_first_name || 'Child',
                                    last_name: apptData.child_last_name || ''
                                });
                                const genderId = (apptData.child_gender || '').toLowerCase() === 'female' ? 2 : 1;

                                const childResult = await externalClient.query(
                                    'INSERT INTO children (fullname, dob, gender_id, registration_number, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
                                    [childFullnameJson, apptData.child_dob, genderId, guestRegNumber]
                                );
                                externalChildId = childResult.rows[0].id;
                                childFullName = `${apptData.child_first_name || ''} ${apptData.child_last_name || ''}`.trim();
                                console.log('[Callback] Created guest child:', externalChildId, 'reg:', guestRegNumber);

                                // Link them
                                await externalClient.query(
                                    'INSERT INTO child_parent (parent_id, child_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
                                    [externalParentId, externalChildId]
                                );
                                console.log('[Callback] Linked parent-child');
                            }

                            // 2. Auto-assign Doctor
                            // Inline auto-assign to avoid import complexity
                            const specId = apptData.specialization_id;
                            const appointmentDate = apptData.appointment_date;
                            const appointmentTime = apptData.appointment_time;
                            const dayOfWeek = new Date(appointmentDate).getDay();

                            const doctorsResult = await externalQuery(
                                `SELECT s.id FROM staff s JOIN staff_specialization ss ON ss.staff_id = s.id WHERE ss.specialization_id = $1 AND s.is_active = true`,
                                [specId]
                            );
                            console.log('[Callback] Found', doctorsResult.rows.length, 'doctors for specialization', specId);

                            let assignedDoctorId = null;
                            for (const doc of doctorsResult.rows) {
                                const teleResult = await externalQuery(
                                    `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities WHERE doctor_id = $1 AND day_of_week = $2 AND (window_type IS NULL OR window_type != 'in_person')`,
                                    [doc.id, dayOfWeek]
                                );
                                const normalizedTime = appointmentTime.substring(0, 5);
                                const inWindow = teleResult.rows.some(w => {
                                    const s = w.start_time.substring(0, 5);
                                    const e = w.end_time.substring(0, 5);
                                    return normalizedTime >= s && normalizedTime < e;
                                });
                                if (!inWindow) continue;

                                const conflict = await externalQuery(
                                    `SELECT id FROM appointments WHERE (staff_id = $1 OR doctor_id = $1) AND appointment_date = $2 AND start_time::text LIKE $3 AND status != 'cancelled'`,
                                    [doc.id, appointmentDate, `${normalizedTime}%`]
                                );
                                if (conflict.rows.length === 0) {
                                    assignedDoctorId = doc.id;
                                    console.log('[Callback] Assigned doctor:', assignedDoctorId);
                                    break;
                                }
                            }

                            if (!assignedDoctorId) {
                                console.error('[Callback] No doctor available for slot! Payment received but no appointment created.');
                                // Still commit what we have — the payment is real
                                await externalClient.query('COMMIT');
                                return res.json({ result: 'success' });
                            }

                            // 3. Create Appointment
                            const [hours, minutes] = appointmentTime.split(':').map(Number);
                            const endTimeStr = `${(hours + 1).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                            // Fetch specialization name for title
                            let specNameForTitle = '';
                            try {
                                const specResult = await externalQuery('SELECT specialization FROM doctor_specialization WHERE id = $1', [specId]);
                                if (specResult.rows.length > 0) specNameForTitle = specResult.rows[0].specialization;
                            } catch (e) {}

                            const finalTitle = specNameForTitle ? `[${specNameForTitle}] ${childFullName}` : childFullName;

                            const apptResult = await externalClient.query(
                                `INSERT INTO appointments (
                                    child_id, doctor_id, staff_id, appointment_title, 
                                    appointment_date, start_time, end_time, status, appointment_type, 
                                    created_at, updated_at
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'TELECONSULT', NOW(), NOW()) RETURNING *`,
                                [externalChildId, assignedDoctorId, 1, finalTitle, appointmentDate, appointmentTime, endTimeStr]
                            );

                            const appointment = apptResult.rows[0];
                            console.log('[Callback] Appointment CREATED:', appointment.id);

                            // 4. Google Calendar + Meet Link
                            try {
                                googleCalendarService.initialize();
                                if (googleCalendarService.isConfigured()) {
                                    const emailToInvite = apptData.parent_email;
                                    const idempotencyKey = googleCalendarService.generateIdempotencyKey(externalChildId, assignedDoctorId, appointmentDate, appointmentTime);
                                    
                                    const event = await googleCalendarService.createCalendarEvent({
                                        summary: specNameForTitle ? `${specNameForTitle}: ${childFullName}` : `Teleconsultation: ${childFullName}`,
                                        description: `Public Booking (Paid via M-Pesa: ${receipt}). Reason: ${apptData.reason || 'N/A'}`,
                                        date: appointmentDate,
                                        startTime: appointmentTime,
                                        endTime: endTimeStr,
                                        attendees: emailToInvite ? [emailToInvite] : []
                                    }, idempotencyKey);

                                    if (event.meetLink) {
                                        await externalClient.query(
                                            'UPDATE appointments SET google_meet_link = $1, google_calendar_event_id = $2, google_calendar_html_link = $3 WHERE id = $4',
                                            [event.meetLink, event.eventId, event.htmlLink, appointment.id]
                                        );
                                        appointment.google_meet_link = event.meetLink;
                                        console.log('[Callback] Meet link added:', event.meetLink);
                                    }
                                }
                            } catch (calErr) {
                                console.error('[Callback] Google Calendar error:', calErr.message);
                            }

                            // 5. Send Email
                            try {
                                if (apptData.parent_email) {
                                    console.log('[Callback] Sending confirmation email to:', apptData.parent_email);
                                    emailService.sendBookingConfirmation(apptData.parent_email, {
                                        ...appointment,
                                        appointment_title: childFullName,
                                    }).catch(err => console.error('[Callback] Email error:', err.message));
                                }
                            } catch (emailErr) {
                                console.error('[Callback] Email setup error:', emailErr.message);
                            }

                            await externalClient.query('COMMIT');
                            console.log('[Callback] PUBLIC booking flow COMPLETE');

                        } catch (publicErr) {
                            if (externalClient) await externalClient.query('ROLLBACK');
                            console.error('[Callback] PUBLIC booking FAILED:', publicErr.message);
                            console.error('[Callback] Stack:', publicErr.stack);
                        } finally {
                            if (externalClient) externalClient.release();
                        }

                    } catch (outerErr) {
                        console.error('[Callback] Error in public booking setup:', outerErr.message);
                    }

                } else {
                    // ======== MOBILE APP BOOKING FLOW (existing) ========
                    console.log('[Callback] Using MOBILE APP booking flow');
                    const childId = apptData.childId || apptData.child_id;

                    // Get User ID from child
                    const userResult = await client.query('SELECT parent_id FROM children WHERE id = $1', [childId]);
                    const userId = userResult.rows[0]?.parent_id;
                    console.log('[Callback] Resolved userId:', userId, 'from childId:', childId);

                    if (userId) {
                        try {
                            // Standardize keys for createAppointmentLogic
                            const mobileApptData = {
                                childId: childId,
                                specializationId: apptData.specializationId || apptData.specialization_id,
                                doctorId: apptData.doctorId || apptData.doctor_id || 0,
                                appointmentDate: apptData.appointmentDate || apptData.appointment_date,
                                appointmentTime: apptData.appointmentTime || apptData.appointment_time,
                                appointmentType: apptData.appointmentType || apptData.appointment_type || 'TELECONSULT',
                                reason: apptData.reason,
                                notes: apptData.notes
                            };

                            const result = await appointmentController.createAppointmentLogic(mobileApptData, userId);
                            console.log('[Callback] Mobile appointment created:', result?.id);
                        } catch (err) {
                            console.error('[Callback] Mobile appointment creation FAILED:', err.message);
                        }
                    } else {
                        console.error('[Callback] Could not resolve userId for childId:', childId);
                    }
                }

            } else {
                // ============ PAYMENT FAILED / CANCELLED ============
                console.log('[Callback] Payment FAILED/CANCELLED. ResultCode:', resultCode, 'Desc:', resultDesc);
                await client.query(
                    `UPDATE mpesa_transactions 
                     SET status = 'failed', result_desc = $1, updated_at = NOW()
                     WHERE id = $2`,
                    [resultDesc, transaction.id]
                );
                console.log('[Callback] Transaction marked as failed');
            }
        } finally {
            client.release();
        }

        console.log('[Callback] Sending ACK to Safaricom');
        res.json({ result: 'success' }); // Ack to Safaricom

    } catch (error) {
        console.error('[Callback] CRITICAL ERROR:', error.message);
        console.error('[Callback] Stack:', error.stack);
        res.status(500).json({ error: 'Callback failed' });
    }
};
