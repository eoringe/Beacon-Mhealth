const axios = require('axios');
const { pool } = require('../config/database');
const { externalQuery, externalPool } = require('../config/externalDatabase');
const googleCalendarService = require('../services/googleCalendarService');
const emailService = require('../services/emailService');

// =============================================
// CONSULTATION PRICES (KES)
// Developmental Paediatrician set to 1 for testing
// =============================================
const CONSULTATION_PRICES = {
    'Medical Officer': 1000,
    'Paediatrician': 2000,
    'Developmental Paediatrician': 1,  // KES 1 for testing
    'Occupational Therapist': 1500,
    'Speech Therapist': 2000,
    'Physiotherapist': 1500,
    'Psychologist': 2500,
    'Nutritionist': 1500,
    'Default': 1000
};

/**
 * Helper: Check if date is weekend (Default Mon-Fri working hours)
 */
const isWeekend = (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
};

/**
 * Helper: Generate time slots for a day
 */
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        slots.push(time);
    }
    return slots;
};

// Helper: Normalize incoming appointment type values from query/body.
const normalizeAppointmentType = (value) => {
    if (!value) return 'IN_PERSON';
    const normalized = String(value).trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (normalized === 'INPERSON' || normalized === 'IN_PERSON') return 'IN_PERSON';
    if (normalized === 'TELECONSULT' || normalized === 'TELE_CONSULT') return 'TELECONSULT';
    return normalized;
};

// Helper: Check if a slot falls within at least one availability window
const isTimeInWindows = (time, windows) => {
    if (!Array.isArray(windows) || windows.length === 0) return false;
    return windows.some(window => {
        const start = window.start_time.substring(0, 5);
        const end = window.end_time.substring(0, 5);
        return time >= start && time < end;
    });
};

/**
 * Helper: Check if doctor is unavailable on a specific date
 */
const isDoctorUnavailableOnDate = async (doctorId, date) => {
    try {
        const result = await externalQuery(
            `SELECT reason FROM doctor_unavailabilities 
             WHERE doctor_id = $1 AND unavailable_date::date = $2::date`,
            [doctorId, date]
        );
        return result.rows.length > 0 ? { unavailable: true, reason: result.rows[0].reason } : { unavailable: false };
    } catch (error) {
        return { unavailable: false };
    }
};

/**
 * Helper: Auto-assign an active/available doctor from a specialization
 */
const autoAssignDoctor = async (specializationId, appointmentDate, appointmentTime, appointmentType = 'IN_PERSON') => {
    // UPDATED: Many-to-Many join through staff_specialization pivot
    const doctorsResult = await externalQuery(
        `SELECT s.id FROM staff s 
         JOIN staff_specialization ss ON ss.staff_id = s.id 
         WHERE ss.specialization_id = $1 AND s.is_active = true`,
        [specializationId]
    );

    if (doctorsResult.rows.length === 0) {
        throw new Error('No doctors available for this specialization');
    }

    const candidates = [];
    for (const doc of doctorsResult.rows) {
        const unavailability = await isDoctorUnavailableOnDate(doc.id, appointmentDate);
        if (unavailability.unavailable) continue;

        if (appointmentType === 'IN_PERSON') {
            const dayOfWeek = new Date(appointmentDate).getDay();
            const inPersonResult = await externalQuery(
                `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities
                 WHERE doctor_id = $1 AND day_of_week = $2 AND window_type = 'in_person'`,
                [doc.id, dayOfWeek]
            );
            if (!isTimeInWindows(appointmentTime, inPersonResult.rows)) continue;
        }

        // TELECONSULT: enforce tele-window for the requested day/time
        if (appointmentType === 'TELECONSULT') {
            const dayOfWeek = new Date(appointmentDate).getDay();
            const teleResult = await externalQuery(
                `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities
                 WHERE doctor_id = $1 AND day_of_week = $2`,
                [doc.id, dayOfWeek]
            );
            if (!isTimeInWindows(appointmentTime, teleResult.rows)) continue;
        }

        const dailyCount = await externalQuery(
            `SELECT COUNT(*) as count FROM appointments WHERE (staff_id = $1 OR doctor_id = $1) AND appointment_date = $2`,
            [doc.id, appointmentDate]
        );
        if (parseInt(dailyCount.rows[0].count) >= 10) continue;

        // Normalize to HH:MM to handle DB TIME columns stored as "HH:MM:SS"
        const normalizedTime = appointmentTime.substring(0, 5);

        const conflict = await externalQuery(`
            SELECT id FROM appointments
            WHERE (staff_id = $1 OR doctor_id = $1) AND appointment_date = $2 AND start_time::text LIKE $3 AND status != 'cancelled'
        `, [doc.id, appointmentDate, `${normalizedTime}%`]);

        if (conflict.rows.length === 0) {
            candidates.push({ id: doc.id, count: parseInt(dailyCount.rows[0].count) });
        }
    }

    if (candidates.length === 0) {
        throw new Error('No doctors available at the selected time');
    }

    candidates.sort((a, b) => a.count - b.count);
    return candidates[0].id;
};

