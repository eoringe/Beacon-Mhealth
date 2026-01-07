
require('dotenv').config();
const { externalQuery, externalPool } = require('../config/externalDatabase');

async function testAvailability() {
    try {
        console.log('--- Testing Availability Queries ---');

        // 1. Get a Doctor
        const doctorRes = await externalQuery(`SELECT id, fullname FROM staff WHERE role_id = '2' LIMIT 1`); // assuming role 2 is doctor/therapist from previous knowledge
        if (doctorRes.rows.length === 0) {
            console.log('No doctors found.');
            return;
        }
        const doctor = doctorRes.rows[0];
        console.log('Testing with Doctor:', doctor.fullname, '(ID:', doctor.id, ')');

        // 2. Check Daily Count
        const date = new Date().toISOString().split('T')[0]; // Today
        const countRes = await externalQuery(
            `SELECT COUNT(*) as count FROM appointments WHERE staff_id = $1 AND appointment_date = $2`,
            [doctor.id, date]
        );
        console.log('Daily Appointments Count:', countRes.rows[0].count);

        // 3. Check Booked Slots
        const bookedRes = await externalQuery(`
            SELECT start_time, end_time
            FROM appointments
            WHERE (staff_id = $1 OR doctor_id = $1)
              AND appointment_date = $2 
              AND status != 'cancelled'
        `, [doctor.id, date]);
        console.log('Booked Slots:', bookedRes.rows);

        // 4. Check Child Lookup by Registration Number
        console.log('\n--- Testing Child Lookup ---');
        // Let's try to find ANY child with a registration number
        const childRes = await externalQuery(`SELECT id, fullname, registration_number FROM children WHERE registration_number IS NOT NULL LIMIT 1`);
        if (childRes.rows.length > 0) {
            console.log('Found Linked Child:', childRes.rows[0]);
        } else {
            console.log('No children with registration numbers found in external DB.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
        console.error(error.stack);
    } finally {
        await externalPool.end();
    }
}

testAvailability();
