/**
 * Debug Appointments - Query appointments for Feb 2, 2026
 * Run: cd backend && node src/scripts/debugAppointments.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

const debugAppointments = async () => {
    const client = await pool.connect();
    try {
        console.log('🔍 Querying appointments for February 2nd, 2026...\n');

        // Query all appointments for Feb 2, 2026 with ALL columns
        const result = await client.query(`
            SELECT 
                a.*,
                s.fullname as staff_name,
                c.fullname as child_fullname,
                c.registration_number
            FROM appointments a
            LEFT JOIN staff s ON a.staff_id = s.id
            LEFT JOIN children c ON a.child_id = c.id
            WHERE a.appointment_date = '2026-02-02'
            ORDER BY a.id
        `);

        console.log(`Found ${result.rows.length} appointments for Feb 2, 2026:\n`);

        if (result.rows.length === 0) {
            console.log('No appointments found for this date.');
            return;
        }

        // Print each appointment with emphasis on staff_id and doctor_id
        result.rows.forEach((apt, index) => {
            console.log(`========== APPOINTMENT ${index + 1} ==========`);
            console.log(`ID:                ${apt.id}`);
            console.log(`Child ID:          ${apt.child_id}`);
            console.log(`Child Name:        ${apt.child_fullname}`);
            console.log(`Registration #:    ${apt.registration_number}`);
            console.log('');
            console.log(`⚠️  STAFF_ID:       ${apt.staff_id}`);
            console.log(`⚠️  DOCTOR_ID:      ${apt.doctor_id}`);
            console.log(`Staff Name:        ${apt.staff_name}`);
            console.log('');
            console.log(`Appointment Date:  ${apt.appointment_date}`);
            console.log(`Start Time:        ${apt.start_time}`);
            console.log(`End Time:          ${apt.end_time}`);
            console.log(`Status:            ${apt.status}`);
            console.log(`Type:              ${apt.appointment_type}`);
            console.log(`Google Meet:       ${apt.google_meet_link || 'N/A'}`);
            console.log(`Created At:        ${apt.created_at}`);
            console.log('');
            console.log('--- ALL RAW FIELDS ---');
            console.log(JSON.stringify(apt, null, 2));
            console.log('\n');
        });

        // Summary
        console.log('========== SUMMARY ==========');
        result.rows.forEach((apt, index) => {
            console.log(`Apt ${apt.id}: staff_id=${apt.staff_id}, doctor_id=${apt.doctor_id}, child="${apt.child_fullname}"`);
        });

    } catch (error) {
        console.error('❌ Query failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Run
debugAppointments()
    .then(() => {
        console.log('\n✅ Debug query completed!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