/**
 * Patient Verification Endpoint (For Return Patients)
 */
exports.verifyPatient = async (req, res) => {
    try {
        const { reg_number, dob } = req.body;

        if (!reg_number || !dob) {
            return res.status(400).json({ success: false, message: 'Registration number and DOB are required' });
        }

        const result = await externalQuery(
            `SELECT id, fullname, registration_number, dob FROM children WHERE registration_number = $1 AND dob = $2`,
            [reg_number, dob]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient not found. Please check details or book as a guest.' });
        }

        res.json({
            success: true,
            message: 'Patient verified successfully',
            data: {
                id: result.rows[0].id,
                fullname: result.rows[0].fullname,
                registration_number: result.rows[0].registration_number
            }
        });
    } catch (error) {
        console.error('Verify Patient Error:', error);
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
};

/**
 * Public Booking Endpoint
 */
exports.bookPublicAppointment = async (req, res) => {
    let externalClient = null;
    try {
        const {
            is_return_patient,
            // Return Patient Info
            reg_number,
            dob,
            // Guest Patient Info
            parent_first_name,
            parent_last_name,
            parent_phone,
            parent_email,
            child_first_name,
            child_last_name,
            child_dob,
            child_gender,
            // Booking Details
            specialization_id,
            appointment_date,
            appointment_time,
            appointment_type = 'IN_PERSON',
            reason
        } = req.body;
        const normalizedAppointmentType = normalizeAppointmentType(appointment_type);

        if (isWeekend(appointment_date)) {
            return res.status(400).json({ success: false, message: 'Appointments are not available on weekends.' });
        }

        externalClient = await externalPool.connect();
        await externalClient.query('BEGIN');

        let externalChildId;
        let childFullName;

        // 1. Resolve Patient
        if (is_return_patient) {
            // Verify return patient
            const check = await externalClient.query(
                'SELECT id, fullname FROM children WHERE registration_number = $1 AND dob = $2',
                [reg_number, dob]
            );
            if (check.rows.length === 0) throw new Error('Return patient verification failed.');
            externalChildId = check.rows[0].id;
            childFullName = check.rows[0].fullname;
        } else {
            // New Patient (Guest Account Creation)
            // A. Create/Find Parent
            const parentCheck = await externalClient.query(
                'SELECT id FROM parents WHERE telephone = $1 OR (email IS NOT NULL AND LOWER(email) = LOWER($2))',
                [parent_phone, parent_email]
            );

            let externalParentId;
            if (parentCheck.rows.length > 0) {
                externalParentId = parentCheck.rows[0].id;
            } else {
                const fullnameJson = JSON.stringify({ first_name: parent_first_name, last_name: parent_last_name });
                const parentResult = await externalClient.query(
                    'INSERT INTO parents (fullname, telephone, email, relationship_id, gender_id, created_at, updated_at) VALUES ($1, $2, $3, 1, 2, NOW(), NOW()) RETURNING id',
                    [fullnameJson, parent_phone, parent_email]
                );
                externalParentId = parentResult.rows[0].id;
            }

            // B. Create Child
            const timestamp = Math.floor(Date.now() / 1000);
            const guestRegNumber = `GUEST-${timestamp}-${Math.floor(Math.random() * 9000)}`;
            const childFullnameJson = JSON.stringify({ first_name: child_first_name, last_name: child_last_name });
            const genderId = (child_gender || '').toLowerCase() === 'female' ? 2 : 1;

            const childResult = await externalClient.query(
                'INSERT INTO children (fullname, dob, gender_id, registration_number, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
                [childFullnameJson, child_dob, genderId, guestRegNumber]
            );
            externalChildId = childResult.rows[0].id;
            childFullName = `${child_first_name} ${child_last_name}`;

            // C. Link them
            await externalClient.query(
                'INSERT INTO child_parent (parent_id, child_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
                [externalParentId, externalChildId]
            );
        }

        // 2. Assign Doctor
        const doctorId = await autoAssignDoctor(specialization_id, appointment_date, appointment_time, normalizedAppointmentType);

        // Final server-side guard for direct booking calls.
        if (normalizedAppointmentType === 'IN_PERSON') {
            const dayOfWeek = new Date(appointment_date).getDay();
            const inPersonResult = await externalClient.query(
                `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities
                 WHERE doctor_id = $1 AND day_of_week = $2 AND window_type = 'in_person'`,
                [doctorId, dayOfWeek]
            );
            if (!isTimeInWindows(appointment_time, inPersonResult.rows)) {
                throw new Error('Doctor is not available for in-person visits at the selected time');
            }
        }

        // 3. Create Appointment
        const [hours, minutes] = appointment_time.split(':').map(Number);
        const endTimeStr = `${(hours + 1).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        const apptResult = await externalClient.query(
            `INSERT INTO appointments (
                child_id, doctor_id, staff_id, appointment_title, 
                appointment_date, start_time, end_time, status, appointment_type, 
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), NOW()) RETURNING *`,
            [externalChildId, doctorId, 1, childFullName, appointment_date, appointment_time, endTimeStr, normalizedAppointmentType]
        );

        const appointment = apptResult.rows[0];

        // 4. Google Calendar Integration (for teleconsults)
        if (normalizedAppointmentType === 'TELECONSULT') {
            try {
                googleCalendarService.initialize();
                if (googleCalendarService.isConfigured()) {
                    const emailToInvite = parent_email || (await externalClient.query('SELECT email FROM parents p JOIN child_parent cp ON p.id = cp.parent_id WHERE cp.child_id = $1', [externalChildId])).rows[0]?.email;
                    
                    // Generate idempotency key to enable Meet link generation
                    const idempotencyKey = googleCalendarService.generateIdempotencyKey(externalChildId, doctorId, appointment_date, appointment_time);
                    
                    const event = await googleCalendarService.createCalendarEvent({
                        summary: `Teleconsultation: ${childFullName}`,
                        description: `Public Booking: ${reason || 'N/A'}\nChild ID: ${externalChildId}`,
                        date: appointment_date,
                        startTime: appointment_time,
                        endTime: endTimeStr,
                        attendees: emailToInvite ? [emailToInvite] : []
                    }, idempotencyKey);

                    if (event.meetLink) {
                        await externalClient.query(
                            'UPDATE appointments SET google_meet_link = $1, google_calendar_event_id = $2, google_calendar_html_link = $3 WHERE id = $4',
                            [event.meetLink, event.eventId, event.htmlLink, appointment.id]
                        );
                        appointment.google_meet_link = event.meetLink;
                        appointment.google_calendar_event_id = event.eventId;
                        appointment.google_calendar_html_link = event.htmlLink;
                        console.log(`[PublicBooking] Successfully added Meet link: ${event.meetLink}`);
                    }
                }
            } catch (calErr) {
                console.error('[PublicBooking] Google Calendar Error:', calErr.message);
                // Don't fail the whole booking if calendar fails
            }
        }

        // 5. Send Email Confirmation
        try {
            const parentEmail = parent_email || (await externalClient.query('SELECT email FROM parents p JOIN child_parent cp ON p.id = cp.parent_id WHERE cp.child_id = $1', [externalChildId])).rows[0]?.email;
            if (parentEmail) {
                // Send email in fire-and-forget manner to keep response time low
                console.log(`[PublicBooking] Attempting to send confirmation email to ${parentEmail}`);
                emailService.sendBookingConfirmation(parentEmail, {
                    ...appointment,
                    appointment_title: childFullName,
                }).catch(err => console.error('[PublicBooking] Fire-and-forget email error:', err.message));
            } else {
                console.log('[PublicBooking] Skipping email: No parent email found.');
            }
        } catch (emailErr) {
            console.error('[PublicBooking] Graceful Fallback - Email lookup failed:', emailErr.message);
        }

        await externalClient.query('COMMIT');
        res.status(201).json({ success: true, message: 'Appointment booked successfully', appointment });

    } catch (error) {
        if (externalClient) await externalClient.query('ROLLBACK');
        console.error('Public Booking Error:', error);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        if (externalClient) externalClient.release();
    }
};

/**
 * Get Specializations (Public)
 * Mirrors the clinic system's specialization logic with teleconsultation indicators
 */
exports.getPublicSpecializations = async (req, res) => {
    try {
        // UPDATED: Many-to-Many join through staff_specialization pivot
        const result = await externalQuery(`
            SELECT 
                ds.id, 
                ds.specialization, 
                ds.role_id,
                COUNT(s.id)::int as doctor_count,
            EXISTS(
                SELECT 1 FROM doctor_teleconsultation_availabilities ta
                JOIN staff s2 ON ta.doctor_id = s2.id
                JOIN staff_specialization ss2 ON ss2.staff_id = s2.id
                WHERE ss2.specialization_id = ds.id AND s2.is_active = true
            ) as has_teleconsult
            FROM doctor_specialization ds
            JOIN staff_specialization ss ON ss.specialization_id = ds.id
            JOIN staff s ON ss.staff_id = s.id AND s.is_active = true
            GROUP BY ds.id, ds.specialization, ds.role_id
            ORDER BY ds.specialization
        `);

        res.json({ 
            success: true, 
            count: result.rows.length,
            data: result.rows.map(s => ({
                id: s.id,
                name: s.specialization,
                roleId: s.role_id,
                doctorCount: s.doctor_count,
                hasTeleconsult: s.has_teleconsult
            }))
        });
    } catch (error) {
        console.error('Public Fetch Specializations Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch specializations' });
    }
};

/**
 * Format staff name helper (to match system's parsing)
 */
function formatStaffName(fullname) {
    if (!fullname) return 'Unknown';
    if (typeof fullname === 'object') {
        const parts = [];
        if (fullname.first_name) parts.push(fullname.first_name);
        if (fullname.middle_name) parts.push(fullname.middle_name);
        if (fullname.last_name) parts.push(fullname.last_name);
        return parts.join(' ') || 'Unknown';
    }
    try {
        const parsed = JSON.parse(fullname);
        return formatStaffName(parsed);
    } catch {
        return fullname;
    }
}

/**
 * Get Availability (Public)
 */
exports.getPublicAvailability = async (req, res) => {
    try {
        const { specialization_id, date } = req.query;
        const appointment_type = normalizeAppointmentType(req.query.appointment_type || req.query.appointmentType);
        if (!date || !specialization_id) return res.status(400).json({ error: 'Date and specialization_id are required' });

        if (isWeekend(date)) return res.json({ available: false, reason: 'Weekends are not available' });

        // Find doctors in this specialization
        // UPDATED: Many-to-Many join through staff_specialization pivot
        const doctorsResult = await externalQuery(
            `SELECT s.id FROM staff s 
             JOIN staff_specialization ss ON ss.staff_id = s.id 
             WHERE ss.specialization_id = $1 AND s.is_active = true`,
            [specialization_id]
        );

        if (doctorsResult.rows.length === 0) return res.json({ available: false, reason: 'No doctors for this specialty' });

        const allSlots = generateTimeSlots();
        const availableSlotsSet = new Set();

        for (const doc of doctorsResult.rows) {
            const unavailability = await isDoctorUnavailableOnDate(doc.id, date);
            if (unavailability.unavailable) continue;

            // Check in-person windows if needed
            let inPersonWindows = [];
            if (appointment_type === 'IN_PERSON') {
                const dayOfWeek = new Date(date).getDay();
                const inPersonResult = await externalQuery(
                    `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities
                     WHERE doctor_id = $1 AND day_of_week = $2 AND window_type = 'in_person'`,
                    [doc.id, dayOfWeek]
                );
                if (inPersonResult.rows.length === 0) continue;
                inPersonWindows = inPersonResult.rows;
            }

            // Check tele-windows if needed (exclude in_person-only windows)
            let teleWindows = [];
            if (appointment_type === 'TELECONSULT') {
                const dayOfWeek = new Date(date).getDay();
                const teleResult = await externalQuery(
                    `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities WHERE doctor_id = $1 AND day_of_week = $2 AND (window_type IS NULL OR window_type != 'in_person')`,
                    [doc.id, dayOfWeek]
                );
                if (teleResult.rows.length === 0) continue;
                teleWindows = teleResult.rows;
            }

            const bookedResult = await externalQuery(
                `SELECT start_time FROM appointments WHERE (staff_id = $1 OR doctor_id = $1) AND appointment_date = $2 AND status != 'cancelled'`,
                [doc.id, date]
            );
            const bookedTimes = bookedResult.rows.map(r => r.start_time.substring(0, 5));

            allSlots.forEach(slot => {
                if (!bookedTimes.includes(slot)) {
                    if (appointment_type === 'TELECONSULT') {
                        const inWindow = isTimeInWindows(slot, teleWindows);
                        if (inWindow) availableSlotsSet.add(slot);
                    } else if (appointment_type === 'IN_PERSON') {
                        const inWindow = isTimeInWindows(slot, inPersonWindows);
                        if (inWindow) availableSlotsSet.add(slot);
                    } else {
                        availableSlotsSet.add(slot);
                    }
                }
            });
        }

        res.json({ success: true, date, available_slots: Array.from(availableSlotsSet).sort() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Availability check failed' });
    }
};

/**
 * Get General Schedule (Public)
 * Returns the weekly schedule windows for a given specialization
 */
exports.getSpecializationSchedule = async (req, res) => {
    try {
        const { specialization_id } = req.query;
        if (!specialization_id) return res.status(400).json({ error: 'specialization_id is required' });

        // Get all active doctors for this specialization
        const doctorsResult = await externalQuery(
            `SELECT s.id FROM staff s 
             JOIN staff_specialization ss ON ss.staff_id = s.id 
             WHERE ss.specialization_id = $1 AND s.is_active = true`,
            [specialization_id]
        );

        const schedule = { IN_PERSON: {}, TELECONSULT: {} };
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Initialize all days to empty arrays for UI consistency
        for (const type of ['IN_PERSON', 'TELECONSULT']) {
            days.forEach(day => schedule[type][day] = []);
        }

        if (doctorsResult.rows.length > 0) {
            const doctorIds = doctorsResult.rows.map(r => r.id);
            
            // Fetch availabilities
            const availResult = await externalQuery(
                `SELECT day_of_week, start_time, end_time, window_type FROM doctor_teleconsultation_availabilities
                 WHERE doctor_id = ANY($1::int[])`,
                [doctorIds]
            );

            // Group by day and type
            const sets = { IN_PERSON: {}, TELECONSULT: {} };
            days.forEach(day => {
                sets.IN_PERSON[day] = new Set();
                sets.TELECONSULT[day] = new Set();
            });

            availResult.rows.forEach(row => {
                const dayName = days[row.day_of_week];
                // Time from DB might be '09:00:00'
                const timeStr = `${row.start_time.substring(0, 5)} - ${row.end_time.substring(0, 5)}`;
                
                if (row.window_type === 'in_person') {
                    sets.IN_PERSON[dayName].add(timeStr);
                } else {
                    // Null or anything else is treated as teleconsult window
                    sets.TELECONSULT[dayName].add(timeStr);
                }
            });

            // Convert sets to sorted arrays
            for (const type of ['IN_PERSON', 'TELECONSULT']) {
                days.forEach(day => {
                    schedule[type][day] = Array.from(sets[type][day]).sort();
                });
            }
        }

        res.json({ success: true, schedule });
    } catch (error) {
        console.error('Schedule Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
    }
};

// =============================================
// M-PESA HELPERS (duplicated from mpesaController to avoid circular deps)
// =============================================
const getMpesaAccessToken = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    console.log('[PublicTeleconsult] --- M-Pesa Token Request ---');
    console.log('[PublicTeleconsult] Consumer Key:', consumerKey ? `${consumerKey.substring(0, 5)}...` : 'MISSING');
    console.log('[PublicTeleconsult] MPESA_ENV:', process.env.MPESA_ENV);

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const url = process.env.MPESA_ENV === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const response = await axios.get(url, {
        headers: { Authorization: `Basic ${auth}` }
    });
    console.log('[PublicTeleconsult] Token acquired successfully');
    return response.data.access_token;
};

/**
 * Public Teleconsult Booking with M-Pesa Payment
 * 
 * Flow:
 * 1. Web app sends booking details + phone number
 * 2. Backend validates, determines price, initiates STK push
 * 3. Stores appointment_data in mpesa_transactions
 * 4. Returns checkout_request_id for polling
 * 5. On M-Pesa callback success → appointment is auto-created
 */
exports.bookPublicTeleconsult = async (req, res) => {
    console.log('\n========================================');
    console.log('[PublicTeleconsult] NEW BOOKING REQUEST');
    console.log('[PublicTeleconsult] Timestamp:', new Date().toISOString());
    console.log('[PublicTeleconsult] Body:', JSON.stringify(req.body, null, 2));
    console.log('========================================');

    try {
        const {
            // Patient info
            is_return_patient,
            reg_number,
            dob,
            parent_first_name,
            parent_last_name,
            parent_phone,
            parent_email,
            child_first_name,
            child_last_name,
            child_dob,
            child_gender,
            // Booking details
            specialization_id,
            appointment_date,
            appointment_time,
            reason,
            // Payment
            phone  // M-Pesa phone number
        } = req.body;

        // ---- VALIDATION ----
        if (!specialization_id || !appointment_date || !appointment_time) {
            console.log('[PublicTeleconsult] VALIDATION FAILED: Missing booking details');
            return res.status(400).json({ success: false, message: 'specialization_id, appointment_date, and appointment_time are required' });
        }
        if (!phone) {
            console.log('[PublicTeleconsult] VALIDATION FAILED: Missing phone for M-Pesa');
            return res.status(400).json({ success: false, message: 'phone is required for M-Pesa payment' });
        }
        if (!is_return_patient && (!parent_phone || !child_first_name || !child_dob)) {
            console.log('[PublicTeleconsult] VALIDATION FAILED: Missing guest patient details');
            return res.status(400).json({ success: false, message: 'Guest bookings require parent_phone, child_first_name, and child_dob' });
        }

        // ---- RESOLVE SPECIALIZATION NAME & PRICE ----
        let specName = 'Default';
        try {
            const specResult = await externalQuery(
                'SELECT specialization FROM doctor_specialization WHERE id = $1',
                [specialization_id]
            );
            if (specResult.rows.length > 0) {
                specName = specResult.rows[0].specialization;
            }
        } catch (specErr) {
            console.error('[PublicTeleconsult] Error fetching specialization name:', specErr.message);
        }

        const amount = CONSULTATION_PRICES[specName] || CONSULTATION_PRICES['Default'];
        console.log(`[PublicTeleconsult] Specialization: "${specName}", Price: KES ${amount}`);

        // ---- FORMAT PHONE ----
        let formattedPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('254')) {
            formattedPhone = '254' + formattedPhone;
        }
        console.log('[PublicTeleconsult] Formatted phone:', formattedPhone);

        // ---- BUILD APPOINTMENT DATA (stored in mpesa_transactions for callback) ----
        const appointmentData = {
            is_public_booking: true,  // Flag for callback to use public flow
            is_return_patient: !!is_return_patient,
            reg_number: reg_number || null,
            dob: dob || null,
            parent_first_name: parent_first_name || null,
            parent_last_name: parent_last_name || null,
            parent_phone: parent_phone || phone,
            parent_email: parent_email || null,
            child_first_name: child_first_name || null,
            child_last_name: child_last_name || null,
            child_dob: child_dob || null,
            child_gender: child_gender || 'Male',
            specialization_id,
            appointment_date,
            appointment_time,
            appointment_type: 'TELECONSULT',
            reason: reason || null
        };

        // ---- INITIATE STK PUSH ----
        console.log('[PublicTeleconsult] Initiating STK Push...');
        const token = await getMpesaAccessToken();

        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const passkey = process.env.MPESA_PASSKEY;
        const shortcode = process.env.MPESA_SHORTCODE;
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        const stkUrl = process.env.MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        // Generate AccountReference
        let accountRef = 'BCC-WEB';
        if (child_first_name) {
            accountRef = `BCC-${child_first_name.replace(/[^a-zA-Z]/g, '').substring(0, 7)}`;
        } else if (reg_number) {
            accountRef = `BCC-${reg_number.substring(0, 8)}`;
        }

        const stkRequest = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(Number(amount)),
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: accountRef.substring(0, 12).toUpperCase(),
            TransactionDesc: `${specName} Teleconsult`
        };

        console.log('[PublicTeleconsult] STK Request:', JSON.stringify({
            ...stkRequest,
            Password: '***HIDDEN***'
        }, null, 2));

        const stkResponse = await axios.post(stkUrl, stkRequest, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const checkoutRequestId = stkResponse.data.CheckoutRequestID;
        const merchantRequestId = stkResponse.data.MerchantRequestID;

        console.log('[PublicTeleconsult] STK Push SUCCESS');
        console.log('[PublicTeleconsult] CheckoutRequestID:', checkoutRequestId);
        console.log('[PublicTeleconsult] MerchantRequestID:', merchantRequestId);

        // ---- SAVE TO DB ----
        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO mpesa_transactions 
                 (checkout_request_id, merchant_request_id, amount, phone, status, appointment_data, reference_id)
                 VALUES ($1, $2, $3, $4, 'pending', $5, $6)`,
                [checkoutRequestId, merchantRequestId, amount, formattedPhone, JSON.stringify(appointmentData), `PUBLIC-${Date.now()}`]
            );
            console.log('[PublicTeleconsult] Transaction saved to DB');
        } finally {
            client.release();
        }

        // ---- RESPOND ----
        res.json({
            success: true,
            message: 'STK Push sent to your phone. Please enter your M-Pesa PIN to complete payment.',
            checkout_request_id: checkoutRequestId,
            merchant_request_id: merchantRequestId,
            amount,
            specialization: specName
        });

    } catch (error) {
        console.error('[PublicTeleconsult] ERROR:', error.response?.data || error.message);
        console.error('[PublicTeleconsult] Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate payment',
            error: error.response?.data || error.message
        });
    }
};

/**
 * Get Consultation Prices (Public)
 * Returns the price list for teleconsultation services
 */
exports.getConsultationPrices = async (req, res) => {
    console.log('[PublicTeleconsult] Price list requested');
    res.json({
        success: true,
        prices: CONSULTATION_PRICES,
        currency: 'KES',
        note: 'Prices are for teleconsultation services. In-person bookings do not require prepayment.'
    });
};
