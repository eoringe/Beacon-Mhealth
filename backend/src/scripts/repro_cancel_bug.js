const { externalQuery } = require('../config/externalDatabase');
const fs = require('fs');

const log = (msg) => {
    fs.appendFileSync('repro_log.txt', msg + '\n');
    console.log(msg);
};

async function repro() {
    fs.writeFileSync('repro_log.txt', ''); // Clear file
    log('--- Reproduction Script: Cancel Bug ---');
    try {
        // 1. Insert Dummy Appointment (Manual)
        // We need valid child_id and staff_id. We'll reuse existing ones if possible or use hardcoded knowns from previous logs if any.
        // Let's assume child_id=1 and staff_id=1 exist for testing, or query one first.

        const childRes = await externalQuery('SELECT id FROM children LIMIT 1');
        const staffRes = await externalQuery('SELECT id FROM staff LIMIT 1');

        if (childRes.rows.length === 0 || staffRes.rows.length === 0) {
            log('Cannot run test: No children or staff found in external DB.');
            process.exit(1);
        }

        const childId = childRes.rows[0].id;
        const staffId = staffRes.rows[0].id; // doctor_id

        log(`Using Child ID: ${childId}, Staff ID: ${staffId}`);

        const insertQuery = `
            INSERT INTO appointments (
                child_id, staff_id, doctor_id,
                appointment_title, appointment_date,
                start_time, end_time, status,
                created_at, updated_at
            )
            VALUES ($1, $2, $2, 'TEST APPOINTMENT', '2025-12-31', '23:00', '23:59', 'pending', NOW(), NOW())
            RETURNING id, status
        `;

        const insertRes = await externalQuery(insertQuery, [childId, staffId]);
        const newId = insertRes.rows[0].id;
        log(`Inserted Test Appointment ID: ${newId}, Status: ${insertRes.rows[0].status}`);

        // 2. Try cancelling with 'cancelled' (Two Ls)
        log('Attempting UPDATE status = \'cancelled\'...');
        try {
            const updateRes1 = await externalQuery(`
                UPDATE appointments
                SET status = 'cancelled'
                WHERE id = $1
                RETURNING status
            `, [newId]);

            if (updateRes1.rows.length > 0) {
                log(`Result 1 Status: ${updateRes1.rows[0].status}`);
            } else {
                log('Result 1: No rows returned (Update failed effectively?)');
            }
        } catch (e) { log('Result 1 Error: ' + e.message); }

        // 3. Try cancelling with 'canceled' (One L)
        log('Attempting UPDATE status = \'canceled\'...');
        try {
            const updateRes2 = await externalQuery(`
                UPDATE appointments
                SET status = 'canceled'
                WHERE id = $1
                RETURNING status
            `, [newId]);

            if (updateRes2.rows.length > 0) {
                log(`Result 2 Status: ${updateRes2.rows[0].status}`);
            } else {
                log('Result 2: No rows returned.');
            }
        } catch (e) { log('Result 2 Error: ' + e.message); }

        // 4. Cleanup
        await externalQuery('DELETE FROM appointments WHERE id = $1', [newId]);
        log('Cleaned up test row.');

    } catch (e) {
        log('Error: ' + e);
    } finally {
        process.exit();
    }
}

repro();
