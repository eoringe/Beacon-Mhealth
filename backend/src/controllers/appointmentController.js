const { pool } = require('../config/database');
const { externalQuery } = require('../config/externalDatabase');
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

// Get available time slots for a specific doctor on a specific date
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
    try {
        const userId = req.user.id;
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

        let externalChildId = null;
        let childFullName = `${localChildCheck.rows[0].first_name} ${localChildCheck.rows[0].last_name}`;
        const childRegNumber = localChildCheck.rows[0].registration_number;

        if (childRegNumber) {
            // Lookup child in External DB using Registration Number to get Real External ID
            const externalChildCheck = await externalQuery(
                'SELECT id, fullname FROM children WHERE registration_number = $1',
                [childRegNumber]
            );

            if (externalChildCheck.rows.length === 0) {
                return res.status(404).json({
                    error: `Child with Registration Number ${childRegNumber} not found in clinic system`
                });
            }
            externalChildId = externalChildCheck.rows[0].id;
        } else {
            // Child has no registration number - Treat as Guest/New Patient in External DB
            console.log(`[Appointment] Child ${childId} has no reg number. Creating/Linking as guest in External DB.`);

            // 1. Get Parent Details from Local User
            const userResult = await client.query('SELECT first_name, last_name, phone_number, email, gender FROM users WHERE id = $1', [userId]);
            const user = userResult.rows[0];

            if (!user) {
                return res.status(500).json({ error: 'User profile not found' });
            }

            // 2. Find or Create External Parent (User)
            // Try to find by phone (primary) or email
            let externalParentId = null;
            const parentCheck = await externalQuery(
                'SELECT id FROM users WHERE phone_number = $1 OR email = $2',
                [user.phone_number, user.email]
            );

            if (parentCheck.rows.length > 0) {
                externalParentId = parentCheck.rows[0].id;
            } else {
                // Create new Guest/Provisional Parent in External DB
                const insertParentQuery = `
                    INSERT INTO users (first_name, last_name, phone_number, email, gender, password, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                    RETURNING id
                `;
                // Use a placeholder password or null
                try {
                    // Note: External DB 'users' schema might require fields we assume.
                    // We use the same assumption as the Guest Controller.
                    const newParent = await externalQuery(insertParentQuery, [
                        user.first_name || 'Guest',
                        user.last_name || 'Parent',
                        user.phone_number,
                        user.email || `guest_${Date.now()}@beacon.com`,
                        user.gender || 'Unknown',
                        'GUEST_LINKED_ACCOUNT'
                    ]);
                    externalParentId = newParent.rows[0].id;
                } catch (pError) {
                    console.error('Failed to create external parent:', pError);
                    return res.status(500).json({ error: 'Failed to synchronize parent profile with clinic system.' });
                }
            }

            // 3. Create External Child
            const localChild = localChildCheck.rows[0];
            const insertChildQuery = `
                INSERT INTO children (
                    parent_id, first_name, last_name, date_of_birth, gender, registration_number, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, NULL, NOW(), NOW())
                RETURNING id
            `;

            const newChild = await externalQuery(insertChildQuery, [
                externalParentId,
                localChild.first_name,
                localChild.last_name,
                localChild.date_of_birth,
                localChild.gender
            ]);

            externalChildId = newChild.rows[0].id;
        }

        // Generate Title based on appointment type
        let appointmentTitle = appointmentType === 'TELECONSULT'
            ? `Teleconsult: ${childFullName}`
            : childFullName;

        // 2. Business Logic Checks
        if (isWeekend(appointmentDate)) {
            return res.status(400).json({ error: 'Cannot book appointments on weekends' });
        }

        if (!isWithinWorkingHours(appointmentTime)) {
            return res.status(400).json({ error: 'Appointments are only available between 8:00 AM and 5:00 PM' });
        }

        if (isPastTime(appointmentDate, appointmentTime)) {
            return res.status(400).json({ error: 'Cannot book appointments in the past' });
        }

        // 3. Check Conflicts in External DB
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

        // 4. Calculate End Time (1 hour duration)
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const endHour = hours + 1;
        const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        // 5. Handle Teleconsultation - Create Google Calendar Event with Meet Link
        let googleMeetLink = null;
        let googleCalendarEventId = null;
        let idempotencyKey = null;

        if (appointmentType === 'TELECONSULT') {
            try {
                // Initialize Google Calendar service if not already done
                googleCalendarService.initialize();

                if (!googleCalendarService.isConfigured()) {
                    return res.status(503).json({
                        error: 'Teleconsultation service is not configured. Please contact support.'
                    });
                }

                // Generate idempotency key to prevent duplicate calendar events
                idempotencyKey = googleCalendarService.generateIdempotencyKey(
                    childId, doctorId, appointmentDate, appointmentTime
                );

                // Check if event already exists (for retry scenarios)
                const existingAppt = await externalQuery(
                    'SELECT google_meet_link, google_calendar_event_id FROM appointments WHERE idempotency_key = $1',
                    [idempotencyKey]
                );

                if (existingAppt.rows.length > 0 && existingAppt.rows[0].google_meet_link) {
                    // Return existing appointment info (idempotent)
                    return res.status(200).json({
                        message: 'Appointment already exists',
                        appointment: existingAppt.rows[0],
                        google_meet_link: existingAppt.rows[0].google_meet_link,
                        details: 'This is an existing appointment (duplicate request detected).'
                    });
                }

                // Get doctor name and specialization for calendar event
                const doctorResult = await externalQuery(
                    `SELECT s.fullname, ds.specialization 
                     FROM staff s
                     LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
                     WHERE s.id = $1`,
                    [doctorId]
                );

                let doctorName = 'Doctor';
                const staffData = doctorResult.rows[0];
                const rawName = staffData?.fullname;
                const specialization = staffData?.specialization || '';

                if (rawName) {
                    try {
                        if (typeof rawName === 'string' && rawName.startsWith('{')) {
                            const parsed = JSON.parse(rawName);
                            doctorName = `${parsed.first_name || ''} ${parsed.last_name || ''}`.trim();
                        } else if (typeof rawName === 'object') {
                            doctorName = `${rawName.first_name || ''} ${rawName.last_name || ''}`.trim();
                        } else {
                            doctorName = rawName;
                        }
                    } catch (e) {
                        doctorName = rawName;
                    }
                }

                // Add 'Dr.' prefix for Paediatricians if not already present
                if (specialization && /paediatrician|pediatrician/i.test(specialization)) {
                    // Check if name already starts with Dr (case insensitive, handling 'Dr ', 'Dr. ', etc)
                    if (!/^dr\.?\s+/i.test(doctorName)) {
                        doctorName = `Dr. ${doctorName}`;
                    }
                }

                // Get parent's email to invite them to the calendar event
                const userResult = await client.query(
                    'SELECT email FROM users WHERE id = $1',
                    [userId]
                );
                const parentEmail = userResult.rows[0]?.email;
                console.log(`Sending calendar invite to: ${parentEmail}`);

                // Create Google Calendar event with Meet link
                const eventResult = await googleCalendarService.createCalendarEvent({
                    summary: `Teleconsultation: ${childFullName} with ${doctorName}`,
                    description: `Pediatric teleconsultation appointment.\n\nPatient: ${childFullName}\nReason: ${reason || 'General consultation'}\nNotes: ${notes || 'None'}`,
                    date: appointmentDate,
                    startTime: appointmentTime,
                    endTime: endTime,
                    attendees: parentEmail ? [parentEmail] : []
                }, idempotencyKey);

                googleMeetLink = eventResult.meetLink;
                googleCalendarEventId = eventResult.eventId;

                if (!googleMeetLink) {
                    console.error('Google Meet link was not generated');
                    return res.status(503).json({
                        error: 'Failed to generate Google Meet link. Please try again.'
                    });
                }

                console.log(`Teleconsult appointment created with Meet link: ${googleMeetLink}`);

            } catch (calendarError) {
                console.error('Google Calendar API error:', calendarError);
                return res.status(503).json({
                    error: 'Failed to create teleconsultation. Google Calendar service unavailable.',
                    details: calendarError.message
                });
            }
        }

        // 6. Insert into External DB
        const insertQuery = `
            INSERT INTO appointments (
                child_id, staff_id, doctor_id, 
                appointment_title, appointment_date, 
                start_time, end_time, status,
                appointment_type, google_meet_link, google_calendar_event_id, idempotency_key,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, NOW(), NOW())
            RETURNING id, appointment_date, start_time, status, appointment_type, google_meet_link
        `;

        const result = await externalQuery(insertQuery, [
            externalChildId,        // $1 External Child ID
            doctorId,               // $2 Staff ID
            doctorId,               // $3 Doctor ID (Redundant but required)
            appointmentTitle,       // $4 Title
            appointmentDate,        // $5
            appointmentTime,        // $6 Start Time
            endTime,                // $7 End Time
            appointmentType,        // $8 Appointment Type
            googleMeetLink,         // $9 Google Meet Link (null for in-person)
            googleCalendarEventId,  // $10 Calendar Event ID (null for in-person)
            idempotencyKey          // $11 Idempotency Key (null for in-person)
        ]);

        const responseData = {
            message: 'Appointment request sent successfully',
            appointment: result.rows[0],
            details: appointmentType === 'TELECONSULT'
                ? 'Your teleconsultation is pending approval. Join via the Google Meet link at the scheduled time.'
                : 'This appointment is now pending approval via the clinic system.'
        };

        // Include Meet link prominently in response for teleconsult
        if (googleMeetLink) {
            responseData.google_meet_link = googleMeetLink;
        }

        res.status(201).json(responseData);

    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Server error creating appointment' });
    } finally {
        client.release();
    }
};


