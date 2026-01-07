
require('dotenv').config();
const { externalQuery, externalPool } = require('../config/externalDatabase');
const { pool } = require('../config/database');

// Configuration: Registration Number of a known child (Yebo)
const TEST_REG_NUMBER = '002-2025';

async function testMyAppointments() {
    try {
        console.log('--- Testing My Appointments Logic ---');
        console.log(`Using Test Registration Number: ${TEST_REG_NUMBER}`);

        // 1. Simulate finding External Child ID from Reg Number
        // (In the real app, we get Reg Number from Local Child table first)
        const childRes = await externalQuery(
            `SELECT id, fullname FROM children WHERE registration_number = $1`,
            [TEST_REG_NUMBER]
        );

        if (childRes.rows.length === 0) {
            console.error('Test Child not found in External DB.');
            return;
        }

        const externalChildId = childRes.rows[0].id;
        console.log(`Resolved External Child ID: ${externalChildId} (${childRes.rows[0].fullname})`);

        // 2. Fetch Appointments for this Child
        const appointmentsRes = await externalQuery(`
            SELECT 
                a.id,
                a.appointment_date,
                a.start_time,
                a.status,
                s.fullname as doctor_name
            FROM appointments a
            JOIN staff s ON a.staff_id = s.id
            WHERE a.child_id = $1
            ORDER BY a.appointment_date DESC, a.start_time DESC
        `, [externalChildId]);

        console.log(`Found ${appointmentsRes.rows.length} appointments.`);
        appointmentsRes.rows.forEach(appt => {
            console.log(`- ID: ${appt.id} | Date: ${appt.appointment_date} | Time: ${appt.start_time} | Status: ${appt.status} | Dr: ${appt.doctor_name}`);
        });

        // 3. Test Cancellation (if any pending appointment exists)
        const pendingAppt = appointmentsRes.rows.find(a => a.status === 'pending');

        if (pendingAppt) {
            console.log(`\nAttempting to cancel Appointment ID: ${pendingAppt.id}...`);
            const cancelRes = await externalQuery(`
                UPDATE appointments 
                SET status = 'cancelled', updated_at = NOW()
                WHERE id = $1
                RETURNING *
            `, [pendingAppt.id]);

            console.log('Cancellation Result:', cancelRes.rows[0].status);
        } else {
            console.log('\nNo "pending" appointments found to test cancellation.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await externalPool.end();
        await pool.end();
    }
}

testMyAppointments();
