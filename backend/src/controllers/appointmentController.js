const { pool } = require('../config/database');
const { externalQuery, externalPool } = require('../config/externalDatabase'); // Updated import to include externalPool
const googleCalendarService = require('../services/googleCalendarService');

// Helper: Check if date is weekend
const isWeekend = (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
};

// Helper: Check if time is within working hours (8am-5pm)
const isWithinWorkingHours = (time) => {
    const [hours] = time.split(':').map(Number);
    return hours >= 8 && hours < 17; // 8am to 4pm (last slot at 4pm for 1hr appointment)
};

// Helper: Generate time slots for a day
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        slots.push(time);
    }
    return slots; // ['08:00', '09:00', ..., '16:00']
};

// Helper: Check if date/time is in the past
const isPastTime = (dateStr, timeStr) => {
    const today = new Date();
    const checkDate = new Date(dateStr);

    // Reset times for date comparison
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const checkZero = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

    if (checkZero < todayZero) return true;
    if (checkZero > todayZero) return false;

    // If same day, check time
    const [hours, minutes] = timeStr.split(':').map(Number);
    const nowHours = today.getHours();
    const nowMinutes = today.getMinutes();

    if (hours < nowHours) return true;
    if (hours === nowHours && minutes <= nowMinutes) return true;

    return false;
};

