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

// Helper: Check if a slot falls within at least one availability window
const isTimeInWindows = (time, windows) => {
    if (!Array.isArray(windows) || windows.length === 0) return false;
    return windows.some(window => {
        const windowStart = window.start_time.substring(0, 5);
        const windowEnd = window.end_time.substring(0, 5);
        return time >= windowStart && time < windowEnd;
    });
};

// Helper: Normalize incoming appointment type values from query/body.
const normalizeAppointmentType = (value) => {
    if (!value) return 'IN_PERSON';
    const normalized = String(value).trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (normalized === 'INPERSON' || normalized === 'IN_PERSON') return 'IN_PERSON';
    if (normalized === 'TELECONSULT' || normalized === 'TELE_CONSULT') return 'TELECONSULT';
    return normalized;
};

// Helper: Check if doctor is unavailable on a specific date (external doctor_unavailabilities table)
const isDoctorUnavailableOnDate = async (doctorId, date) => {
    try {
        const result = await externalQuery(
            `SELECT reason FROM doctor_unavailabilities 
             WHERE doctor_id = $1 AND unavailable_date::date = $2::date`,
            [doctorId, date]
        );

        if (result.rows.length > 0) {
            return { unavailable: true, reason: result.rows[0].reason || 'Doctor is unavailable on this date' };
        }
        return { unavailable: false, reason: null };
    } catch (error) {
        console.error(`Error checking unavailability for doctor ${doctorId}:`, error);
        return { unavailable: false, reason: null }; // Default to available on error to prevent total block
    }
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

        // Check if date is weekend (Default working hours are Mon-Fri)
        if (isWeekend(date)) {
            return res.json({ available: false, reason: 'Weekends are not available', slots: [] });
        }

        const appointmentType = normalizeAppointmentType(req.query.appointmentType || req.query.appointment_type);
        const dayOfWeek = new Date(date).getDay(); // 0 (Sunday) - 6 (Saturday)

        // Check for doctor unavailability
        const unavailability = await isDoctorUnavailableOnDate(doctorId, date);
        if (unavailability.unavailable) {
            return res.json({
                available: false,
                reason: unavailability.reason,
                slots: []
            });
        }

        // Check if doctor exists in external DB (using staff table) and is active
        const doctorCheck = await externalQuery(
            `SELECT id, fullname FROM staff WHERE id = $1 AND is_active = true`,
            [doctorId]
        );

        if (doctorCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor not found or inactive' });
        }

        // IN-PERSON: doctor must be explicitly available via in_person windows for the day
        let inPersonWindows = [];
        if (appointmentType === 'IN_PERSON') {
            const inPersonResult = await externalQuery(
                `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities
                 WHERE doctor_id = $1 AND day_of_week = $2 AND window_type = 'in_person'`,
                [doctorId, dayOfWeek]
            );

            if (inPersonResult.rows.length === 0) {
                return res.json({
                    available: false,
                    reason: 'Doctor is not available for in-person visits on this day of the week',
                    slots: []
                });
            }
            inPersonWindows = inPersonResult.rows;
        }

        // TELECONSULTATION SPECIFIC: Check if doctor has tele-windows for this day
        let teleWindows = [];
        if (appointmentType === 'TELECONSULT') {
            const teleResult = await externalQuery(
                `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities 
                 WHERE doctor_id = $1 AND day_of_week = $2`,
                [doctorId, dayOfWeek]
            );

            if (teleResult.rows.length === 0) {
                return res.json({
                    available: false,
                    reason: 'Doctor is not available for teleconsultation on this day of the week',
                    slots: []
                });
            }
            teleWindows = teleResult.rows;
        }

        // Check doctor daily limit (max 10 appointments)
        const dailyCountResult = await externalQuery(
            `SELECT COUNT(*) as count FROM appointments WHERE (staff_id = $1 OR doctor_id = $1) AND appointment_date = $2`,
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
            // 1. Is it already booked?
            if (bookedTimes.includes(slot)) return false;

            // 2. If it's a teleconsult, does it fall within a tele-window?
            if (appointmentType === 'TELECONSULT') {
                return isTimeInWindows(slot, teleWindows);
            }

            // 3. In-person must also fall within configured in-person windows
            if (appointmentType === 'IN_PERSON') {
                return isTimeInWindows(slot, inPersonWindows);
            }

            return true;
        });

        // Filter out past slots if date is today
        availableSlots = availableSlots.filter(slot => !isPastTime(date, slot));

        res.json({
            available: availableSlots.length > 0,
            date,
            slots: availableSlots,
            appointmentType
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ error: 'Server error checking availability' });
    }
};

