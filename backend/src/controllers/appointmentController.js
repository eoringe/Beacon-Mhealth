const { pool } = require('../config/database');

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
exports.getDoctorAvailability = async (req, res) => {
    const client = await pool.connect();
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

        // Check if doctor exists and is available
        const doctorCheck = await client.query(
            'SELECT is_available FROM doctors WHERE id = $1',
            [doctorId]
        );

        if (doctorCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (!doctorCheck.rows[0].is_available) {
            return res.json({ available: false, reason: 'Doctor is currently unavailable', slots: [] });
        }

        // Check doctor unavailability
        const unavailabilityCheck = await client.query(`
            SELECT * FROM doctor_unavailability
            WHERE doctor_id = $1 AND unavailable_date = $2
        `, [doctorId, date]);

        if (unavailabilityCheck.rows.length > 0) {
            return res.json({
                available: false,
                reason: unavailabilityCheck.rows[0].reason || 'Doctor is unavailable',
                slots: []
            });
        }

        // Get all booked appointments for this doctor on this date
        const bookedSlots = await client.query(`
            SELECT appointment_time 
            FROM appointments
            WHERE doctor_id = $1 
              AND appointment_date = $2 
              AND status != 'cancelled'
        `, [doctorId, date]);

        const bookedTimes = bookedSlots.rows.map(row => row.appointment_time.substring(0, 5));

        // Generate all possible slots and filter out booked ones
        const allSlots = generateTimeSlots();
        let availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

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
    } finally {
        client.release();
    }
};

// Create new appointment
exports.createAppointment = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const { doctorId, childId, appointmentDate, appointmentTime, reason, notes } = req.body;

        // Validation
        if (!doctorId || !appointmentDate || !appointmentTime) {
            return res.status(400).json({
                error: 'Doctor ID, appointment date, and time are required'
            });
        }

        // Check if weekend
        if (isWeekend(appointmentDate)) {
            return res.status(400).json({ error: 'Cannot book appointments on weekends' });
        }

        // Check working hours
        if (!isWithinWorkingHours(appointmentTime)) {
            return res.status(400).json({
                error: 'Appointments are only available between 8:00 AM and 5:00 PM'
            });
        }

        // Check if time is in the past
        if (isPastTime(appointmentDate, appointmentTime)) {
            return res.status(400).json({
                error: 'Cannot book appointments in the past'
            });
        }

        // Check if child belongs to user (if child_id provided)
        if (childId) {
            const childCheck = await client.query(
                'SELECT * FROM children WHERE id = $1 AND parent_id = $2',
                [childId, userId]
            );
            if (childCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Child not found or unauthorized' });
            }
        }

        // Check doctor availability
        const doctorCheck = await client.query(
            'SELECT is_available FROM doctors WHERE id = $1',
            [doctorId]
        );

        if (doctorCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (!doctorCheck.rows[0].is_available) {
            return res.status(400).json({ error: 'Doctor is currently unavailable' });
        }

        // Check for doctor unavailability on this date/time
        const unavailabilityCheck = await client.query(`
            SELECT * FROM doctor_unavailability
            WHERE doctor_id = $1 AND unavailable_date = $2
        `, [doctorId, appointmentDate]);

        if (unavailabilityCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'Doctor is unavailable on this date',
                reason: unavailabilityCheck.rows[0].reason
            });
        }

        // Check for conflicts (same doctor, date, time)
        const conflictCheck = await client.query(`
            SELECT * FROM appointments
            WHERE doctor_id = $1 
              AND appointment_date = $2 
              AND appointment_time = $3
              AND status != 'cancelled'
        `, [doctorId, appointmentDate, appointmentTime]);

        if (conflictCheck.rows.length > 0) {
            return res.status(409).json({
                error: 'This time slot is already booked. Please choose another time.'
            });
        }

        // Create appointment
        const insertQuery = `
            INSERT INTO appointments (
                parent_id, child_id, doctor_id, appointment_date, 
                appointment_time, duration_minutes, reason, notes, status
            )
            VALUES ($1, $2, $3, $4, $5, 60, $6, $7, 'scheduled')
            RETURNING *;
        `;

        const result = await client.query(insertQuery, [
            userId,
            childId || null,
            doctorId,
            appointmentDate,
            appointmentTime,
            reason || null,
            notes || null
        ]);

        // Fetch complete appointment with doctor and child info
        const completeAppointment = await client.query(`
            SELECT 
                a.*,
                d.name as doctor_name,
                d.specialty as doctor_specialty,
                d.photo_url as doctor_photo,
                CONCAT(c.first_name, ' ', c.last_name) as child_name
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN children c ON a.child_id = c.id
            WHERE a.id = $1
        `, [result.rows[0].id]);

        res.status(201).json(completeAppointment.rows[0]);
    } catch (error) {
        console.error('Error creating appointment:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({
                error: 'This time slot is already booked. Please choose another time.'
            });
        }
        res.status(500).json({ error: 'Server error creating appointment' });
    } finally {
        client.release();
    }
};

// Get user's appointments
exports.getUserAppointments = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = `
            SELECT 
                a.*,
                d.name as doctor_name,
                d.specialty as doctor_specialty,
                d.photo_url as doctor_photo,
                d.phone as doctor_phone,
                CONCAT(c.first_name, ' ', c.last_name) as child_name
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN children c ON a.child_id = c.id
            WHERE a.parent_id = $1
        `;

        const params = [userId];

        if (status) {
            query += ' AND a.status = $2';
            params.push(status);
        }

        query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

        const result = await client.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Server error fetching appointments', details: error.message });
    } finally {
        client.release();
    }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const { appointmentId } = req.params;

        // Check if appointment exists and belongs to user
        const checkQuery = `
            SELECT * FROM appointments 
            WHERE id = $1 AND parent_id = $2
        `;
        const checkResult = await client.query(checkQuery, [appointmentId, userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or unauthorized' });
        }

        if (checkResult.rows[0].status === 'cancelled') {
            return res.status(400).json({ error: 'Appointment is already cancelled' });
        }

        // Update appointment status
        const updateQuery = `
            UPDATE appointments 
            SET status = 'cancelled', updated_at = NOW()
            WHERE id = $1
            RETURNING *;
        `;
        const result = await client.query(updateQuery, [appointmentId]);

        res.json({ message: 'Appointment cancelled successfully', appointment: result.rows[0] });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ error: 'Server error cancelling appointment' });
    } finally {
        client.release();
    }
};

// Delete appointment (hard delete)
exports.deleteAppointment = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const { appointmentId } = req.params;

        const result = await client.query(
            'DELETE FROM appointments WHERE id = $1 AND parent_id = $2 RETURNING *',
            [appointmentId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Appointment not found or unauthorized' });
        }

        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ error: 'Server error deleting appointment' });
    } finally {
        client.release();
    }
};