// Get all available doctors
exports.getAvailableDoctors = async (req, res) => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT id, name, specialty, email, phone, photo_url, bio
            FROM doctors
            WHERE is_available = true
            ORDER BY specialty, name;
        `;

        const result = await client.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Server error fetching doctors' });
    } finally {
        client.release();
    }
};

// Get available time slots for a specific doctor on a specific date (External DB)
exports.getDoctorAvailability = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        // Check if date is weekend
        if (isWeekend(date)) {
            return res.json({ available: false, reason: 'Weekends are not available', slots: [] });
        }

        // Check if doctor exists in external DB (using staff table)
        const doctorCheck = await externalQuery(
            `SELECT id, fullname FROM staff WHERE id = $1`,
            [doctorId]
        );

        if (doctorCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Check doctor daily limit (max 10 appointments)
        const dailyCountResult = await externalQuery(
            `SELECT COUNT(*) as count FROM appointments WHERE staff_id = $1 AND appointment_date = $2`,
            [doctorId, date]
        );

        if (parseInt(dailyCountResult.rows[0].count) >= 10) {
            return res.json({ available: false, reason: 'Doctor has reached daily appointment limit', slots: [] });
        }

        // Get all booked appointments for this doctor on this date from External DB
        // Note: External DB uses start_time and end_time
        const bookedSlots = await externalQuery(`
            SELECT start_time, end_time
            FROM appointments
            WHERE (staff_id = $1 OR doctor_id = $1)
            AND appointment_date = $2 
            AND status != 'cancelled'
        `, [doctorId, date]);

        const bookedTimes = bookedSlots.rows.map(row => row.start_time.substring(0, 5));

        // Generate all possible slots and filter out booked ones
        const allSlots = generateTimeSlots();
        let availableSlots = allSlots.filter(slot => {
            // Simple check: exact match of start time (since we currently use fixed 1hr slots)
            return !bookedTimes.includes(slot);
        });

        // Filter out past slots if date is today
        availableSlots = availableSlots.filter(slot => !isPastTime(date, slot));

        res.json({
            available: availableSlots.length > 0,
            date,
            slots: availableSlots
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ error: 'Server error checking availability' });
    }
};

// Create new appointment (External DB)
exports.createAppointment = async (req, res) => {
    const client = await pool.connect(); // Keep local connection for local child lookup
    let externalClient = null;

    try {
        const userId = req.user.id;
        // Use req.user directly instead of querying local table
        const user = req.user;

        const {
            doctorId,
            childId,
            appointmentDate,
            appointmentTime,
            reason,
            notes,
            appointmentType = 'IN_PERSON' // Default to in-person
        } = req.body;

        // Validation
        if (!doctorId || !appointmentDate || !appointmentTime || !childId) {
            return res.status(400).json({
                error: 'Doctor, Child, Date, and Time are required'
            });
        }

        // Validate appointment type
        const validTypes = ['IN_PERSON', 'TELECONSULT'];
        if (!validTypes.includes(appointmentType)) {
            return res.status(400).json({
                error: 'Invalid appointment type. Must be IN_PERSON or TELECONSULT'
            });
        }

        // 1. Resolve External Child ID
        // Fetch local child first to get registration number
        const localChildCheck = await client.query(
            'SELECT registration_number, first_name, last_name, date_of_birth, gender FROM children WHERE id = $1 AND parent_id = $2',
            [childId, userId]
        );

        if (localChildCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Child not found or unauthorized' });
        }

        let childRegNumber = localChildCheck.rows[0].registration_number;
        const localChild = localChildCheck.rows[0];
        let childFullName = `${localChild.first_name} ${localChild.last_name}`;

        if (!user) return res.status(500).json({ error: 'User profile not found' });

        // Helper to split display name
        const getNames = (displayName) => {
            const parts = (displayName || '').split(' ');
            const first = parts[0] || 'Guest';
            const last = parts.length > 1 ? parts.slice(1).join(' ') : 'Parent';
            return { first, last };
        };

        // GUEST FLOW Check:
        // If child has NO registration number, we must perform the "Guest Booking Database Logic" transaction.
        if (!childRegNumber) {
            console.log(`[Appointment] Child ${childId} has no reg number. Initiating Guest Booking Transaction.`);

            // Strict Validation for Guest Booking: Parent MUST have a phone number
            if (!user.phone_number || user.phone_number.trim() === '') {
                return res.status(400).json({
                    error: 'Phone number is required. Please update your profile in Settings.'
                });
            }

            // --- BEGIN TRANSACTION ---
            externalClient = await externalPool.connect();
            await externalClient.query('BEGIN');

            try {
                // Step A: Check or Create Parent (Table: parents)
                console.log(`[Appointment] Checking parent: Phone=${user.phone_number}, Email=${user.email}`);

                // Check: Does a parent with the given telephone OR email already exist?
                // Using LOWER(email) to handle case-sensitivity issues
                const parentCheck = await externalClient.query(
                    'SELECT id FROM parents WHERE telephone = $1 OR LOWER(email) = LOWER($2)',
                    [user.phone_number, user.email]
                );

                let externalParentId;
                if (parentCheck.rows.length > 0) {
                    externalParentId = parentCheck.rows[0].id;
                    console.log(`[Appointment] Found existing parent ID: ${externalParentId}`);
                } else {
                    console.log(`[Appointment] Creating NEW parent record...`);
                    const { first, last } = getNames(user.display_name);
                    const fullnameJson = JSON.stringify({ first_name: first, last_name: last });

                    // relationship_id: 1 (Default), gender_id: 2 (Female default - mapping simplified as requested)
                    const insertParentQuery = `
                        INSERT INTO parents (fullname, telephone, email, relationship_id, gender_id, created_at, updated_at)
                        VALUES ($1, $2, $3, 1, 2, NOW(), NOW())
                        RETURNING id
                    `;
                    const newParent = await externalClient.query(insertParentQuery, [fullnameJson, user.phone_number, user.email]);
                    externalParentId = newParent.rows[0].id;
                }

                // Step B: Create Guest Child (Table: children)
                // Format: GUEST-{timestamp}-{random}
                const timestamp = Math.floor(Date.now() / 1000);
                const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
                const generatedRegNumber = `GUEST-${timestamp}-${random}`;
                const childFullnameJson = JSON.stringify({ first_name: localChild.first_name, last_name: localChild.last_name });

                // gender_id: 1 (Male), 2 (Female). Simple map:
                const genderId = (localChild.gender || '').toLowerCase() === 'male' ? 1 : 2;

                const insertChildQuery = `
                    INSERT INTO children (fullname, dob, gender_id, registration_number, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                    RETURNING id
                `;
                const newChild = await externalClient.query(insertChildQuery, [
                    childFullnameJson,
                    localChild.date_of_birth,
                    genderId,
                    generatedRegNumber
                ]);
                const externalChildId = newChild.rows[0].id;

                // Step C: Link Parent & Child (Table: child_parent)
                await externalClient.query(
                    'INSERT INTO child_parent (parent_id, child_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
                    [externalParentId, externalChildId]
                );

                // Step D: Create Appointment (Table: appointments)
                const appointmentTitle = `[NEW PATIENT] ${childFullName}`;

                // Calculate end time (1 hour duration)
                const [hours, minutes] = appointmentTime.split(':').map(Number);
                const endHour = hours + 1;
                const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                const insertAppsQuery = `
                    INSERT INTO appointments (
                        appointment_title, appointment_date, start_time, end_time, 
                        staff_id, doctor_id, child_id, status, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW(), NOW())
                    RETURNING *
                `;

                // staff_id: 1 (Default), doctor_id: from request
                const appResult = await externalClient.query(insertAppsQuery, [
                    appointmentTitle,
                    appointmentDate,
                    appointmentTime,
                    endTime,
                    1, // Default staff_id
                    doctorId,
                    externalChildId
                ]);

                // Step E: Update Local Child with Generated Registration Number
                await externalClient.query('COMMIT');

                // Update Local Child
                await client.query(
                    'UPDATE children SET registration_number = $1 WHERE id = $2',
                    [generatedRegNumber, childId]
                );

                return res.status(201).json({
                    message: 'Appointment request sent successfully',
                    appointment: appResult.rows[0],
                    child_registration_number: generatedRegNumber,
                    details: 'This appointment is now pending approval via the clinic system.'
                });

            } catch (transactionError) {
                await externalClient.query('ROLLBACK');
                console.error('Guest booking transaction failed:', transactionError);
                throw transactionError; // Re-throw to be caught by outer catch
            } finally {
                externalClient.release();
            }

        } else {
            // STANDARD FLOW (Existing Logic simplified/adapted)
            // Child ALREADY has a registration number => Use it to find external ID

            // Lookup child in External DB using Registration Number
            const externalChildCheck = await externalQuery(
                'SELECT id, fullname FROM children WHERE registration_number = $1',
                [childRegNumber]
            );

            if (externalChildCheck.rows.length === 0) {
                return res.status(404).json({
                    error: `Child with Registration Number ${childRegNumber} not found in clinic system`
                });
            }
            const externalChildId = externalChildCheck.rows[0].id;

            // Generate Title
            let appointmentTitle = childFullName;

            // Check Conflicts
            const conflictCheck = await externalQuery(`
                SELECT * FROM appointments
                WHERE (staff_id = $1 OR doctor_id = $1)
                  AND appointment_date = $2 
                  AND start_time = $3
                  AND status != 'cancelled'
            `, [doctorId, appointmentDate, appointmentTime]);

            if (conflictCheck.rows.length > 0) {
                return res.status(409).json({ error: 'This time slot is already booked.' });
            }

            // Calculate End Time
            const [hours, minutes] = appointmentTime.split(':').map(Number);
            const endHour = hours + 1;
            const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

            // Insert Appointment
            const insertQuery = `
                INSERT INTO appointments (
                    child_id, staff_id, doctor_id, 
                    appointment_title, appointment_date, 
                    start_time, end_time, status,
                    appointment_type, 
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), NOW())
                RETURNING *
            `;

            const result = await externalQuery(insertQuery, [
                externalChildId,        // $1
                1,                      // $2 Staff ID (Default 1 if not known) - Or use doctorId? Report said "1 (Or ID of the staff creating it)"
                doctorId,               // $3 Doctor ID
                appointmentTitle,       // $4
                appointmentDate,        // $5
                appointmentTime,        // $6
                endTime,                // $7
                appointmentType         // $8
            ]);

            return res.status(201).json({
                message: 'Appointment request sent successfully',
                appointment: result.rows[0],
                details: 'This appointment is now pending approval via the clinic system.'
            });
        }

    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Server error creating appointment', details: error.message });
    } finally {
        client.release();
        if (externalClient) {
            // externalClient.release() was called in finally block above
        }
    }
};


// Get user's appointments (External DB)
exports.getUserAppointments = async (req, res) => {
    const client = await pool.connect(); // Keep local connection for local child lookup
    try {
        const userId = req.user.id;
        const { status, childId } = req.query;

        const uniqueExternalChildIds = new Set();
        let regNumbers = [];

        if (childId) {
            // STRATEGY A: Specific Child Requested
            // 1. Get Registration Number for this SPECIFIC child
            const childResult = await client.query(
                'SELECT registration_number FROM children WHERE id = $1 AND parent_id = $2 AND registration_number IS NOT NULL',
                [childId, userId]
            );

            if (childResult.rows.length > 0) {
                regNumbers.push(childResult.rows[0].registration_number);
            }
            // If child has no local reg number, we still proceed with empty list (returns []) 
            // because strict filtering means "for THIS child only". 
            // We skip Strategy 2 (Fallback) intentionally.

        } else {
            // STRATEGY B: All Children (Default behavior)
            // 1. Get Local Registration Numbers for ALL children
            const childrenResult = await client.query(
                'SELECT registration_number FROM children WHERE parent_id = $1 AND registration_number IS NOT NULL',
                [userId]
            );
            regNumbers = childrenResult.rows.map(row => row.registration_number);
        }

        // 2a. Find External Children by Registration Number (Primary)
        if (regNumbers.length > 0) {
            const childrenByReg = await externalQuery(
                `SELECT id FROM children WHERE registration_number = ANY($1)`,
                [regNumbers]
            );
            childrenByReg.rows.forEach(row => uniqueExternalChildIds.add(row.id));
        }

        // 2b. Fallback Strategy (Phone/Email) - ONLY if NO specific childId was requested
        // If childId IS provided, skip this to respect the filter.
        if (!childId && (req.user.phone_number || req.user.email)) {
            // Find external parent profile
            const externalParentCheck = await externalQuery(
                `SELECT id FROM parents WHERE telephone = $1`,
                [req.user.phone_number]
            );

            if (externalParentCheck.rows.length > 0) {
                const externalParentIds = externalParentCheck.rows.map(row => row.id);
                const childrenByParent = await externalQuery(
                    `SELECT child_id FROM child_parent WHERE parent_id = ANY($1)`,
                    [externalParentIds]
                );
                childrenByParent.rows.forEach(row => uniqueExternalChildIds.add(row.child_id));
            } else {
                // Fallback to legacy 'users' table check for migration/standard users
                const standardParentCheck = await externalQuery(
                    `SELECT id FROM users WHERE phone_number = $1 OR email = $2`,
                    [req.user.phone_number, req.user.email]
                );
                if (standardParentCheck.rows.length > 0) {
                    const stdParentIds = standardParentCheck.rows.map(r => r.id);
                    const stdChildren = await externalQuery(
                        `SELECT id FROM children WHERE parent_id = ANY($1)`,
                        [stdParentIds]
                    );
                    stdChildren.rows.forEach(r => uniqueExternalChildIds.add(r.id));
                }
            }
        }

        // 3. If no children found in external DB, return empty
        if (uniqueExternalChildIds.size === 0) {
            return res.json([]);
        }

        const externalChildIds = Array.from(uniqueExternalChildIds);

        // 4. Fetch Appointments from External DB
        let query = `
            SELECT 
                a.id,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as appointment_date,
                a.start_time as appointment_time,
                a.status,
                a.created_at,
                a.staff_id,
                a.doctor_id,
                a.appointment_type,
                a.google_meet_link,
                s.fullname as doctor_name,
                ds.specialization as doctor_specialty,
                s.email as doctor_email,
                c.fullname as child_fullname,
                c.registration_number
            FROM appointments a
            JOIN children c ON a.child_id = c.id
            JOIN staff s ON a.staff_id = s.id
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE a.child_id = ANY($1)
        `;

        const params = [externalChildIds];

        if (status) {
            query += ' AND a.status = $2';
            params.push(status);
        }

        query += ' ORDER BY a.appointment_date DESC, a.start_time DESC';

        const appointmentsResult = await externalQuery(query, params);

        // 5. Format Response to match frontend expectations
        const formattedAppointments = appointmentsResult.rows.map(appt => {
            const parseName = (nameField) => {
                if (!nameField) return 'Unknown';
                try {
                    if (typeof nameField === 'string' && nameField.startsWith('{')) {
                        const parsed = JSON.parse(nameField);
                        return `${parsed.first_name || ''} ${parsed.last_name || ''}`.trim();
                    }
                    if (typeof nameField === 'object') {
                        return `${nameField.first_name || ''} ${nameField.last_name || ''}`.trim();
                    }
                } catch (e) { }
                return nameField;
            };

            const formatted = {
                id: appt.id,
                appointment_date: appt.appointment_date, // Now correctly formatted string YYYY-MM-DD
                appointment_time: appt.appointment_time,
                status: appt.status,
                doctor_name: parseName(appt.doctor_name),
                doctor_specialty: appt.doctor_specialty || 'General',
                child_name: parseName(appt.child_fullname),
                doctor_id: appt.doctor_id || appt.staff_id,
                doctor_photo: null,
                appointment_type: appt.appointment_type || 'IN_PERSON',
                google_meet_link: appt.google_meet_link || null
            };

            if (appt.status === 'canceled' || appt.status === 'rejected') {
                formatted.status = 'cancelled';
            }
            return formatted;
        });

        res.json(formattedAppointments);

    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Server error fetching appointments', details: error.message });
    } finally {
        client.release();
    }
};

// Cancel appointment (External DB)
exports.cancelAppointment = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const { appointmentId } = req.params;

        // 1. Verification: Does this appointment belong to a child owned by the user?
        // This is complex because we need to:
        // A. Get local children -> Reg Numbers
        // B. Get External Child IDs -> Verify appointment.child_id is in this list.

        // A. Get local children
        const localChildrenResult = await client.query(
            'SELECT registration_number FROM children WHERE parent_id = $1 AND registration_number IS NOT NULL',
            [userId]
        );

        const regNumbers = localChildrenResult.rows.map(c => c.registration_number);

        if (regNumbers.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or unauthorized' });
        }

        // B. Get External Child IDs
        const externalChildrenResult = await externalQuery(
            `SELECT id FROM children WHERE registration_number = ANY($1)`,
            [regNumbers]
        );

        const externalChildIds = externalChildrenResult.rows.map(c => c.id);

        if (externalChildIds.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or unauthorized' });
        }

        // C. Check Appointment Ownership and get calendar event ID
        const checkQuery = `
            SELECT id, status, appointment_type, google_calendar_event_id 
            FROM appointments 
            WHERE id = $1 AND child_id = ANY($2)
        `;
        const checkResult = await externalQuery(checkQuery, [appointmentId, externalChildIds]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or unauthorized' });
        }

        const appointment = checkResult.rows[0];

        if (appointment.status === 'cancelled' || appointment.status === 'cancelled') {
            return res.status(400).json({ error: 'Appointment is already cancelled' });
        }

        // 2. Delete Google Calendar event if this is a teleconsult appointment
        if (appointment.appointment_type === 'TELECONSULT' && appointment.google_calendar_event_id) {
            try {
                googleCalendarService.initialize();
                if (googleCalendarService.isConfigured()) {
                    await googleCalendarService.deleteCalendarEvent(appointment.google_calendar_event_id);
                    console.log(`Deleted Google Calendar event: ${appointment.google_calendar_event_id}`);
                }
            } catch (calendarError) {
                // Log but don't fail the cancellation - the calendar event deletion is best-effort
                console.error('Failed to delete Google Calendar event:', calendarError.message);
            }
        }

        // 3. Cancel Appointment in External DB
        // IMPORTANT: Use 'cancelled' (British English with double 'l') to match Laravel/Clinic system
        const updateQuery = `
            UPDATE appointments 
            SET status = 'cancelled', updated_at = NOW()
            WHERE id = $1
            RETURNING *;
        `;
        const result = await externalQuery(updateQuery, [appointmentId]);

        // Normalize response for frontend
        const updatedAppointment = result.rows[0];
        // Status is already 'cancelled' from the UPDATE query

        res.json({ message: 'Appointment cancelled successfully', appointment: updatedAppointment });

    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ error: 'Server error cancelling appointment' });
    } finally {
        client.release();
    }
};

// Delete appointment - Only allow for past/cancelled appointments (for clearing history)
exports.deleteAppointment = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const { appointmentId } = req.params;

        // 1. Get user's children registration numbers
        const localChildrenResult = await client.query(
            'SELECT registration_number FROM children WHERE parent_id = $1 AND registration_number IS NOT NULL',
            [userId]
        );

        const regNumbers = localChildrenResult.rows.map(c => c.registration_number);
        if (regNumbers.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or unauthorized' });
        }

        // 2. Get external child IDs
        const externalChildrenResult = await externalQuery(
            `SELECT id FROM children WHERE registration_number = ANY($1)`,
            [regNumbers]
        );

        const externalChildIds = externalChildrenResult.rows.map(c => c.id);
        if (externalChildIds.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or unauthorized' });
        }

        // 3. Check appointment ownership and status
        const checkQuery = `
            SELECT id, status, appointment_date 
            FROM appointments 
            WHERE id = $1 AND child_id = ANY($2)
        `;
        const checkResult = await externalQuery(checkQuery, [appointmentId, externalChildIds]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or unauthorized' });
        }

        const appointment = checkResult.rows[0];

        // 4. Only allow deletion of cancelled or past appointments
        const isPast = new Date(appointment.appointment_date) < new Date();
        const isCancelled = appointment.status === 'cancelled' || appointment.status === 'canceled';

        if (!isPast && !isCancelled) {
            return res.status(400).json({
                error: 'Cannot delete upcoming appointments. Please cancel first.'
            });
        }

        // 5. Delete the appointment
        const deleteQuery = `DELETE FROM appointments WHERE id = $1 RETURNING id`;
        await externalQuery(deleteQuery, [appointmentId]);

        res.json({ message: 'Appointment deleted successfully', appointmentId });

    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ error: 'Server error deleting appointment' });
    } finally {
        client.release();
    }
};

// Create a guest appointment - writes directly to external database
exports.createGuestAppointment = async (req, res) => {
    // 1. Initialize DB Clients
    const client = await pool.connect(); // LOCAL DB connection (for updating reg number)
    let externalClient = null;           // EXTERNAL DB connection (for transaction)

    try {
        const {
            parent_first_name,
            parent_last_name,
            parent_phone,
            parent_email,
            parent_gender,
            child_first_name,
            child_last_name,
            child_dob,
            child_gender,
            local_child_id, // Get local ID from request
            doctor_id,
            appointment_date,
            start_time,
            end_time
        } = req.body;

        // Validate required fields
        const errors = {};
        if (!parent_first_name) errors.parent_first_name = ['Parent first name is required'];
        if (!parent_last_name) errors.parent_last_name = ['Parent last name is required'];
        if (!parent_phone) errors.parent_phone = ['Parent phone is required'];
        if (!child_first_name) errors.child_first_name = ['Child first name is required'];
        if (!child_last_name) errors.child_last_name = ['Child last name is required'];
        if (!child_dob) errors.child_dob = ['Child date of birth is required'];
        if (!child_gender) errors.child_gender = ['Child gender is required'];
        if (!doctor_id) errors.doctor_id = ['Doctor is required'];
        if (!appointment_date) errors.appointment_date = ['Appointment date is required'];
        if (!start_time) errors.start_time = ['Start time is required'];

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Calculate end_time if not provided (1 hour default)
        const finalEndTime = end_time || (() => {
            const [hours, minutes] = start_time.split(':');
            const endHour = (parseInt(hours) + 1).toString().padStart(2, '0');
            return `${endHour}:${minutes}`;
        })();

        console.log('[GuestAppointment] Creating guest appointment via Direct DB Write (Strict Mode)');

        // Helper to get gender ID
        const getGenderId = async (genderName) => {
            if (!genderName) return 1; // Default to 1 (Male/Unknown) as per spec
            try {
                const res = await externalQuery('SELECT id FROM gender WHERE LOWER(gender) = LOWER($1)', [genderName]);
                if (res.rows.length > 0) return res.rows[0].id;
                const map = { 'male': 1, 'female': 2 };
                return map[genderName.toLowerCase()] || 1;
            } catch (e) {
                console.error('Error fetching gender ID:', e);
                return 1;
            }
        };

        const parentGenderId = await getGenderId(parent_gender);
        const childGenderId = await getGenderId(child_gender);

        // Relationship ID: Set to 1 (System default for this flow)
        const relationshipId = 1;

        // --- BEGIN EXTERNAL TRANSACTION ---
        externalClient = await externalPool.connect();
        await externalClient.query('BEGIN');

        try {
            // Step A: Check or Create Parent
            let parentId = null;
            // Check by Phone OR Email (case-insensitive)
            const parentCheck = await externalClient.query(
                'SELECT id FROM parents WHERE telephone = $1 OR ($2::text IS NOT NULL AND LOWER(email) = LOWER($2))',
                [parent_phone, parent_email]
            );

            if (parentCheck.rows.length > 0) {
                parentId = parentCheck.rows[0].id;
                console.log('[GuestAppointment] Found existing parent:', parentId);

                // Update existing parent with latest details
                // We update phone and email to ensure they are current
                await externalClient.query(
                    `UPDATE parents 
                     SET telephone = $1, 
                         email = COALESCE($2, email), 
                         updated_at = NOW() 
                     WHERE id = $3`,
                    [parent_phone, parent_email, parentId]
                );
            } else {
                const parentFullname = JSON.stringify({
                    first_name: parent_first_name,
                    middle_name: "",
                    last_name: parent_last_name
                });

                const insertParentQuery = `
                    INSERT INTO parents (fullname, telephone, email, gender_id, relationship_id, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                    RETURNING id
                `;

                const newParent = await externalClient.query(insertParentQuery, [
                    parentFullname,
                    parent_phone,
                    parent_email || null,
                    parentGenderId,
                    relationshipId
                ]);
                parentId = newParent.rows[0].id;
                console.log('[GuestAppointment] Created new parent:', parentId);
            }

            // Step B: Create Guest Child (Table: children)
            // Always create a new child record for guest flow if it doesn't match exactly by name/dob/parent
            // But logic says we should try to match first. 

            // Check existing child for this parent
            const childCheckQuery = `
                SELECT c.id, c.registration_number
                FROM children c
                JOIN child_parent cp ON c.id = cp.child_id
                WHERE cp.parent_id = $1 
                AND c.dob = $2
                AND c.fullname::jsonb->>'first_name' = $3
                AND c.fullname::jsonb->>'last_name' = $4
            `;

            let childId = null;
            let isNewChild = false;
            let generatedRegNumber = null;

            const existingChild = await externalClient.query(childCheckQuery, [
                parentId,
                child_dob,
                child_first_name,
                child_last_name
            ]);

            if (existingChild.rows.length > 0) {
                childId = existingChild.rows[0].id;
                generatedRegNumber = existingChild.rows[0].registration_number;
                console.log('[GuestAppointment] Found existing child match:', childId);
            } else {
                // Create New Child
                // Format: GUEST-{timestamp}-{random}
                const timestamp = Math.floor(Date.now() / 1000);
                const random = Math.floor(1000 + Math.random() * 9000);
                generatedRegNumber = `GUEST-${timestamp}-${random}`;

                const childFullnameJson = JSON.stringify({
                    first_name: child_first_name,
                    middle_name: "",
                    last_name: child_last_name
                });

                const insertChildQuery = `
                    INSERT INTO children (fullname, dob, gender_id, registration_number, insurance_provider_id, insurance_number, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, NULL, NULL, NOW(), NOW())
                    RETURNING id
                `;

                const newChild = await externalClient.query(insertChildQuery, [
                    childFullnameJson,
                    child_dob,
                    childGenderId,
                    generatedRegNumber
                ]);
                childId = newChild.rows[0].id;
                isNewChild = true;
                console.log('[GuestAppointment] Created new child:', childId, 'with reg:', generatedRegNumber);
            }

            // Step C: Link Parent & Child
            if (isNewChild) {
                const linkQuerySimple = `
                    INSERT INTO child_parent (parent_id, child_id, created_at, updated_at)
                    VALUES ($1, $2, NOW(), NOW())
                `;
                await externalClient.query(linkQuerySimple, [parentId, childId]);
            }

            // Step D: Create Appointment
            const appointmentTitle = `[NEW PATIENT] ${child_first_name} ${child_last_name}`;

            const insertAppointmentQuery = `
                INSERT INTO appointments (
                    child_id, doctor_id, staff_id,
                    appointment_title, appointment_date,
                    start_time, end_time,
                    status, appointment_type,
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'IN_PERSON', NOW(), NOW())
                RETURNING *
            `;

            const appointmentResult = await externalClient.query(insertAppointmentQuery, [
                childId,
                doctor_id,
                1, // staff_id default
                appointmentTitle,
                appointment_date,
                start_time,
                finalEndTime
            ]);

            const appointmentId = appointmentResult.rows[0].id;

            // COMMIT TRANSACTION
            await externalClient.query('COMMIT');
            console.log('[GuestAppointment] External Transaction Committed.');

            // Step E: Update Local DB Child Record (if local_child_id provided)
            // This ensures the local app sees the new GUEST registration number
            if (local_child_id && generatedRegNumber) {
                try {
                    console.log(`[GuestAppointment] Updating local child ${local_child_id} with reg: ${generatedRegNumber}`);
                    await client.query(
                        'UPDATE children SET registration_number = $1 WHERE id = $2',
                        [generatedRegNumber, local_child_id]
                    );
                } catch (localError) {
                    console.error('[GuestAppointment] Failed to update local child record:', localError);
                    // We don't fail the request because the appointment is booked, but we log the error.
                }
            }

            res.status(201).json({
                success: true,
                message: 'Appointment booked successfully',
                data: {
                    appointment_id: appointmentId,
                    child_id: childId,
                    registration_number: generatedRegNumber
                }
            });

        } catch (transactionError) {
            await externalClient.query('ROLLBACK');
            throw transactionError;
        }

    } catch (error) {
        console.error('Error creating guest appointment:', error);
        res.status(500).json({
            success: false,
            error: 'Server error creating guest appointment',
            message: error.message
        });
    } finally {
        client.release(); // Release LOCAL connection
        if (externalClient) {
            externalClient.release(); // Release EXTERNAL connection
        }
    }
};