// Get user's appointments (External DB)
exports.getUserAppointments = async (req, res) => {
    const client = await pool.connect(); // Keep local connection for local child lookup
    try {
        const userId = req.user.id;
        const { status } = req.query;

        // 1. Get all local children for this user
        const localChildrenResult = await client.query(
            'SELECT id, registration_number, first_name, last_name FROM children WHERE parent_id = $1',
            [userId]
        );

        if (localChildrenResult.rows.length === 0) {
            return res.json([]); // No children, no appointments
        }

        // Filter children with registration numbers
        const childrenWithReg = localChildrenResult.rows.filter(c => c.registration_number);

        if (childrenWithReg.length === 0) {
            return res.json([]); // No linked children
        }

        const regNumbers = childrenWithReg.map(c => c.registration_number);

        // 2. Resolve to External Child IDs
        // Postgres ANY() expects an array
        const externalChildrenResult = await externalQuery(
            `SELECT id, registration_number, fullname FROM children WHERE registration_number = ANY($1)`,
            [regNumbers]
        );

        if (externalChildrenResult.rows.length === 0) {
            return res.json([]);
        }

        const externalChildIds = externalChildrenResult.rows.map(c => c.id);

        // 3. Fetch Appointments from External DB
        let query = `
            SELECT 
                a.id,
                a.appointment_date,
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

        // 4. Format Response to match frontend expectations
        // Frontend expects: doctor_name, doctor_specialty, child_name, etc.
        console.log('[Backend DEBUG] Raw appointmentsResult.rows:', JSON.stringify(appointmentsResult.rows.slice(0, 3), null, 2)); // Log first 3 raw appointments

        const formattedAppointments = appointmentsResult.rows.map(appt => {
            // DEBUG: Log raw IDs from the query result
            console.log(`[Backend DEBUG] Appointment ID: ${appt.id}, Raw staff_id: ${appt.staff_id}, Raw doctor_id: ${appt.doctor_id}, Child: ${appt.child_fullname}`);

            // Helper to parsing names from JSON or String
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
                appointment_date: appt.appointment_date,
                appointment_time: appt.appointment_time,
                status: appt.status,
                doctor_name: parseName(appt.doctor_name),
                doctor_specialty: appt.doctor_specialty || 'General',
                child_name: parseName(appt.child_fullname),
                doctor_id: appt.doctor_id || appt.staff_id, // Use real doctor_id, fallback to staff_id if null
                // Add dummy photo since external DB doesn't have it easily accessible yet
                doctor_photo: null,
                // Teleconsultation fields
                appointment_type: appt.appointment_type || 'IN_PERSON',
                google_meet_link: appt.google_meet_link || null
            };

            // Normalize status to 'cancelled' (British English with double L) to match clinic's Laravel system
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

        if (appointment.status === 'cancelled' || appointment.status === 'canceled') {
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

// Delete appointment (Blocked for External Data integrity, or implement soft delete)
exports.deleteAppointment = async (req, res) => {
    // Generally better to just allow cancellation. 
    // For now, we'll map delete to cancel or forbid it.
    // Let's forbid Hard Delete on external DB from mobile app for safety.
    res.status(403).json({ error: 'Permanently deleting appointments is not allowed. Please cancel instead.' });
};