// Get available time slots for a specialization on a specific date (pools all doctors)
exports.getSpecializationAvailability = async (req, res) => {
    try {
        const { specializationId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        if (isWeekend(date)) {
            return res.json({ available: false, reason: 'Weekends are not available', slots: [] });
        }

        const appointmentType = normalizeAppointmentType(req.query.appointmentType || req.query.appointment_type);
        const dayOfWeek = new Date(date).getDay();

        // Find all active doctors with this specialization (many-to-many via staff_specialization)
        // DISTINCT ON (s.id): fullname is json — plain DISTINCT cannot compare json columns
        const doctorsResult = await externalQuery(
            `SELECT DISTINCT ON (s.id) s.id, s.fullname FROM staff s
             INNER JOIN staff_specialization ss ON ss.staff_id = s.id
             WHERE ss.specialization_id = $1 AND s.is_active = true
             ORDER BY s.id`,
            [specializationId]
        );

        if (doctorsResult.rows.length === 0) {
            return res.json({ available: false, reason: 'No doctors available for this specialization', slots: [] });
        }

        const doctorIds = doctorsResult.rows.map(d => d.id);
        const allSlots = generateTimeSlots();
        const availableSlotsSet = new Set();

        // For each doctor, find their available slots
        for (const docId of doctorIds) {
            // Check for doctor unavailability
            const unavailability = await isDoctorUnavailableOnDate(docId, date);
            if (unavailability.unavailable) continue;

            // IN-PERSON: Filter by explicit in_person windows
            let inPersonWindows = [];
            if (appointmentType === 'IN_PERSON') {
                const inPersonResult = await externalQuery(
                    `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities
                     WHERE doctor_id = $1 AND day_of_week = $2 AND window_type = 'in_person'`,
                    [docId, dayOfWeek]
                );
                if (inPersonResult.rows.length === 0) continue;
                inPersonWindows = inPersonResult.rows;
            }

            // TELECONSULTATION SPECIFIC: Filter by tele-windows
            let teleWindows = [];
            if (appointmentType === 'TELECONSULT') {
                const teleResult = await externalQuery(
                    `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities 
                     WHERE doctor_id = $1 AND day_of_week = $2`,
                    [docId, dayOfWeek]
                );
                if (teleResult.rows.length === 0) continue;
                teleWindows = teleResult.rows;
            }

            // Check daily limit
            const dailyCount = await externalQuery(
                `SELECT COUNT(*) as count FROM appointments WHERE (staff_id = $1 OR doctor_id = $1) AND appointment_date = $2`,
                [docId, date]
            );
            if (parseInt(dailyCount.rows[0].count) >= 10) continue;

            // Get booked slots for this doctor
            const bookedSlots = await externalQuery(`
                SELECT start_time FROM appointments
                WHERE (staff_id = $1 OR doctor_id = $1)
                AND appointment_date = $2
                AND status != 'cancelled'
            `, [docId, date]);

            const bookedTimes = bookedSlots.rows.map(row => row.start_time.substring(0, 5));

            // Add available slots to the union set
            allSlots.forEach(slot => {
                if (!bookedTimes.includes(slot)) {
                    if (appointmentType === 'TELECONSULT') {
                        const inWindow = isTimeInWindows(slot, teleWindows);
                        if (inWindow) availableSlotsSet.add(slot);
                    } else if (appointmentType === 'IN_PERSON') {
                        const inWindow = isTimeInWindows(slot, inPersonWindows);
                        if (inWindow) availableSlotsSet.add(slot);
                    } else {
                        availableSlotsSet.add(slot);
                    }
                }
            });
        }

        // Filter out past slots if date is today
        let availableSlots = Array.from(availableSlotsSet)
            .filter(slot => !isPastTime(date, slot))
            .sort();

        res.json({
            available: availableSlots.length > 0,
            date,
            slots: availableSlots,
            appointmentType
        });
    } catch (error) {
        console.error('Error checking specialization availability:', error);
        res.status(500).json({ error: 'Server error checking availability' });
    }
};

// Get all teleconsultation windows for a specialization (union across all active doctors)
exports.getSpecializationTeleWindows = async (req, res) => {
    try {
        const { specializationId } = req.params;

        // Find all active doctors with this specialization (many-to-many via staff_specialization)
        const doctorsResult = await externalQuery(
            `SELECT DISTINCT s.id FROM staff s
             INNER JOIN staff_specialization ss ON ss.staff_id = s.id
             WHERE ss.specialization_id = $1 AND s.is_active = true`,
            [specializationId]
        );

        if (doctorsResult.rows.length === 0) {
            return res.json([]);
        }

        const doctorIds = doctorsResult.rows.map(d => d.id);

        // Fetch all windows for these doctors with names
        const windowsResult = await externalQuery(
            `SELECT ta.day_of_week, ta.start_time, ta.end_time, s.fullname as doctor_name
             FROM doctor_teleconsultation_availabilities ta
             JOIN staff s ON ta.doctor_id = s.id
             WHERE ta.doctor_id = ANY($1)
             ORDER BY s.fullname::text, ta.day_of_week, ta.start_time`,
            [doctorIds]
        );

        // Format names in response
        const windows = windowsResult.rows.map(w => {
            let name = w.doctor_name;
            try {
                if (typeof w.doctor_name === 'string' && w.doctor_name.startsWith('{')) {
                    const parsed = JSON.parse(w.doctor_name);
                    name = `${parsed.first_name || ''} ${parsed.middle_name || ''} ${parsed.last_name || ''}`.trim().replace(/\s+/g, ' ');
                } else if (typeof w.doctor_name === 'object') {
                    name = `${w.doctor_name.first_name || ''} ${w.doctor_name.middle_name || ''} ${w.doctor_name.last_name || ''}`.trim().replace(/\s+/g, ' ');
                }
            } catch (e) { }

            return {
                ...w,
                doctor_name: name
            };
        });

        res.json(windows);
    } catch (error) {
        console.error('Error fetching tele windows:', error);
        res.status(500).json({ error: 'Server error fetching tele windows' });
    }
};

// Helper: Auto-assign a doctor from a specialization for a given date/time
// Picks the doctor with fewest appointments that day who is free at the requested time
const autoAssignDoctor = async (specializationId, appointmentDate, appointmentTime, appointmentType = 'IN_PERSON') => {
    // Find all active doctors with this specialization (many-to-many via staff_specialization)
    const doctorsResult = await externalQuery(
        `SELECT DISTINCT s.id FROM staff s
         INNER JOIN staff_specialization ss ON ss.staff_id = s.id
         WHERE ss.specialization_id = $1 AND s.is_active = true`,
        [specializationId]
    );

    if (doctorsResult.rows.length === 0) {
        throw new Error('No doctors available for this specialization');
    }

    // For each doctor, check if the slot is free and count their daily appointments
    const candidates = [];
    for (const doc of doctorsResult.rows) {
        // Check for doctor unavailability
        const unavailability = await isDoctorUnavailableOnDate(doc.id, appointmentDate);
        if (unavailability.unavailable) {
            console.log(`[AutoAssign] Skipping doctor ${doc.id} - Marked as unavailable: ${unavailability.reason}`);
            continue;
        }

        // IN-PERSON: enforce explicit in_person window for the requested day/time
        if (appointmentType === 'IN_PERSON') {
            const dayOfWeek = new Date(appointmentDate).getDay();
            const inPersonResult = await externalQuery(
                `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities
                 WHERE doctor_id = $1 AND day_of_week = $2 AND window_type = 'in_person'`,
                [doc.id, dayOfWeek]
            );
            if (!isTimeInWindows(appointmentTime, inPersonResult.rows)) {
                continue;
            }
        }

        // Check daily limit
        const dailyCount = await externalQuery(
            `SELECT COUNT(*) as count FROM appointments WHERE staff_id = $1 AND appointment_date = $2`,
            [doc.id, appointmentDate]
        );
        if (parseInt(dailyCount.rows[0].count) >= 10) continue;

        // Check if this specific slot is free
        const conflict = await externalQuery(`
            SELECT id FROM appointments
            WHERE (staff_id = $1 OR doctor_id = $1)
            AND appointment_date = $2
            AND start_time = $3
            AND status != 'cancelled'
        `, [doc.id, appointmentDate, appointmentTime]);

        if (conflict.rows.length === 0) {
            candidates.push({ id: doc.id, count: parseInt(dailyCount.rows[0].count) });
        }
    }

    if (candidates.length === 0) {
        throw new Error('No doctors available at the selected time');
    }

    // Pick doctor with fewest appointments (load balancing)
    candidates.sort((a, b) => a.count - b.count);
    console.log(`[AutoAssign] Assigned doctor ID ${candidates[0].id} (${candidates[0].count} appointments today)`);
    return candidates[0].id;
};

/**
 * Core logic to create an appointment across local and external databases.
 * Handles both standard (registered) and guest (new) patients.
 * Integrates with Google Calendar for teleconsultations.
 */
async function createAppointmentLogic(appointmentData, userId) {
    const { pool } = require('../config/database');
    const { externalQuery, externalPool } = require('../config/externalDatabase');

    const client = await pool.connect();
    let externalClient = null;

    try {
        const {
            specializationId,
            doctorId: requestedDoctorId,
            childId,
            appointmentDate,
            appointmentTime,
            reason,
            notes,
            appointmentType = 'IN_PERSON'
        } = appointmentData;
        const normalizedAppointmentType = normalizeAppointmentType(appointmentType);

        console.log(`[AppointmentLogic] START - type: ${normalizedAppointmentType}, doctor: ${requestedDoctorId}, spec: ${specializationId}, child: ${childId}, date: ${appointmentDate}, time: ${appointmentTime}`);

        // 1. Resolve Doctor
        let doctorId = requestedDoctorId;
        if (!doctorId && specializationId) {
            doctorId = await autoAssignDoctor(specializationId, appointmentDate, appointmentTime, normalizedAppointmentType);
        }

        // Enforce explicit in-person windows at booking time as a final server-side guard.
        if (normalizedAppointmentType === 'IN_PERSON') {
            const dayOfWeek = new Date(appointmentDate).getDay();
            const inPersonResult = await externalQuery(
                `SELECT start_time, end_time FROM doctor_teleconsultation_availabilities
                 WHERE doctor_id = $1 AND day_of_week = $2 AND window_type = 'in_person'`,
                [doctorId, dayOfWeek]
            );
            if (!isTimeInWindows(appointmentTime, inPersonResult.rows)) {
                throw new Error('Doctor is not available for in-person visits at the selected time');
            }
        }

        // 2. Resolve Child & External Registration
        const localChildCheck = await client.query(
            'SELECT registration_number, first_name, last_name, date_of_birth, gender FROM children WHERE id = $1 AND parent_id = $2',
            [childId, userId]
        );

        if (localChildCheck.rows.length === 0) {
            throw new Error('Child not found or unauthorized');
        }

        const localChild = localChildCheck.rows[0];
        let childRegNumber = localChild.registration_number;
        const childFullName = `${localChild.first_name} ${localChild.last_name}`;

        // 3. Database Transaction (External)
        externalClient = await externalPool.connect();
        await externalClient.query('BEGIN');

        let externalChildId;
        let finalRegNumber = childRegNumber;

        if (!childRegNumber) {
            // GUEST FLOW: Create Parent & Child in External DB
            console.log(`[Logic] Guest flow for child ${childId}`);

            // Get User details
            const userResult = await client.query('SELECT phone_number, email, display_name FROM users WHERE id = $1', [userId]);
            const user = userResult.rows[0];

            if (!user?.phone_number) throw new Error('Phone number required for booking');

            // Find or Create Parent
            const parentCheck = await externalClient.query(
                'SELECT id FROM parents WHERE telephone = $1 OR (email IS NOT NULL AND LOWER(email) = LOWER($2))',
                [user.phone_number, user.email]
            );

            let externalParentId;
            if (parentCheck.rows.length > 0) {
                externalParentId = parentCheck.rows[0].id;
            } else {
                const parts = (user.display_name || '').split(' ');
                const first = parts[0] || 'Guest';
                const last = parts.slice(1).join(' ') || 'Parent';
                const fullname = JSON.stringify({ first_name: first, last_name: last });
                const newParent = await externalClient.query(
                    'INSERT INTO parents (fullname, telephone, email, relationship_id, gender_id, created_at, updated_at) VALUES ($1, $2, $3, 1, 2, NOW(), NOW()) RETURNING id',
                    [fullname, user.phone_number, user.email]
                );
                externalParentId = newParent.rows[0].id;
            }

            // Create Child
            const timestamp = Math.floor(Date.now() / 1000);
            finalRegNumber = `GUEST-${timestamp}-${Math.floor(Math.random() * 9000)}`;
            const childFullname = JSON.stringify({ first_name: localChild.first_name, last_name: localChild.last_name });
            const genderId = (localChild.gender || '').toLowerCase() === 'female' ? 2 : 1;

            const newChild = await externalClient.query(
                'INSERT INTO children (fullname, dob, gender_id, registration_number, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
                [childFullname, localChild.date_of_birth, genderId, finalRegNumber]
            );
            externalChildId = newChild.rows[0].id;

            // Link them
            await externalClient.query('INSERT INTO child_parent (parent_id, child_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())', [externalParentId, externalChildId]);

            // Update local child later
        } else {
            // STANDARD FLOW: Lookup existing child
            const extCheck = await externalClient.query('SELECT id FROM children WHERE registration_number = $1', [childRegNumber]);
            if (extCheck.rows.length === 0) throw new Error(`Child registration ${childRegNumber} not found in clinic system`);
            externalChildId = extCheck.rows[0].id;
        }

        // 4. Check for Conflict
        const conflict = await externalClient.query(
            'SELECT id FROM appointments WHERE (staff_id = $1 OR doctor_id = $1) AND appointment_date = $2 AND start_time = $3 AND status != \'cancelled\'',
            [doctorId, appointmentDate, appointmentTime]
        );
        if (conflict.rows.length > 0) throw new Error('Time slot already booked');

        // 5. Create Appointment
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const endTimeStr = `${(hours + 1).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        const appResult = await externalClient.query(
            `INSERT INTO appointments (
                child_id, doctor_id, staff_id, appointment_title, 
                appointment_date, start_time, end_time, status, appointment_type, 
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), NOW()) RETURNING *`,
            [externalChildId, doctorId, 1, childFullName, appointmentDate, appointmentTime, endTimeStr, normalizedAppointmentType]
        );

        const appointment = appResult.rows[0];
        console.log(`[AppointmentLogic] Appointment INSERT result - id: ${appointment.id}, type: ${appointment.appointment_type}`);

        // 6. Google Calendar Integration for Teleconsults
        console.log(`[AppointmentLogic] Checking teleconsult: appointmentType=${normalizedAppointmentType}, condition=${normalizedAppointmentType === 'TELECONSULT'}`);
        if (normalizedAppointmentType === 'TELECONSULT') {
            try {
                googleCalendarService.initialize();
                if (googleCalendarService.isConfigured()) {
                    const userResult = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
                    const userEmail = userResult.rows[0]?.email;

                    const idempotencyKey = googleCalendarService.generateIdempotencyKey(childId, doctorId, appointmentDate, appointmentTime);
                    const event = await googleCalendarService.createCalendarEvent({
                        summary: `Teleconsultation: ${childFullName}`,
                        description: `Teleconsultation booked via app. Reason: ${reason || 'N/A'}\nNotes: ${notes || 'N/A'}`,
                        date: appointmentDate,
                        startTime: appointmentTime,
                        endTime: endTimeStr,
                        attendees: userEmail ? [userEmail] : []
                    }, idempotencyKey);

                    if (event.meetLink) {
                        // Update appointment with Meet link
                        await externalClient.query(
                            'UPDATE appointments SET google_meet_link = $1, google_calendar_event_id = $2, google_calendar_html_link = $3 WHERE id = $4',
                            [event.meetLink, event.eventId, event.htmlLink, appointment.id]
                        );
                        appointment.google_meet_link = event.meetLink;
                        appointment.google_calendar_event_id = event.eventId;
                        appointment.google_calendar_html_link = event.htmlLink;
                        console.log(`[Logic] Added Meet link: ${event.meetLink}`);
                    }
                }
            } catch (calError) {
                console.error('[Logic] Google Calendar failed:', calError.message);
                // Don't fail the whole appointment if calendar fails, but the link will be missing.
            }
        }

        await externalClient.query('COMMIT');

        // Update local child reg number if it was a guest flow
        if (!childRegNumber && finalRegNumber) {
            await client.query('UPDATE children SET registration_number = $1 WHERE id = $2', [finalRegNumber, childId]);
        }

        return appointment;

    } catch (error) {
        if (externalClient) await externalClient.query('ROLLBACK');
        console.error('[Logic] Error:', error);
        throw error;
    } finally {
        client.release();
        if (externalClient) externalClient.release();
    }
}

exports.createAppointmentLogic = createAppointmentLogic;

// Create new appointment (External DB)
exports.createAppointment = async (req, res) => {
    try {
        const appointment = await createAppointmentLogic(req.body, req.user.id);
        res.status(201).json({
            message: 'Appointment request sent successfully',
            appointment,
            details: 'This appointment is now pending approval via the clinic system.'
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(400).json({ error: error.message });
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
                    `SELECT id FROM users WHERE email = $1`,
                    [req.user.email]
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
                a.google_calendar_event_id,
                a.google_calendar_html_link,
                s.fullname as doctor_name,
                ds.specialization as doctor_specialty,
                s.email as doctor_email,
                c.fullname as child_fullname,
                c.registration_number
            FROM appointments a
            JOIN children c ON a.child_id = c.id
            JOIN staff s ON a.doctor_id = s.id
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
        console.log(`[getUserAppointments] Raw results count: ${appointmentsResult.rows.length}`);
        if (appointmentsResult.rows.length > 0) {
            const sample = appointmentsResult.rows[0];
            console.log(`[getUserAppointments] First row sample - id: ${sample.id}, type: ${sample.appointment_type}, meet_link: ${sample.google_meet_link}`);
        }

        // 5. Format Response to match frontend expectations
        const formattedAppointments = appointmentsResult.rows.map(appt => {
            const parseName = (nameField) => {
                if (!nameField) return 'Unknown';
                try {
                    if (typeof nameField === 'string' && nameField.startsWith('{')) {
                        const parsed = JSON.parse(nameField);
                        return `${parsed.first_name || ''} ${parsed.middle_name || ''} ${parsed.last_name || ''}`.trim().replace(/\s+/g, ' ');
                    }
                    if (typeof nameField === 'object') {
                        return `${nameField.first_name || ''} ${nameField.middle_name || ''} ${nameField.last_name || ''}`.trim().replace(/\s+/g, ' ');
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
                google_meet_link: appt.google_meet_link || null,
                google_calendar_html_link: appt.google_calendar_html_link || null
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
    try {
        const {
            child_first_name, child_last_name, child_dob, child_gender, local_child_id,
            doctor_id, specialization_id, appointment_date, start_time, appointment_type
        } = req.body;

        const appointmentData = {
            doctorId: doctor_id,
            specializationId: specialization_id,
            childId: local_child_id,
            appointmentDate: appointment_date,
            appointmentTime: start_time,
            appointmentType: appointment_type || 'IN_PERSON'
        };

        console.log(`[createGuestAppointment] Received body:`, JSON.stringify(req.body));
        console.log(`[createGuestAppointment] Mapped appointmentData:`, JSON.stringify(appointmentData));

        const appointment = await createAppointmentLogic(appointmentData, req.user.id);

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: {
                appointment_id: appointment.id,
                child_id: appointment.child_id,
                google_meet_link: appointment.google_meet_link,
                google_calendar_event_id: appointment.google_calendar_event_id
            }
        });
    } catch (error) {
        console.error('Error creating guest appointment:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

